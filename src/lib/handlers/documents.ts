/**
 * Document Handlers
 *
 * Document CRUD and lifecycle handlers
 */

import type { AppContext } from '../context.js';
import type { OutlineDocument } from '../types/api.js';
import { checkAccess } from '../access-control.js';
import { MESSAGES } from '../messages.js';
import {
  buildUrl,
  formatDocumentInfo,
  formatArchivedDocuments,
  formatTrashDocuments,
} from '../formatters/index.js';
import type {
  GetDocumentInput,
  ExportDocumentInput,
  CreateDocumentInput,
  UpdateDocumentInput,
  MoveDocumentInput,
  ArchiveDocumentInput,
  UnarchiveDocumentInput,
  DeleteDocumentInput,
  RestoreDocumentInput,
  ListArchivedDocumentsInput,
  ListTrashInput,
} from '../schemas.js';

export function createDocumentHandlers({ apiClient, apiCall, config }: AppContext) {
  const baseUrl = config.OUTLINE_URL;

  const docResult = (doc: OutlineDocument, message: string) => ({
    id: doc.id,
    title: doc.title,
    url: buildUrl(baseUrl, doc.url),
    message,
  });

  return {
    async get_document(args: GetDocumentInput) {
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.info', { id: args.documentId })
      );
      return formatDocumentInfo(data, baseUrl);
    },

    async export_document(args: ExportDocumentInput) {
      const { data } = await apiCall(() =>
        apiClient.post<string>('/documents.export', { id: args.documentId })
      );
      return data;
    },

    async create_document(args: CreateDocumentInput) {
      checkAccess(config, 'create_document');
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.create', {
          title: args.title,
          text: args.text,
          collectionId: args.collectionId,
          parentDocumentId: args.parentDocumentId,
          publish: args.publish,
        })
      );
      return docResult(data, MESSAGES.DOCUMENT_CREATED);
    },

    async update_document(args: UpdateDocumentInput) {
      checkAccess(config, 'update_document');

      let text = args.text;
      if (args.append && args.text) {
        const { data: existing } = await apiCall(() =>
          apiClient.post<OutlineDocument>('/documents.info', { id: args.documentId })
        );
        text = (existing.text || '') + '\n\n' + args.text;
      }

      const payload: Record<string, unknown> = { id: args.documentId };
      if (args.title) payload.title = args.title;
      if (text !== undefined) payload.text = text;

      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.update', payload)
      );
      return docResult(data, MESSAGES.DOCUMENT_UPDATED);
    },

    async move_document(args: MoveDocumentInput) {
      checkAccess(config, 'move_document');

      const payload: Record<string, unknown> = { id: args.documentId };
      if (args.collectionId) payload.collectionId = args.collectionId;
      if (args.parentDocumentId !== undefined) payload.parentDocumentId = args.parentDocumentId;

      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.move', payload)
      );
      return {
        ...docResult(data, MESSAGES.DOCUMENT_MOVED),
        collectionId: data.collectionId,
        parentDocumentId: data.parentDocumentId,
      };
    },

    async archive_document(args: ArchiveDocumentInput) {
      checkAccess(config, 'archive_document');
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.archive', { id: args.documentId })
      );
      return { id: data.id, title: data.title, archivedAt: data.archivedAt, message: MESSAGES.DOCUMENT_ARCHIVED };
    },

    async unarchive_document(args: UnarchiveDocumentInput) {
      checkAccess(config, 'unarchive_document');
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.unarchive', { id: args.documentId })
      );
      return { id: data.id, title: data.title, message: MESSAGES.DOCUMENT_UNARCHIVED };
    },

    async delete_document(args: DeleteDocumentInput) {
      checkAccess(config, 'delete_document');
      await apiCall(() =>
        apiClient.post('/documents.delete', { id: args.documentId, permanent: args.permanent })
      );
      return {
        success: true,
        documentId: args.documentId,
        permanent: args.permanent,
        message: args.permanent ? MESSAGES.DOCUMENT_DELETED_PERMANENT : MESSAGES.DOCUMENT_DELETED,
      };
    },

    async restore_document(args: RestoreDocumentInput) {
      checkAccess(config, 'restore_document');
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.restore', { id: args.documentId })
      );
      return docResult(data, MESSAGES.DOCUMENT_RESTORED);
    },

    async list_archived_documents(args: ListArchivedDocumentsInput) {
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument[]>('/documents.archived', { limit: args.limit })
      );
      return formatArchivedDocuments(data || []);
    },

    async list_trash(args: ListTrashInput) {
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument[]>('/documents.deleted', { limit: args.limit })
      );
      return formatTrashDocuments(data || []);
    },
  };
}
