/**
 * Document Formatters
 *
 * Document related formatters
 */

import type { OutlineDocument, SearchResult } from '../types/api.js';
import { buildUrl } from './url.js';

/** Format search results */
export function formatSearchResults(results: SearchResult[], baseUrl: string) {
  return results.map((item) => ({
    id: item.document.id,
    title: item.document.title,
    url: buildUrl(baseUrl, item.document.url),
    excerpt: item.context || (item.document.text?.substring(0, 200) + '...') || '',
    updatedAt: item.document.updatedAt,
    collectionId: item.document.collectionId,
  }));
}

/** Format document info */
export function formatDocumentInfo(doc: OutlineDocument, baseUrl: string) {
  return {
    id: doc.id,
    title: doc.title,
    text: doc.text,
    url: buildUrl(baseUrl, doc.url),
    collectionId: doc.collectionId,
    parentDocumentId: doc.parentDocumentId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy?.name,
    updatedBy: doc.updatedBy?.name,
    publishedAt: doc.publishedAt,
    archivedAt: doc.archivedAt,
  };
}

/** Format recent documents list */
export function formatRecentDocuments(documents: OutlineDocument[], baseUrl: string) {
  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    url: buildUrl(baseUrl, doc.url),
    collectionId: doc.collectionId,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy?.name,
  }));
}

/** Format archived documents list */
export function formatArchivedDocuments(documents: OutlineDocument[]) {
  return documents.map(({ id, title, archivedAt, collectionId }) => ({
    id, title, archivedAt, collectionId,
  }));
}

/** Format trash documents list */
export function formatTrashDocuments(documents: OutlineDocument[]) {
  return documents.map(({ id, title, deletedAt, collectionId }) => ({
    id, title, deletedAt, collectionId,
  }));
}

/** Format backlinks list */
export function formatBacklinks(
  backlinks: Array<{ id: string; title: string; url: string }>,
  baseUrl: string
) {
  return backlinks.map((link) => ({
    id: link.id,
    title: link.title,
    url: buildUrl(baseUrl, link.url),
  }));
}
