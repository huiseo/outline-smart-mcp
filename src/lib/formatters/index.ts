/**
 * Formatters Index
 *
 * Re-export all formatters
 */

export { buildUrl } from './url.js';
export {
  formatSearchResults,
  formatDocumentInfo,
  formatRecentDocuments,
  formatArchivedDocuments,
  formatTrashDocuments,
  formatBacklinks,
} from './document.js';
export { formatCollections } from './collection.js';
export { formatComments } from './comment.js';
export { formatBatchResults, getErrorMessage } from './batch.js';

// Type re-exports (backward compatibility)
export type {
  OutlineDocument,
  OutlineCollection,
  OutlineComment,
  SearchResult,
} from '../types/api.js';
export type { BatchResult, BatchSummary } from '../types/batch.js';
