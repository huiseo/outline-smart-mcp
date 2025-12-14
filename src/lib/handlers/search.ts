/**
 * Search Handlers
 *
 * Search and discovery tool handlers
 */

import type { AppContext } from '../context.js';
import type { SearchResult, OutlineCollection, OutlineDocument } from '../types/api.js';
import {
  buildUrl,
  formatSearchResults,
  formatCollections,
  formatRecentDocuments,
} from '../formatters/index.js';
import type {
  SearchDocumentsInput,
  GetDocumentIdFromTitleInput,
  GetCollectionStructureInput,
  ListRecentDocumentsInput,
} from '../schemas.js';

export function createSearchHandlers({ apiClient, apiCall, config }: AppContext) {
  const baseUrl = config.OUTLINE_URL;

  return {
    async search_documents(args: SearchDocumentsInput) {
      const { data } = await apiCall(() =>
        apiClient.post<SearchResult[]>('/documents.search', {
          query: args.query,
          collectionId: args.collectionId,
          limit: args.limit,
          offset: args.offset,
        })
      );
      return formatSearchResults(data || [], baseUrl);
    },

    async get_document_id_from_title(args: GetDocumentIdFromTitleInput) {
      const { data } = await apiCall(() =>
        apiClient.post<SearchResult[]>('/documents.search', {
          query: args.query,
          collectionId: args.collectionId,
          limit: 5,
        })
      );

      return (data || [])
        .filter((item) => item.document.title.toLowerCase().includes(args.query.toLowerCase()))
        .map((item) => ({
          id: item.document.id,
          title: item.document.title,
          url: buildUrl(baseUrl, item.document.url),
        }));
    },

    async list_collections() {
      const { data } = await apiCall(() =>
        apiClient.post<OutlineCollection[]>('/collections.list')
      );
      return formatCollections(data || []);
    },

    async get_collection_structure(args: GetCollectionStructureInput) {
      const { data } = await apiCall(() =>
        apiClient.post<unknown>('/collections.documents', { id: args.collectionId })
      );
      return data;
    },

    async list_recent_documents(args: ListRecentDocumentsInput) {
      const { data } = await apiCall(() =>
        apiClient.post<OutlineDocument[]>('/documents.list', {
          limit: args.limit,
          sort: 'updatedAt',
          direction: 'DESC',
        })
      );
      return formatRecentDocuments(data || [], baseUrl);
    },
  };
}
