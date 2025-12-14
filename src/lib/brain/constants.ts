/**
 * Brain Module Constants
 *
 * Centralized configuration values and messages for the Smart Wiki brain
 */

// Vector Store
export const VECTOR_STORE = {
  TABLE_NAME: 'documents',
  INIT_RECORD_ID: '__init__',
  DEFAULT_DATA_DIR: '.data/wiki-brain',
} as const;

// Embedding
export const EMBEDDING = {
  MODEL: 'text-embedding-3-small',
  DIMENSIONS: 1536,
} as const;

// LLM Processing
export const LLM = {
  MODEL: 'gpt-4o-mini',
  TEMPERATURE: 0.3,
  MAX_SUMMARY_CHARS: 5000,
  MAX_TAG_ANALYSIS_CHARS: 3000,
} as const;

// Document Chunking
export const CHUNKING = {
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
} as const;

// Search & Sync
export const SEARCH = {
  DEFAULT_LIMIT: 5,
  DOCUMENT_FETCH_LIMIT: 100,
  CONTEXT_PREVIEW_LENGTH: 500,
  EXCERPT_LENGTH: 200,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  SMART_FEATURES_DISABLED:
    'Smart features are disabled. Set ENABLE_SMART_FEATURES=true and OPENAI_API_KEY.',
  OPENAI_NOT_CONFIGURED: 'OpenAI API Key is not configured.',
  NO_CONTENT_TO_SUMMARIZE: 'Document has no content to summarize.',
  NO_CONTENT_TO_ANALYZE: 'Document has no content to analyze.',
  NO_DOCUMENTS_FOUND: 'No documents found to sync.',
  NO_DOCUMENTS_WITH_CONTENT: 'No documents with content found to sync.',
  NO_RELEVANT_DOCUMENTS: 'No relevant documents found in the wiki.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SYNC_COMPLETE: (docs: number, chunks: number) =>
    `Successfully synced ${docs} documents (${chunks} chunks).`,
  SMART_ENABLED: (chunks: number) =>
    `Smart features are enabled with ${chunks} indexed chunks.`,
} as const;
