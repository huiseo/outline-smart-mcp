/**
 * Batch Formatters
 *
 * Batch operation result formatters
 */

import type { BatchResult, BatchSummary } from '../types/batch.js';

/** Format batch results */
export function formatBatchResults(results: BatchResult[]): BatchSummary {
  const succeeded = results.filter((r) => r.success).length;
  return {
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  };
}

/** Extract error message */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}
