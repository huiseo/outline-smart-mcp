/**
 * Embedding Service Tests
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EmbeddingService } from './embeddings.js';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.1) }],
        }),
      },
    })),
  };
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService('test-api-key');
  });

  test('should return correct dimensions', () => {
    expect(service.getDimensions()).toBe(1536);
  });

  test('should return embedding vector', async () => {
    const embedding = await service.getEmbedding('test text');

    expect(embedding).toHaveLength(1536);
    expect(embedding[0]).toBe(0.1);
  });

  test('should throw error when API key is missing', async () => {
    const serviceWithoutKey = new EmbeddingService();

    await expect(serviceWithoutKey.getEmbedding('test')).rejects.toThrow(
      'OpenAI API Key is not configured.'
    );
  });

  test('should truncate long text', async () => {
    const longText = 'a'.repeat(10000);
    const embedding = await service.getEmbedding(longText);

    expect(embedding).toHaveLength(1536);
  });
});
