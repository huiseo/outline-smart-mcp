/**
 * Collection Formatters
 *
 * Collection related formatters
 */

import type { OutlineCollection } from '../types/api.js';

/** Format collections list */
export function formatCollections(collections: OutlineCollection[]) {
  return collections.map((col) => ({
    id: col.id,
    name: col.name,
    description: col.description,
    color: col.color,
    documentCount: col.documentCount ?? 0,
    createdAt: col.createdAt,
    updatedAt: col.updatedAt,
  }));
}
