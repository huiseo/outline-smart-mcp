/**
 * Schemas Module Tests
 */

import { describe, test, expect } from 'vitest';
import {
  searchDocumentsSchema,
  createDocumentSchema,
  deleteDocumentSchema,
  batchCreateDocumentsSchema,
  toolSchemas,
} from './schemas.js';

describe('searchDocumentsSchema', () => {
  test('should validate valid input', () => {
    const result = searchDocumentsSchema.safeParse({ query: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe('test');
      expect(result.data.limit).toBe(10); // default
      expect(result.data.offset).toBe(0); // default
    }
  });

  test('should reject empty query', () => {
    const result = searchDocumentsSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });

  test('should accept optional collectionId', () => {
    const result = searchDocumentsSchema.safeParse({
      query: 'test',
      collectionId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  test('should reject invalid UUID for collectionId', () => {
    const result = searchDocumentsSchema.safeParse({
      query: 'test',
      collectionId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  test('should validate limit range', () => {
    expect(searchDocumentsSchema.safeParse({ query: 'test', limit: 0 }).success).toBe(false);
    expect(searchDocumentsSchema.safeParse({ query: 'test', limit: 101 }).success).toBe(false);
    expect(searchDocumentsSchema.safeParse({ query: 'test', limit: 50 }).success).toBe(true);
  });
});

describe('createDocumentSchema', () => {
  test('should validate valid input', () => {
    const result = createDocumentSchema.safeParse({
      title: 'My Document',
      collectionId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Document');
      expect(result.data.text).toBe(''); // default
      expect(result.data.publish).toBe(true); // default
    }
  });

  test('should reject empty title', () => {
    const result = createDocumentSchema.safeParse({
      title: '',
      collectionId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(false);
  });

  test('should reject missing collectionId', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Test',
    });
    expect(result.success).toBe(false);
  });
});

describe('deleteDocumentSchema', () => {
  test('should validate valid input', () => {
    const result = deleteDocumentSchema.safeParse({
      documentId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.permanent).toBe(false); // default
    }
  });

  test('should accept permanent flag', () => {
    const result = deleteDocumentSchema.safeParse({
      documentId: '123e4567-e89b-12d3-a456-426614174000',
      permanent: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.permanent).toBe(true);
    }
  });

  test('should reject invalid UUID for documentId', () => {
    const result = deleteDocumentSchema.safeParse({
      documentId: 'doc-123',
    });
    expect(result.success).toBe(false);
  });
});

describe('batchCreateDocumentsSchema', () => {
  test('should validate valid batch input', () => {
    const result = batchCreateDocumentsSchema.safeParse({
      documents: [
        {
          title: 'Doc 1',
          collectionId: '123e4567-e89b-12d3-a456-426614174000',
        },
        {
          title: 'Doc 2',
          collectionId: '123e4567-e89b-12d3-a456-426614174000',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('should reject empty documents array', () => {
    const result = batchCreateDocumentsSchema.safeParse({
      documents: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('toolSchemas', () => {
  test('should have 38 schemas defined (31 base + 7 smart)', () => {
    expect(Object.keys(toolSchemas)).toHaveLength(38);
  });

  test('should have schema for all tools', () => {
    expect(toolSchemas.search_documents).toBeDefined();
    expect(toolSchemas.create_document).toBeDefined();
    expect(toolSchemas.delete_document).toBeDefined();
    expect(toolSchemas.batch_create_documents).toBeDefined();
  });

  test('should have schema for smart features', () => {
    expect(toolSchemas.sync_knowledge).toBeDefined();
    expect(toolSchemas.ask_wiki).toBeDefined();
    expect(toolSchemas.summarize_document).toBeDefined();
    expect(toolSchemas.suggest_tags).toBeDefined();
    expect(toolSchemas.find_related).toBeDefined();
    expect(toolSchemas.generate_diagram).toBeDefined();
    expect(toolSchemas.smart_status).toBeDefined();
  });
});
