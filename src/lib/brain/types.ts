/**
 * Brain Module Types
 *
 * Type definitions for the Smart Wiki brain
 */

// ============================================
// Document Types
// ============================================

export interface WikiDocument {
  id: string;
  title: string;
  text: string;
  url?: string;
  collectionId?: string;
  updatedAt?: string;
}

export interface VectorRecord {
  id: string;
  vector: number[];
  text: string;
  title: string;
  url: string;
  documentId?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface SearchResult {
  id: string;
  text: string;
  title: string;
  url: string;
  score?: number;
}

// ============================================
// Configuration Types
// ============================================

export interface EmbeddingConfig {
  model?: string;
  dimensions?: number;
}

export interface LlmConfig {
  model?: string;
  temperature?: number;
}

export interface VectorStoreConfig {
  tableName?: string;
  dataDir?: string;
}

export interface ChunkingConfig {
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface SmartConfig {
  enabled?: boolean;
  openaiApiKey?: string;
  embedding?: EmbeddingConfig;
  llm?: LlmConfig;
  vectorStore?: VectorStoreConfig;
  chunking?: ChunkingConfig;
}

// ============================================
// Service Interfaces (for DI)
// ============================================

export interface IEmbeddingService {
  isEnabled(): boolean;
  getDimensions(): number;
  getEmbedding(text: string): Promise<number[]>;
  getEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface ILlmProcessor {
  isEnabled(): boolean;
  summarize(text: string, language?: string): Promise<string>;
  suggestTags(text: string): Promise<string[]>;
  answerFromContext(question: string, context: string): Promise<string>;
  generateMermaid(description: string): Promise<string>;
}

export interface IVectorStore {
  init(): Promise<void>;
  save(records: VectorRecord[]): Promise<number>;
  upsert(records: VectorRecord[]): Promise<number>;
  search(queryVector: number[], limit?: number): Promise<SearchResult[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
  getDocumentIds(): Promise<Map<string, string>>;
  deleteByDocumentId(documentId: string): Promise<void>;
}

export interface SyncResult {
  chunks: number;
  documents: number;
  skipped?: number;
  updated?: number;
}

export interface IBrain {
  isEnabled(): boolean;
  syncDocuments(docs: WikiDocument[]): Promise<SyncResult>;
  syncDocument(doc: WikiDocument): Promise<{ synced: boolean; chunks: number }>;
  search(query: string, limit?: number): Promise<SearchResult[]>;
  ask(question: string): Promise<{ answer: string; sources: SearchResult[] }>;
  summarize(text: string, language?: string): Promise<string>;
  suggestTags(text: string): Promise<string[]>;
  generateDiagram(description: string): Promise<string>;
  getStats(): Promise<{ enabled: boolean; chunks: number }>;
  clear(): Promise<void>;
}
