/**
 * Formatters Module Tests
 */

import { describe, test, expect } from 'vitest';
import {
  formatSearchResults,
  formatDocumentInfo,
  formatCollections,
  formatRecentDocuments,
  formatBatchResults,
  formatArchivedDocuments,
  formatTrashDocuments,
  formatComments,
  formatBacklinks,
} from './formatters/index.js';

describe('formatSearchResults', () => {
  test('should format search results correctly', () => {
    const results = [
      {
        document: {
          id: 'doc-1',
          title: 'Test Document',
          url: '/doc/test',
          text: 'This is content...',
          updatedAt: '2025-01-01T00:00:00Z',
          collectionId: 'col-1',
        },
        context: 'Highlighted context',
      },
    ];

    const formatted = formatSearchResults(results, 'https://wiki.example.com');

    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toEqual({
      id: 'doc-1',
      title: 'Test Document',
      url: 'https://wiki.example.com/doc/test',
      excerpt: 'Highlighted context',
      updatedAt: '2025-01-01T00:00:00Z',
      collectionId: 'col-1',
    });
  });

  test('should use text substring when no context', () => {
    const results = [
      {
        document: {
          id: 'doc-1',
          title: 'Test',
          url: '/doc/test',
          text: 'Short text',
          collectionId: 'col-1',
        },
      },
    ];

    const formatted = formatSearchResults(results, 'https://wiki.example.com');
    expect(formatted[0].excerpt).toBe('Short text...');
  });
});

describe('formatDocumentInfo', () => {
  test('should format document info correctly', () => {
    const doc = {
      id: 'doc-1',
      title: 'Test Document',
      text: '# Hello',
      url: '/doc/test',
      collectionId: 'col-1',
      parentDocumentId: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      createdBy: { name: 'User A' },
      updatedBy: { name: 'User B' },
      publishedAt: '2025-01-01T00:00:00Z',
      archivedAt: null,
    };

    const formatted = formatDocumentInfo(doc, 'https://wiki.example.com');

    expect(formatted).toEqual({
      id: 'doc-1',
      title: 'Test Document',
      text: '# Hello',
      url: 'https://wiki.example.com/doc/test',
      collectionId: 'col-1',
      parentDocumentId: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      createdBy: 'User A',
      updatedBy: 'User B',
      publishedAt: '2025-01-01T00:00:00Z',
      archivedAt: null,
    });
  });

  test('should handle missing createdBy/updatedBy', () => {
    const doc = {
      id: 'doc-1',
      title: 'Test',
      url: '/doc/test',
      collectionId: 'col-1',
    };

    const formatted = formatDocumentInfo(doc, 'https://wiki.example.com');

    expect(formatted.createdBy).toBeUndefined();
    expect(formatted.updatedBy).toBeUndefined();
  });
});

describe('formatCollections', () => {
  test('should format collections correctly', () => {
    const collections = [
      {
        id: 'col-1',
        name: 'Engineering',
        description: 'Tech docs',
        color: '#FF5733',
        documentCount: 10,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
    ];

    const formatted = formatCollections(collections);

    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toEqual({
      id: 'col-1',
      name: 'Engineering',
      description: 'Tech docs',
      color: '#FF5733',
      documentCount: 10,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    });
  });

  test('should default documentCount to 0', () => {
    const collections = [{ id: 'col-1', name: 'Test' }];
    const formatted = formatCollections(collections);
    expect(formatted[0].documentCount).toBe(0);
  });
});

describe('formatRecentDocuments', () => {
  test('should format recent documents correctly', () => {
    const documents = [
      {
        id: 'doc-1',
        title: 'Test',
        url: '/doc/test',
        collectionId: 'col-1',
        updatedAt: '2025-01-01T00:00:00Z',
        updatedBy: { name: 'User A' },
      },
    ];

    const formatted = formatRecentDocuments(documents, 'https://wiki.example.com');

    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toEqual({
      id: 'doc-1',
      title: 'Test',
      url: 'https://wiki.example.com/doc/test',
      collectionId: 'col-1',
      updatedAt: '2025-01-01T00:00:00Z',
      updatedBy: 'User A',
    });
  });
});

describe('formatBatchResults', () => {
  test('should format batch results correctly', () => {
    const results = [
      { success: true, id: 'doc-1' },
      { success: true, id: 'doc-2' },
      { success: false, error: 'Failed' },
    ];

    const formatted = formatBatchResults(results);

    expect(formatted).toEqual({
      total: 3,
      succeeded: 2,
      failed: 1,
      results,
    });
  });

  test('should handle empty results', () => {
    const formatted = formatBatchResults([]);

    expect(formatted).toEqual({
      total: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    });
  });
});

describe('formatArchivedDocuments', () => {
  test('should format archived documents correctly', () => {
    const documents = [
      { id: 'doc-1', title: 'Archived', archivedAt: '2025-01-01', collectionId: 'col-1', url: '' },
    ];

    const formatted = formatArchivedDocuments(documents);

    expect(formatted[0]).toEqual({
      id: 'doc-1',
      title: 'Archived',
      archivedAt: '2025-01-01',
      collectionId: 'col-1',
    });
  });
});

describe('formatTrashDocuments', () => {
  test('should format trash documents correctly', () => {
    const documents = [
      { id: 'doc-1', title: 'Deleted', deletedAt: '2025-01-01', collectionId: 'col-1', url: '' },
    ];

    const formatted = formatTrashDocuments(documents);

    expect(formatted[0]).toEqual({
      id: 'doc-1',
      title: 'Deleted',
      deletedAt: '2025-01-01',
      collectionId: 'col-1',
    });
  });
});

describe('formatComments', () => {
  test('should format comments correctly', () => {
    const comments = [
      {
        id: 'comment-1',
        documentId: 'doc-1',
        data: { text: 'Great!' },
        createdAt: '2025-01-01',
        createdBy: { name: 'User A' },
        parentCommentId: null,
      },
    ];

    const formatted = formatComments(comments);

    expect(formatted[0]).toEqual({
      id: 'comment-1',
      data: { text: 'Great!' },
      createdAt: '2025-01-01',
      createdBy: 'User A',
      parentCommentId: null,
    });
  });
});

describe('formatBacklinks', () => {
  test('should format backlinks correctly', () => {
    const backlinks = [{ id: 'doc-2', title: 'Linking Doc', url: '/doc/linking' }];

    const formatted = formatBacklinks(backlinks, 'https://wiki.example.com');

    expect(formatted[0]).toEqual({
      id: 'doc-2',
      title: 'Linking Doc',
      url: 'https://wiki.example.com/doc/linking',
    });
  });
});
