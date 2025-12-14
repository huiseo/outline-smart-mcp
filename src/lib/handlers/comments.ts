/**
 * Comment Handlers
 *
 * Comment and collaboration handlers
 */

import type { AppContext } from '../context.js';
import type { OutlineComment, OutlineDocument } from '../types/api.js';
import { checkAccess } from '../access-control.js';
import { MESSAGES } from '../messages.js';
import { formatComments, formatBacklinks } from '../formatters/index.js';
import type {
  AddCommentInput,
  ListDocumentCommentsInput,
  GetCommentInput,
  GetDocumentBacklinksInput,
} from '../schemas.js';

export function createCommentHandlers({ apiClient, apiCall, config }: AppContext) {
  const baseUrl = config.OUTLINE_URL;

  return {
    async add_comment(args: AddCommentInput) {
      checkAccess(config, 'add_comment');

      const payload: Record<string, unknown> = {
        documentId: args.documentId,
        data: { text: args.text },
      };
      if (args.parentCommentId) payload.parentCommentId = args.parentCommentId;

      const { data } = await apiCall(() =>
        apiClient.post<OutlineComment>('/comments.create', payload)
      );
      return {
        id: data.id,
        documentId: data.documentId,
        createdAt: data.createdAt,
        createdBy: data.createdBy?.name,
        message: MESSAGES.COMMENT_ADDED,
      };
    },

    async list_document_comments(args: ListDocumentCommentsInput) {
      const { data } = await apiCall(() =>
        apiClient.post<OutlineComment[]>('/comments.list', {
          documentId: args.documentId,
          limit: args.limit,
          offset: args.offset,
        })
      );
      return formatComments(data || []);
    },

    async get_comment(args: GetCommentInput) {
      const { data } = await apiCall(() =>
        apiClient.post<OutlineComment>('/comments.info', { id: args.commentId })
      );
      return {
        id: data.id,
        documentId: data.documentId,
        data: data.data,
        createdAt: data.createdAt,
        createdBy: data.createdBy?.name,
        parentCommentId: data.parentCommentId,
      };
    },

    async get_document_backlinks(args: GetDocumentBacklinksInput) {
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument>('/documents.info', { id: args.documentId })
      );
      return {
        documentId: args.documentId,
        backlinks: formatBacklinks(data.backlinks || [], baseUrl),
      };
    },
  };
}
