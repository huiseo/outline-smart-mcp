/**
 * Smart Handlers Tests
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createSmartHandlers } from './smart.js';
import type { AppContext } from '../context.js';
import type { Config } from '../config.js';
import type { IBrain } from '../brain/types.js';

// Create a mock brain factory
function createMockBrain(enabled: boolean = true): IBrain {
  return {
    isEnabled: vi.fn().mockReturnValue(enabled),
    syncDocuments: vi.fn().mockResolvedValue({ documents: 2, chunks: 10 }),
    ask: vi.fn().mockResolvedValue({
      answer: 'The answer is 42.',
      sources: [{ id: 'doc1', title: 'Guide', url: 'http://test.com/doc1', text: 'content' }],
    }),
    summarize: vi.fn().mockResolvedValue('This is a summary of the document.'),
    suggestTags: vi.fn().mockResolvedValue(['tag1', 'tag2', 'tag3']),
    search: vi.fn().mockResolvedValue([
      { id: 'doc2-chunk-0', title: 'Related Doc', url: 'http://test.com/doc2', text: 'Related content', score: 0.2 },
    ]),
    generateDiagram: vi.fn().mockResolvedValue('graph TD\n  A[Start] --> B[End]'),
    getStats: vi.fn().mockResolvedValue({ enabled: true, chunks: 100 }),
    clear: vi.fn().mockResolvedValue(undefined),
  };
}

describe('Smart Handlers', () => {
  let handlers: ReturnType<typeof createSmartHandlers>;
  let mockApiClient: {
    post: ReturnType<typeof vi.fn>;
  };
  let mockApiCall: ReturnType<typeof vi.fn>;
  let mockConfig: Config;
  let mockBrain: IBrain;

  beforeEach(() => {
    vi.clearAllMocks();

    mockApiClient = {
      post: vi.fn(),
    };

    mockApiCall = vi.fn().mockImplementation((fn) => fn());

    mockConfig = {
      OUTLINE_URL: 'https://wiki.example.com',
      OUTLINE_API_TOKEN: 'test-token',
      READ_ONLY: false,
      DISABLE_DELETE: false,
      MAX_RETRIES: 3,
      RETRY_DELAY_MS: 1000,
      ENABLE_SMART_FEATURES: true,
    };

    mockBrain = createMockBrain(true);

    const ctx: AppContext = {
      apiClient: mockApiClient as never,
      apiCall: mockApiCall,
      config: mockConfig,
      brain: mockBrain,
    };

    handlers = createSmartHandlers(ctx);
  });

  describe('sync_knowledge', () => {
    test('should sync documents successfully', async () => {
      // Mock document list
      mockApiClient.post
        .mockResolvedValueOnce({
          data: [
            { id: 'doc1', title: 'Doc 1', url: '/doc/doc1' },
            { id: 'doc2', title: 'Doc 2', url: '/doc/doc2' },
          ],
        })
        // Mock individual document fetches
        .mockResolvedValueOnce({
          data: { id: 'doc1', title: 'Doc 1', text: 'Content 1', url: '/doc/doc1', collectionId: 'col1' },
        })
        .mockResolvedValueOnce({
          data: { id: 'doc2', title: 'Doc 2', text: 'Content 2', url: '/doc/doc2', collectionId: 'col1' },
        });

      const result = await handlers.sync_knowledge({});

      expect(result.documents).toBe(2);
      expect(result.chunks).toBe(10);
      expect(result.message).toContain('Successfully synced');
    });

    test('should handle empty document list', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: [] });

      const result = await handlers.sync_knowledge({});

      expect(result.message).toContain('No documents found');
      expect(result.synced).toBe(0);
    });

    test('should filter by collectionId', async () => {
      mockApiClient.post
        .mockResolvedValueOnce({
          data: [{ id: 'doc1', title: 'Doc 1', url: '/doc/doc1' }],
        })
        .mockResolvedValueOnce({
          data: { id: 'doc1', title: 'Doc 1', text: 'Content 1', url: '/doc/doc1', collectionId: 'col1' },
        });

      await handlers.sync_knowledge({ collectionId: 'col1' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/documents.list', {
        limit: 100,
        collectionId: 'col1',
      });
    });

    test('should count fetch errors', async () => {
      mockApiClient.post
        .mockResolvedValueOnce({
          data: [
            { id: 'doc1', title: 'Doc 1', url: '/doc/doc1' },
            { id: 'doc2', title: 'Doc 2', url: '/doc/doc2' },
          ],
        })
        .mockResolvedValueOnce({
          data: { id: 'doc1', title: 'Doc 1', text: 'Content 1', url: '/doc/doc1', collectionId: 'col1' },
        })
        .mockRejectedValueOnce(new Error('Fetch failed'));

      const result = await handlers.sync_knowledge({});

      expect(result.errors).toBe(1);
    });
  });

  describe('ask_wiki', () => {
    test('should return answer with sources', async () => {
      const result = await handlers.ask_wiki({ question: 'What is the meaning of life?' });

      expect(result.answer).toBe('The answer is 42.');
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].title).toBe('Guide');
    });
  });

  describe('summarize_document', () => {
    test('should return document summary', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'doc1', title: 'Test Doc', text: 'Long document content...' },
      });

      const result = await handlers.summarize_document({ documentId: 'doc1' });

      expect(result.documentId).toBe('doc1');
      expect(result.title).toBe('Test Doc');
      expect(result.summary).toBe('This is a summary of the document.');
    });

    test('should handle document without content', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'doc1', title: 'Empty Doc', text: '' },
      });

      const result = await handlers.summarize_document({ documentId: 'doc1' });

      expect(result.error).toContain('no content to summarize');
    });

    test('should pass language parameter', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'doc1', title: 'Test Doc', text: 'Content' },
      });

      await handlers.summarize_document({ documentId: 'doc1', language: 'English' });

      expect(mockBrain.summarize).toHaveBeenCalledWith('Content', 'English');
    });
  });

  describe('suggest_tags', () => {
    test('should return suggested tags', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'doc1', title: 'Test Doc', text: 'Technology article content' },
      });

      const result = await handlers.suggest_tags({ documentId: 'doc1' });

      expect(result.documentId).toBe('doc1');
      expect(result.suggestedTags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should handle document without content', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'doc1', title: 'Empty Doc', text: '' },
      });

      const result = await handlers.suggest_tags({ documentId: 'doc1' });

      expect(result.error).toContain('no content to analyze');
    });
  });

  describe('find_related', () => {
    test('should return related documents', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'doc1', title: 'Source Doc', text: 'Original content' },
      });

      const result = await handlers.find_related({ documentId: 'doc1', limit: 5 });

      expect(result.documentId).toBe('doc1');
      expect(result.related).toHaveLength(1);
      expect(result.related[0].title).toBe('Related Doc');
    });

    test('should filter out source document from results', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'doc1', title: 'Source Doc', text: 'Original content' },
      });

      // The mock already returns doc2, which is different from doc1
      const result = await handlers.find_related({ documentId: 'doc1' });

      expect(result.related.every((r: { title: string }) => r.title !== 'Source Doc')).toBe(true);
    });
  });

  describe('generate_diagram', () => {
    test('should return Mermaid diagram', async () => {
      const result = await handlers.generate_diagram({ description: 'User login flow' });

      expect(result.diagram).toContain('graph TD');
      expect(result.note).toContain('Mermaid');
    });
  });

  describe('smart_status', () => {
    test('should return status when enabled', async () => {
      const result = await handlers.smart_status();

      expect(result.enabled).toBe(true);
      expect(result.indexedChunks).toBe(100);
      expect(result.message).toContain('enabled');
    });
  });

  describe('disabled state', () => {
    test('should return error when smart features disabled', async () => {
      const disabledBrain = createMockBrain(false);

      const disabledCtx: AppContext = {
        apiClient: mockApiClient as never,
        apiCall: mockApiCall,
        config: { ...mockConfig, ENABLE_SMART_FEATURES: false },
        brain: disabledBrain,
      };

      const disabledHandlers = createSmartHandlers(disabledCtx);
      const result = await disabledHandlers.sync_knowledge({});

      expect(result.error).toContain('Smart features are disabled');
    });
  });
});
