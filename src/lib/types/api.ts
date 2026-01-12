/**
 * Outline API Response Types
 *
 * Outline Wiki API response type definitions
 */

export interface OutlineDocument {
  id: string;
  title: string;
  text?: string;
  url: string;
  collectionId: string;
  parentDocumentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  archivedAt?: string | null;
  deletedAt?: string;
  createdBy?: { name: string };
  updatedBy?: { name: string };
  backlinks?: Array<{ id: string; title: string; url: string }>;
}

export interface OutlineCollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  urlId?: string;
  documentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Document with children for tree structure (collections.documents API)
 */
export interface OutlineDocumentTree extends OutlineDocument {
  children?: OutlineDocumentTree[];
}

export interface OutlineComment {
  id: string;
  documentId: string;
  data: { text: string };
  createdAt: string;
  createdBy?: { name: string };
  parentCommentId?: string | null;
}

export interface SearchResult {
  document: OutlineDocument;
  context?: string;
}

/**
 * File operation response from export APIs
 */
export interface FileOperation {
  id: string;
  type: string;
  state: 'creating' | 'complete' | 'expired' | 'error';
  url?: string;
  size?: number;
  createdAt?: string;
}
