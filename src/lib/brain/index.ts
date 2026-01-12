/**
 * Brain Module
 *
 * Smart Wiki brain that combines Vector DB and LLM for intelligent operations
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { EmbeddingService } from './embeddings.js';
import { VectorStore } from './vector-store.js';
import { LlmProcessor } from './processor.js';
import { CHUNKING, SEARCH, ERROR_MESSAGES } from './constants.js';
import type {
  WikiDocument,
  VectorRecord,
  SearchResult,
  SmartConfig,
  IBrain,
  IEmbeddingService,
  ILlmProcessor,
  IVectorStore,
  SyncResult,
} from './types.js';

export type { WikiDocument, VectorRecord, SearchResult, SmartConfig, IBrain, SyncResult };

/** Batch size for parallel embedding generation */
const EMBEDDING_BATCH_SIZE = 5;

export interface BrainDependencies {
  embeddings: IEmbeddingService;
  store: IVectorStore;
  processor: ILlmProcessor;
}

export class Brain implements IBrain {
  private readonly embeddings: IEmbeddingService;
  private readonly store: IVectorStore;
  private readonly processor: ILlmProcessor;
  private readonly enabled: boolean;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private initialized: boolean = false;

  constructor(config: SmartConfig = {}, deps?: BrainDependencies) {
    const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    const enabledEnv = process.env.ENABLE_SMART_FEATURES === 'true';

    this.enabled = config.enabled ?? (enabledEnv && !!apiKey);
    this.chunkSize = config.chunking?.chunkSize ?? CHUNKING.CHUNK_SIZE;
    this.chunkOverlap = config.chunking?.chunkOverlap ?? CHUNKING.CHUNK_OVERLAP;

    // Use injected dependencies or create default implementations
    if (deps) {
      this.embeddings = deps.embeddings;
      this.store = deps.store;
      this.processor = deps.processor;
    } else {
      this.embeddings = new EmbeddingService(apiKey, config.embedding);
      this.store = new VectorStore(config.vectorStore, this.embeddings.getDimensions());
      this.processor = new LlmProcessor(apiKey, config.llm);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private checkEnabled(): void {
    if (!this.enabled) {
      throw new Error(ERROR_MESSAGES.SMART_FEATURES_DISABLED);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.store.init();
      this.initialized = true;
    }
  }

  /**
   * Sync documents to vector store with incremental updates
   * Only processes documents that are new or updated since last sync
   */
  async syncDocuments(docs: WikiDocument[]): Promise<SyncResult> {
    this.checkEnabled();
    await this.ensureInitialized();

    // Get existing document timestamps from vector store
    const existingDocs = await this.store.getDocumentIds();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });

    const records: VectorRecord[] = [];
    let processedDocs = 0;
    let skippedDocs = 0;
    let updatedDocs = 0;

    for (const doc of docs) {
      if (!doc.text || doc.text.trim().length === 0) {
        skippedDocs++;
        continue;
      }

      // Check if document needs sync (new or updated)
      const existingTimestamp = existingDocs.get(doc.id);
      const docTimestamp = doc.updatedAt || '';

      if (existingTimestamp && docTimestamp && existingTimestamp >= docTimestamp) {
        // Document hasn't changed, skip
        skippedDocs++;
        continue;
      }

      // If document exists but is updated, delete old chunks first
      if (existingTimestamp) {
        await this.store.deleteByDocumentId(doc.id);
        updatedDocs++;
      }

      // Process document
      const chunks = await splitter.createDocuments([doc.text]);

      // Process embeddings in batches for better performance
      for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
        const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
        const texts = batch.map((c) => c.pageContent);
        const vectors = await this.embeddings.getEmbeddings(texts);

        for (let j = 0; j < batch.length; j++) {
          records.push({
            id: `${doc.id}-chunk-${i + j}`,
            vector: vectors[j],
            text: batch[j].pageContent,
            title: doc.title,
            url: doc.url || `https://app.getoutline.com/doc/${doc.id}`,
            documentId: doc.id,
            updatedAt: doc.updatedAt,
          });
        }
      }

      processedDocs++;
    }

