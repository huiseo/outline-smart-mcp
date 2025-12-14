/**
 * Batch Operation Types
 *
 * Batch operation related type definitions
 */

export interface BatchResult {
  success: boolean;
  id?: string;
  documentId?: string;
  title?: string;
  error?: string;
}

export interface BatchSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchResult[];
}
