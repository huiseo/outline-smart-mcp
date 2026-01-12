/**
 * Handlers Index
 *
 * Combines all handlers into a single export
 */

import type { AppContext } from '../context.js';
import type { ToolHandlers } from '../types/handlers.js';
import { createSearchHandlers } from './search.js';
import { createDocumentHandlers } from './documents.js';
import { createCollectionHandlers } from './collections.js';
import { createCommentHandlers } from './comments.js';
import { createBatchHandlers } from './batch.js';
import { createSmartHandlers } from './smart.js';
import { createHealthHandlers } from './health.js';

/**
 * Create all tool handlers
 */
export function createAllHandlers(ctx: AppContext): ToolHandlers {
  return {
    ...createSearchHandlers(ctx),
    ...createDocumentHandlers(ctx),
    ...createCollectionHandlers(ctx),
    ...createCommentHandlers(ctx),
    ...createBatchHandlers(ctx),
    ...createSmartHandlers(ctx),
    ...createHealthHandlers(ctx),
  } as ToolHandlers;
}
