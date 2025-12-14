/**
 * Collection Handlers
 *
 * Collection management handlers
 */

import type { AppContext } from '../context.js';
import type { OutlineCollection } from '../types/api.js';
import { checkAccess } from '../access-control.js';
import { MESSAGES } from '../messages.js';
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
  DeleteCollectionInput,
  ExportCollectionInput,
  ExportAllCollectionsInput,
} from '../schemas.js';

export function createCollectionHandlers({ apiClient, apiCall, config }: AppContext) {
  const colResult = (col: OutlineCollection, message: string) => ({
    id: col.id,
    name: col.name,
    description: col.description,
    color: col.color,
    message,
  });

  return {
    async create_collection(args: CreateCollectionInput) {
      checkAccess(config, 'create_collection');

      const payload: Record<string, unknown> = { name: args.name };
      if (args.description) payload.description = args.description;
      if (args.color) payload.color = args.color;

      const { data } = await apiCall(() =>
        apiClient.post<OutlineCollection>('/collections.create', payload)
      );
      return colResult(data, MESSAGES.COLLECTION_CREATED);
    },

    async update_collection(args: UpdateCollectionInput) {
      checkAccess(config, 'update_collection');

      const payload: Record<string, unknown> = { id: args.collectionId };
      if (args.name) payload.name = args.name;
      if (args.description !== undefined) payload.description = args.description;
      if (args.color) payload.color = args.color;

      const { data } = await apiCall(() =>
        apiClient.post<OutlineCollection>('/collections.update', payload)
      );
      return colResult(data, MESSAGES.COLLECTION_UPDATED);
    },

    async delete_collection(args: DeleteCollectionInput) {
      checkAccess(config, 'delete_collection');
      await apiCall(() =>
        apiClient.post('/collections.delete', { id: args.collectionId })
      );
      return { success: true, collectionId: args.collectionId, message: MESSAGES.COLLECTION_DELETED };
    },

    async export_collection(args: ExportCollectionInput) {
      const { data } = await apiCall(() =>
        apiClient.post<unknown>('/collections.export', { id: args.collectionId, format: args.format })
      );
      return {
        success: true,
        collectionId: args.collectionId,
        format: args.format,
        fileOperation: data,
        message: MESSAGES.COLLECTION_EXPORT_STARTED,
      };
    },

    async export_all_collections(args: ExportAllCollectionsInput) {
      const { data } = await apiCall(() =>
        apiClient.post<unknown>('/collections.export_all', { format: args.format })
      );
      return {
        success: true,
        format: args.format,
        fileOperation: data,
        message: MESSAGES.COLLECTION_EXPORT_ALL_STARTED,
      };
    },
  };
}
