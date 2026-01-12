/**
 * Brain Module Tests
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Brain, createBrain } from './index.js';
import type { WikiDocument } from './types.js';

// Mock dependencies
vi.mock('./embeddings.js', () => ({
  EmbeddingService: vi.fn().mockImplementation(() => ({
    isEnabled: vi.fn().mockReturnValue(true),
    getDimensions: vi.fn().mockReturnValue(1536),
    getEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0.1)),
    getEmbeddings: vi.fn().mockResolvedValue([Array(1536).fill(0.1)]),
  })),
}));

vi.mock('./vector-store.js', () => ({
  VectorStore: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(5),
    upsert: vi.fn().mockResolvedValue(5),
    search: vi.fn().mockResolvedValue([
      { id: 'doc1-chunk-0', text: 'Content about topic', title: 'Doc 1', url: 'http://test.com/doc1', score: 0.1 },
    ]),
    count: vi.fn().mockResolvedValue(10),
    clear: vi.fn().mockResolvedValue(undefined),
    getDocumentIds: vi.fn().mockResolvedValue(new Map()),
    deleteByDocumentId: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./processor.js', () => ({
  LlmProcessor: vi.fn().mockImplementation(() => ({
    isEnabled: vi.fn().mockReturnValue(true),
    summarize: vi.fn().mockResolvedValue('This is a summary.'),
    suggestTags: vi.fn().mockResolvedValue(['tag1', 'tag2', 'tag3']),
    answerFromContext: vi.fn().mockResolvedValue('This is the answer based on context.'),
    generateMermaid: vi.fn().mockResolvedValue('graph TD\n  A --> B'),
  })),
}));

vi.mock('@langchain/textsplitters', () => ({
  RecursiveCharacterTextSplitter: vi.fn().mockImplementation(() => ({
    createDocuments: vi.fn().mockResolvedValue([
      { pageContent: 'Chunk 1 content' },
      { pageContent: 'Chunk 2 content' },
    ]),
  })),
}));

describe('Brain', () => {
  let brain: Brain;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set env for enabled state
    process.env.ENABLE_SMART_FEATURES = 'true';
    process.env.OPENAI_API_KEY = 'test-key';

    brain = new Brain({ openaiApiKey: 'test-key', enabled: true });
  });

  afterEach(() => {
    delete process.env.ENABLE_SMART_FEATURES;
    delete process.env.OPENAI_API_KEY;
  });

  describe('isEnabled', () => {
    test('should return true when enabled', () => {
      expect(brain.isEnabled()).toBe(true);
    });

    test('should return false when disabled', () => {
      const disabledBrain = new Brain({ enabled: false });
      expect(disabledBrain.isEnabled()).toBe(false);
    });
  });

  describe('syncDocuments', () => {
    test('should sync documents and return stats', async () => {
      const docs: WikiDocument[] = [
        { id: 'doc1', title: 'Test Doc', text: 'Document content here' },
        { id: 'doc2', title: 'Test Doc 2', text: 'More content' },
      ];

      const result = await brain.syncDocuments(docs);

      expect(result.documents).toBe(2);
      expect(result.chunks).toBeGreaterThan(0);
    });

    test('should skip documents without text', async () => {
      const docs: WikiDocument[] = [
        { id: 'doc1', title: 'Empty Doc', text: '' },
        { id: 'doc2', title: 'Valid Doc', text: 'Has content' },
      ];

      const result = await brain.syncDocuments(docs);

      expect(result.documents).toBe(1);
    });

    test('should throw when disabled', async () => {
      const disabledBrain = new Brain({ enabled: false });

      await expect(disabledBrain.syncDocuments([])).rejects.toThrow('Smart features are disabled');
    });
  });

  describe('search', () => {
    test('should return search results', async () => {
      const results = await brain.search('test query');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Doc 1');
    });

    test('should throw when disabled', async () => {
      const disabledBrain = new Brain({ enabled: false });

      await expect(disabledBrain.search('test')).rejects.toThrow('Smart features are disabled');
    });
  });

  describe('ask', () => {
    test('should return answer with sources', async () => {
      const result = await brain.ask('What is the topic?');

      expect(result.answer).toBe('This is the answer based on context.');
      expect(result.sources).toHaveLength(1);
    });

    test('should return message when no documents found', async () => {
      // Override search mock for this test
      const { VectorStore } = await import('./vector-store.js');
      vi.mocked(VectorStore).mockImplementationOnce(() => ({
        init: vi.fn().mockResolvedValue(undefined),
        save: vi.fn(),
        upsert: vi.fn(),
        search: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        clear: vi.fn(),
        getDocumentIds: vi.fn().mockResolvedValue(new Map()),
        deleteByDocumentId: vi.fn(),
      }) as never);

      const newBrain = new Brain({ openaiApiKey: 'test-key', enabled: true });
      const result = await newBrain.ask('Unknown question');

      expect(result.answer).toBe('No relevant documents found in the wiki.');
      expect(result.sources).toHaveLength(0);
    });
  });

  describe('summarize', () => {
    test('should return summary', async () => {
      const summary = await brain.summarize('Long document text');

      expect(summary).toBe('This is a summary.');
    });
  });

  describe('suggestTags', () => {
    test('should return tag suggestions', async () => {
      const tags = await brain.suggestTags('Document about technology');

      expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('generateDiagram', () => {
    test('should return Mermaid diagram', async () => {
      const diagram = await brain.generateDiagram('Login flow');

      expect(diagram).toContain('graph');
    });
  });

  describe('getStats', () => {
    test('should return stats when enabled', async () => {
      const stats = await brain.getStats();

      expect(stats.enabled).toBe(true);
      expect(stats.chunks).toBe(10);
    });

    test('should return disabled stats when not enabled', async () => {
      const disabledBrain = new Brain({ enabled: false });
      const stats = await disabledBrain.getStats();

      expect(stats.enabled).toBe(false);
      expect(stats.chunks).toBe(0);
    });
  });

  describe('clear', () => {
    test('should clear the store', async () => {
      await expect(brain.clear()).resolves.toBeUndefined();
    });
  });
});

describe('createBrain factory', () => {
  test('should create a new Brain instance', () => {
    const brain1 = createBrain({ enabled: true, openaiApiKey: 'test' });
    const brain2 = createBrain({ enabled: true, openaiApiKey: 'test' });

    // Factory creates new instances each time
    expect(brain1).not.toBe(brain2);
  });

  test('should accept custom dependencies', () => {
    const mockDeps = {
      embeddings: {
        isEnabled: () => true,
        getDimensions: () => 1536,
        getEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0.1)),
        getEmbeddings: vi.fn().mockResolvedValue([Array(1536).fill(0.1)]),
      },
      store: {
        init: vi.fn().mockResolvedValue(undefined),
        save: vi.fn().mockResolvedValue(5),
        upsert: vi.fn().mockResolvedValue(5),
        search: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        clear: vi.fn().mockResolvedValue(undefined),
        getDocumentIds: vi.fn().mockResolvedValue(new Map()),
        deleteByDocumentId: vi.fn().mockResolvedValue(undefined),
      },
      processor: {
        isEnabled: () => true,
        summarize: vi.fn().mockResolvedValue('Mock summary'),
        suggestTags: vi.fn().mockResolvedValue(['mock-tag']),
        answerFromContext: vi.fn().mockResolvedValue('Mock answer'),
        generateMermaid: vi.fn().mockResolvedValue('graph TD\n  Mock'),
      },
    };

    const brain = createBrain({ enabled: true }, mockDeps);
    expect(brain.isEnabled()).toBe(true);
  });
});