    if (records.length > 0) {
      await this.store.upsert(records);
    }

    return {
      chunks: records.length,
      documents: processedDocs,
      skipped: skippedDocs,
      updated: updatedDocs,
    };
  }

  /**
   * Sync a single document to vector store (for real-time updates)
   */
  async syncDocument(doc: WikiDocument): Promise<{ synced: boolean; chunks: number }> {
    this.checkEnabled();
    await this.ensureInitialized();

    if (!doc.text || doc.text.trim().length === 0) {
      return { synced: false, chunks: 0 };
    }

    // Check if document needs sync
    const existingDocs = await this.store.getDocumentIds();
    const existingTimestamp = existingDocs.get(doc.id);
    const docTimestamp = doc.updatedAt || '';

    if (existingTimestamp && docTimestamp && existingTimestamp >= docTimestamp) {
      // Document hasn't changed
      return { synced: false, chunks: 0 };
    }

    // Delete old chunks if exists
    if (existingTimestamp) {
      await this.store.deleteByDocumentId(doc.id);
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });

    const chunks = await splitter.createDocuments([doc.text]);
    const records: VectorRecord[] = [];

    // Process embeddings in batches
    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const texts = batch.map((c) => c.pageContent);
      const vectors = await this.embeddings.getEmbeddings(texts);

      for (let j = 0; j < batch.length; j++) {
        records.push({
          id: `${doc.id}-chunk-${i + j}`,
          vector: vectors[j],
          text: batch[j].pageContent,
          title: doc.title,
          url: doc.url || `https://app.getoutline.com/doc/${doc.id}`,
          documentId: doc.id,
          updatedAt: doc.updatedAt,
        });
      }
    }

    if (records.length > 0) {
      await this.store.upsert(records);
    }

    return { synced: true, chunks: records.length };
  }

  /**
   * Search for relevant documents
   */
  async search(query: string, limit: number = SEARCH.DEFAULT_LIMIT): Promise<SearchResult[]> {
    this.checkEnabled();
    await this.ensureInitialized();

    const queryVector = await this.embeddings.getEmbedding(query);
    return this.store.search(queryVector, limit);
  }

  /**
   * Ask a question and get an answer based on wiki content
   */
  async ask(question: string): Promise<{ answer: string; sources: SearchResult[] }> {
    this.checkEnabled();
    await this.ensureInitialized();

    // Search for relevant content
    const results = await this.search(question, SEARCH.DEFAULT_LIMIT);

    if (results.length === 0) {
      return {
        answer: ERROR_MESSAGES.NO_RELEVANT_DOCUMENTS,
        sources: [],
      };
    }

    // Build context from search results
    const context = results
      .map((r) => `[Document: ${r.title}]\n[URL: ${r.url}]\n${r.text}`)
      .join('\n\n---\n\n');

    // Generate answer
    const answer = await this.processor.answerFromContext(question, context);

    return { answer, sources: results };
  }

  /**
   * Summarize a document
   */
  async summarize(text: string, language?: string): Promise<string> {
    this.checkEnabled();
    return this.processor.summarize(text, language);
  }

  /**
   * Suggest tags for a document
   */
  async suggestTags(text: string): Promise<string[]> {
    this.checkEnabled();
    return this.processor.suggestTags(text);
  }

  /**
   * Generate Mermaid diagram from description
   */
  async generateDiagram(description: string): Promise<string> {
    this.checkEnabled();
    return this.processor.generateMermaid(description);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{ enabled: boolean; chunks: number }> {
    if (!this.enabled) {
      return { enabled: false, chunks: 0 };
    }

    await this.ensureInitialized();
    const count = await this.store.count();

    return { enabled: true, chunks: count };
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    this.checkEnabled();
    await this.ensureInitialized();
    await this.store.clear();
  }
}

/**
 * Factory function to create a Brain instance
 */
export function createBrain(config?: SmartConfig, deps?: BrainDependencies): Brain {
  return new Brain(config, deps);
}

// Re-export services for external use
export { EmbeddingService } from './embeddings.js';
export { VectorStore } from './vector-store.js';
export { LlmProcessor } from './processor.js';
export * from './constants.js';
