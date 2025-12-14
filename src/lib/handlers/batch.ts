/**
 * Batch Operation Handlers
 *
 * Batch operation handlers
 */

import type { AppContext } from '../context.js';
import type { OutlineDocument } from '../types/api.js';
import type { BatchResult, BatchSummary } from '../types/batch.js';
import { checkAccess } from '../access-control.js';
import { getErrorMessage } from '../formatters/batch.js';
import type {
  BatchCreateDocumentsInput,
  BatchUpdateDocumentsInput,
  BatchMoveDocumentsInput,
  BatchArchiveDocumentsInput,
  BatchDeleteDocumentsInput,
} from '../schemas.js';

/** Batch operation execution helper */
async function runBatch<TItem>(
  items: TItem[],
  operation: (item: TItem) => Promise<BatchResult>
): Promise<BatchSummary> {
  const results: BatchResult[] = [];
  for (const item of items) {
    results.push(await operation(item));
  }
  const succeeded = results.filter((r) => r.success).length;
  return { total: results.length, succeeded, failed: results.length - succeeded, results };
}

export function createBatchHandlers({ apiClient, apiCall, config }: AppContext) {
  return {
    async batch_create_documents(args: BatchCreateDocumentsInput) {
      checkAccess(config, 'batch_create_documents');

      return runBatch(args.documents, async (doc) => {
        try {
          const { data } = await apiCall(() =>
            apiClient.post<OutlineDocument>('/documents.create', {
              title: doc.title,
              text: doc.text,
              collectionId: doc.collectionId,
              parentDocumentId: doc.parentDocumentId,
              publish: doc.publish,
            })
          );
          return { success: true, id: data.id, title: data.title };
        } catch (error) {
          return { success: false, title: doc.title, error: getErrorMessage(error) };
        }
      });
    },

    async batch_update_documents(args: BatchUpdateDocumentsInput) {
      checkAccess(config, 'batch_update_documents');

      return runBatch(args.updates, async (update) => {
        try {
          let text = update.text;
          if (update.append && update.text) {
            const { data: existing } = await apiCall(() =>
              apiClient.post<OutlineDocument>('/documents.info', { id: update.documentId })
            );
            text = (existing.text || '') + '\n\n' + update.text;
          }

          const payload: Record<string, unknown> = { id: update.documentId };
          if (update.title) payload.title = update.title;
          if (text !== undefined) payload.text = text;

          const { data } = await apiCall(() =>
            apiClient.post<OutlineDocument>('/documents.update', payload)
          );
          return { success: true, id: data.id, title: data.title };
        } catch (error) {
          return { success: false, documentId: update.documentId, error: getErrorMessage(error) };
        }
      });
    },

    async batch_move_documents(args: BatchMoveDocumentsInput) {
      checkAccess(config, 'batch_move_documents');

      return runBatch(args.documentIds, async (documentId) => {
        try {
          const payload: Record<string, unknown> = { id: documentId };
          if (args.collectionId) payload.collectionId = args.collectionId;
          if (args.parentDocumentId !== undefined) payload.parentDocumentId = args.parentDocumentId;

          const { data } = await apiCall(() =>
            apiClient.post<OutlineDocument>('/documents.move', payload)
          );
          return { success: true, id: data.id, title: data.title };
        } catch (error) {
          return { success: false, documentId, error: getErrorMessage(error) };
        }
      });
    },

    async batch_archive_documents(args: BatchArchiveDocumentsInput) {
      checkAccess(config, 'batch_archive_documents');

      return runBatch(args.documentIds, async (documentId) => {
        try {
          const { data } = await apiCall(() =>
            apiClient.post<OutlineDocument>('/documents.archive', { id: documentId })
          );
          return { success: true, id: data.id, title: data.title };
        } catch (error) {
          return { success: false, documentId, error: getErrorMessage(error) };
        }
      });
    },

    async batch_delete_documents(args: BatchDeleteDocumentsInput) {
      checkAccess(config, 'batch_delete_documents');

      const results = await runBatch(args.documentIds, async (documentId) => {
        try {
          await apiCall(() =>
            apiClient.post('/documents.delete', { id: documentId, permanent: args.permanent })
          );
          return { success: true, documentId };
        } catch (error) {
          return { success: false, documentId, error: getErrorMessage(error) };
        }
      });

      return { ...results, permanent: args.permanent };
    },
  };
}
