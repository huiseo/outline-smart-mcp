/**
 * LLM Processor Tests
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { LlmProcessor } from './processor.js';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mock response' } }],
          }),
        },
      },
    })),
  };
});

describe('LlmProcessor', () => {
  let processor: LlmProcessor;

  beforeEach(() => {
    processor = new LlmProcessor('test-api-key');
  });

  test('should throw error when API key is missing', async () => {
    const processorWithoutKey = new LlmProcessor();

    await expect(processorWithoutKey.summarize('test')).rejects.toThrow(
      'OpenAI API Key is not configured.'
    );
  });

  test('should summarize text', async () => {
    const summary = await processor.summarize('Long document text here');

    expect(summary).toBe('Mock response');
  });

  test('should summarize in specified language', async () => {
    const summary = await processor.summarize('Document text', 'English');

    expect(summary).toBe('Mock response');
  });

  test('should suggest tags', async () => {
    const mockProcessor = new LlmProcessor('test-api-key');

    // Override the mock for this test
    vi.mocked(mockProcessor['client']!.chat.completions.create).mockResolvedValueOnce({
      choices: [{ message: { content: 'tag1, tag2, tag3' } }],
    } as never);

    const tags = await mockProcessor.suggestTags('Document about technology');

    expect(Array.isArray(tags)).toBe(true);
  });

  test('should answer from context', async () => {
    const answer = await processor.answerFromContext(
      'What is the topic?',
      'The document is about AI.'
    );

    expect(answer).toBe('Mock response');
  });

  test('should generate Mermaid diagram', async () => {
    const diagram = await processor.generateMermaid('User login flow');

    expect(diagram).toBe('Mock response');
  });
});
