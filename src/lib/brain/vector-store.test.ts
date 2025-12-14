/**
 * Vector Store Tests
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VectorRecord } from './types.js';
import fs from 'fs';

// Create mock factory inside vi.mock to avoid hoisting issues
vi.mock('@lancedb/lancedb', () => {
  const mockTable = {
    add: vi.fn().mockResolvedValue({}),
    vectorSearch: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { id: 'doc1-chunk-0', text: 'Test content', title: 'Test', url: 'http://test.com', _distance: 0.1 },
        ]),
      }),
    }),
    countRows: vi.fn().mockResolvedValue(10),
  };

  const mockDb = {
    tableNames: vi.fn().mockResolvedValue(['documents']),
    openTable: vi.fn().mockResolvedValue(mockTable),
    createTable: vi.fn().mockResolvedValue(mockTable),
  };

  return {
    connect: vi.fn().mockResolvedValue(mockDb),
    __mockTable: mockTable,
    __mockDb: mockDb,
  };
});

describe('VectorStore', () => {
  let store: Awaited<ReturnType<typeof import('./vector-store.js')['VectorStore']>>['prototype'];
  let VectorStore: typeof import('./vector-store.js')['VectorStore'];
  let mockTable: ReturnType<typeof vi.fn>;
  const testDataDir = '/tmp/test-vector-store';

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import after mocking
    const vectorStoreModule = await import('./vector-store.js');
    VectorStore = vectorStoreModule.VectorStore;
    store = new VectorStore({ dataDir: testDataDir }, 1536);

    // Get mock references
    const lancedb = await import('@lancedb/lancedb');
    mockTable = (lancedb as unknown as { __mockTable: typeof mockTable }).__mockTable;
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  test('should initialize store', async () => {
    await store.init();

    const lancedb = await import('@lancedb/lancedb');
    expect(lancedb.connect).toHaveBeenCalledWith(testDataDir);
  });

  test('should save records', async () => {
    const records: VectorRecord[] = [
      {
        id: 'doc1-chunk-0',
        vector: Array(1536).fill(0.1),
        text: 'Test content',
        title: 'Test Document',
        url: 'http://example.com/doc1',
      },
    ];

    const count = await store.save(records);

    expect(count).toBe(1);
    expect(mockTable.add).toHaveBeenCalledWith(records, { mode: 'overwrite' });
  });

  test('should return 0 for empty records', async () => {
    const count = await store.save([]);

    expect(count).toBe(0);
    expect(mockTable.add).not.toHaveBeenCalled();
  });

  test('should search for similar documents', async () => {
    const queryVector = Array(1536).fill(0.1);

    const results = await store.search(queryVector, 5);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('doc1-chunk-0');
    expect(results[0].score).toBe(0.1);
  });

  test('should filter out init record from search results', async () => {
    mockTable.vectorSearch.mockReturnValueOnce({
      limit: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { id: '__init__', text: '', title: '', url: '', _distance: 0 },
          { id: 'doc1-chunk-0', text: 'Test', title: 'Test', url: 'http://test.com', _distance: 0.1 },
        ]),
      }),
    });

    const results = await store.search(Array(1536).fill(0.1));

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('doc1-chunk-0');
  });

  test('should count rows', async () => {
    const count = await store.count();

    expect(count).toBe(10);
  });

  test('should clear store', async () => {
    await store.clear();

    expect(mockTable.add).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: '__init__' }),
      ]),
      { mode: 'overwrite' }
    );
  });
});
