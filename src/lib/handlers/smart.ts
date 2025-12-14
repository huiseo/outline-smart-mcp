/**
 * Smart Handlers
 *
 * AI-powered tool handlers for intelligent wiki operations
 */

import type { AppContext } from '../context.js';
import type { OutlineDocument } from '../types/api.js';
import type { WikiDocument } from '../brain/types.js';
import { ERROR_MESSAGES } from '../brain/constants.js';

export function createSmartHandlers({ apiClient, apiCall, config, brain }: AppContext) {
  const baseUrl = config.OUTLINE_URL;

  return {
    /**
     * Sync all documents to vector store for RAG
     *
     * Note: documents.list may return truncated or missing text,
     * so we fetch each document's full content via documents.info
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

      // Step 2: Fetch full content for each document (list API may truncate text)
      const wikiDocs: WikiDocument[] = [];
      let fetchErrors = 0;

      for (const doc of docList) {
        try {
          const { data: fullDoc } = await apiCall(() =>
            apiClient.post<OutlineDocument>('/documents.info', { id: doc.id })
          );

          if (fullDoc && fullDoc.text) {
            wikiDocs.push({
              id: fullDoc.id,
              title: fullDoc.title,
              text: fullDoc.text,
              url: `${baseUrl}${fullDoc.url}`,
              collectionId: fullDoc.collectionId,
            });
          }
        } catch {
          fetchErrors++;
        }
      }

      if (wikiDocs.length === 0) {
        return {
          message: ERROR_MESSAGES.NO_DOCUMENTS_WITH_CONTENT,
          synced: 0,
          errors: fetchErrors,
        };
      }

      // Step 3: Sync to brain (vectorize)
      const result = await brain.syncDocuments(wikiDocs);

      return {
        message: `Successfully synced ${result.documents} documents (${result.chunks} chunks).`,
        documents: result.documents,
        chunks: result.chunks,
        skipped: docList.length - wikiDocs.length,
        errors: fetchErrors,
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
     * Summarize a document
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

      const summary = await brain.summarize(data.text, args.language);

      return {
        documentId: data.id,
        title: data.title,
        summary,
      };
    },

    /**
     * Suggest tags for a document
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

      const tags = await brain.suggestTags(data.text);

      return {
        documentId: data.id,
        title: data.title,
        suggestedTags: tags,
      };
    },

    /**
     * Find documents related to a specific document
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
