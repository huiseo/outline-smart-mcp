/**
 * Smart Handlers
 *
 * AI-powered tool handlers for intelligent wiki operations
 */

import type { AppContext } from '../context.js';
import type { OutlineDocument } from '../types/api.js';
import type { WikiDocument } from '../brain/types.js';
import { ERROR_MESSAGES } from '../brain/constants.js';

/** Batch size for parallel document fetching */
const BATCH_SIZE = 10;

/** Fetch error details */
interface FetchError {
  documentId: string;
  error: string;
}

export function createSmartHandlers({ apiClient, apiCall, config, brain }: AppContext) {
  const baseUrl = config.OUTLINE_URL;

  /**
   * Fetch documents in parallel batches to avoid overwhelming the API
   */
  async function fetchDocumentsBatch(
    docs: OutlineDocument[]
  ): Promise<{ wikiDocs: WikiDocument[]; errors: FetchError[] }> {
    const wikiDocs: WikiDocument[] = [];
    const errors: FetchError[] = [];

    // Process in batches
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((doc) =>
          apiCall(() => apiClient.post<OutlineDocument>('/documents.info', { id: doc.id }))
        )
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const doc = batch[j];

        if (result.status === 'fulfilled') {
          const fullDoc = result.value.data;
          if (fullDoc && fullDoc.text) {
            wikiDocs.push({
              id: fullDoc.id,
              title: fullDoc.title,
              text: fullDoc.text,
              url: `${baseUrl}${fullDoc.url}`,
              collectionId: fullDoc.collectionId,
              updatedAt: fullDoc.updatedAt,
            });
          }
        } else {
          // Log error details for debugging
          const errorMessage =
            result.reason instanceof Error ? result.reason.message : String(result.reason);
          errors.push({
            documentId: doc.id,
            error: errorMessage,
          });
          console.error(`[sync_knowledge] Failed to fetch document ${doc.id}: ${errorMessage}`);
        }
      }
    }

    return { wikiDocs, errors };
  }

  return {
    /**
     * Sync all documents to vector store for RAG
     *
     * Note: documents.list may return truncated or missing text,
     * so we fetch each document's full content via documents.info
     *
     * Performance: Uses parallel batching (10 docs at a time) to speed up sync
     */
    async sync_knowledge(args: { collectionId?: string }) {
      if (!brain.isEnabled()) {
        return { error: ERROR_MESSAGES.SMART_FEATURES_DISABLED };
      }

      // Step 1: Fetch document list from Outline
      const payload: Record<string, unknown> = { limit: 100 };
      if (args.collectionId) {
        payload.collectionId = args.collectionId;
      }

      const { data: docList } = await apiCall(() =>
        apiClient.post<OutlineDocument[]>('/documents.list', payload)
      );

      if (!docList || docList.length === 0) {
        return { message: ERROR_MESSAGES.NO_DOCUMENTS_FOUND, synced: 0 };
      }

      // Step 2: Fetch full content for each document in parallel batches
      const { wikiDocs, errors } = await fetchDocumentsBatch(docList);

      if (wikiDocs.length === 0) {
        return {
          message: ERROR_MESSAGES.NO_DOCUMENTS_WITH_CONTENT,
          synced: 0,
          errors: errors.length,
          errorDetails: errors.slice(0, 5), // Return first 5 errors for debugging
        };
      }

      // Step 3: Sync to brain (vectorize) - incremental sync
      const result = await brain.syncDocuments(wikiDocs);

      return {
        message: `Synced ${result.documents} new/updated documents (${result.chunks} chunks). Skipped ${result.skipped || 0} unchanged.`,
        documents: result.documents,
        chunks: result.chunks,
        skipped: result.skipped || 0,
        updated: result.updated || 0,
        errors: errors.length,
        ...(errors.length > 0 && { errorDetails: errors.slice(0, 5) }),
      };
    },

    /**
     * Ask a question and get an answer based on wiki content
     */
    async ask_wiki(args: { question: string }) {
      if (!brain.isEnabled()) {
        return { error: ERROR_MESSAGES.SMART_FEATURES_DISABLED };
      }

      const { answer, sources } = await brain.ask(args.question);

      return {
        answer,
        sources: sources.map((s) => ({
          title: s.title,
          url: s.url,
        })),
      };
    },

    /**
     * Summarize a document (auto-syncs to vector DB)
     */
    async summarize_document(args: { documentId: string; language?: string }) {
      if (!brain.isEnabled()) {
        return { error: ERROR_MESSAGES.SMART_FEATURES_DISABLED };
      }

      // Fetch document
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.info', { id: args.documentId })
      );

      if (!data.text) {
        return { error: ERROR_MESSAGES.NO_CONTENT_TO_SUMMARIZE };
      }

      // Auto-sync document to vector DB for future searches
      await brain.syncDocument({
        id: data.id,
        title: data.title,
        text: data.text,
        url: `${baseUrl}${data.url}`,
        collectionId: data.collectionId,
        updatedAt: data.updatedAt,
      });

      const summary = await brain.summarize(data.text, args.language);

      return {
        documentId: data.id,
        title: data.title,
        summary,
      };
    },

    /**
     * Suggest tags for a document (auto-syncs to vector DB)
     */
    async suggest_tags(args: { documentId: string }) {
      if (!brain.isEnabled()) {
        return { error: ERROR_MESSAGES.SMART_FEATURES_DISABLED };
      }

      // Fetch document
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.info', { id: args.documentId })
      );

      if (!data.text) {
        return { error: ERROR_MESSAGES.NO_CONTENT_TO_ANALYZE };
      }

      // Auto-sync document to vector DB for future searches
      await brain.syncDocument({
        id: data.id,
        title: data.title,
        text: data.text,
        url: `${baseUrl}${data.url}`,
        collectionId: data.collectionId,
        updatedAt: data.updatedAt,
      });

      const tags = await brain.suggestTags(data.text);

      return {
        documentId: data.id,
        title: data.title,
        suggestedTags: tags,
      };
    },

    /**
     * Find documents related to a specific document (auto-syncs to vector DB)
     */
    async find_related(args: { documentId: string; limit?: number }) {
      if (!brain.isEnabled()) {
        return { error: ERROR_MESSAGES.SMART_FEATURES_DISABLED };
      }

      // Fetch document
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.info', { id: args.documentId })
      );

      if (!data.text) {
        return { error: ERROR_MESSAGES.NO_CONTENT_TO_ANALYZE };
      }

      // Auto-sync document to vector DB for future searches
      await brain.syncDocument({
        id: data.id,
        title: data.title,
        text: data.text,
        url: `${baseUrl}${data.url}`,
        collectionId: data.collectionId,
        updatedAt: data.updatedAt,
      });

      // Search for similar documents
      const results = await brain.search(data.title + ' ' + data.text.substring(0, 500), args.limit || 5);

      // Filter out the source document
      const related = results.filter((r) => !r.id.startsWith(args.documentId));

      return {
        documentId: data.id,
        title: data.title,
        related: related.map((r) => ({
          title: r.title,
          url: r.url,
          excerpt: r.text.substring(0, 200) + '...',
        })),
      };
    },

    /**
     * Generate a Mermaid diagram from description
     */
    async generate_diagram(args: { description: string }) {
      if (!brain.isEnabled()) {
        return { error: ERROR_MESSAGES.SMART_FEATURES_DISABLED };
      }

      const diagram = await brain.generateDiagram(args.description);

      return {
        diagram,
        note: 'Copy this Mermaid code into an Outline document to render the diagram.',
      };
    },

    /**
     * Get brain status
     */
    async smart_status() {
      const stats = await brain.getStats();

      return {
        enabled: stats.enabled,
        indexedChunks: stats.chunks,
        message: stats.enabled
          ? `Smart features are enabled with ${stats.chunks} indexed chunks.`
          : ERROR_MESSAGES.SMART_FEATURES_DISABLED,
      };
    },
  };
}
