/**
 * API Client Module Tests
 */

import { describe, test, expect, vi } from 'vitest';
import { withRetry, createApiCaller } from './api-client.js';
import { OutlineApiError } from './errors.js';

describe('withRetry', () => {
  test('should return result on first successful attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: 'success' });

    const result = await withRetry(mockFn, { maxRetries: 3, retryDelayMs: 10 });

    expect(result).toEqual({ data: 'success' });
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should retry on 500 error and succeed', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new OutlineApiError(500, 'Server Error'))
      .mockResolvedValue({ data: 'success' });

    const result = await withRetry(mockFn, { maxRetries: 3, retryDelayMs: 10 });

    expect(result).toEqual({ data: 'success' });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should retry on 429 rate limit error', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new OutlineApiError(429, 'Rate Limited'))
      .mockResolvedValue({ data: 'success' });

    const result = await withRetry(mockFn, { maxRetries: 3, retryDelayMs: 10 });

    expect(result).toEqual({ data: 'success' });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should throw after max retries', async () => {
    const error = new OutlineApiError(500, 'Server Error');
    const mockFn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(mockFn, { maxRetries: 3, retryDelayMs: 10 })
    ).rejects.toBeInstanceOf(OutlineApiError);

    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('should not retry on 400 client error', async () => {
    const error = new OutlineApiError(400, 'Bad Request');
    const mockFn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(mockFn, { maxRetries: 3, retryDelayMs: 10 })
    ).rejects.toMatchObject({ status: 400 });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should not retry on 401 unauthorized error', async () => {
    const error = new OutlineApiError(401, 'Unauthorized');
    const mockFn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(mockFn, { maxRetries: 3, retryDelayMs: 10 })
    ).rejects.toMatchObject({ status: 401 });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should call onRetry callback', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new OutlineApiError(500, 'Error'))
      .mockResolvedValue({ data: 'success' });
    const onRetry = vi.fn();

    await withRetry(mockFn, { maxRetries: 3, retryDelayMs: 10, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, 3, expect.any(Number), expect.any(OutlineApiError));
  });

  test('should use exponential backoff', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new OutlineApiError(500, 'Error'))
      .mockRejectedValueOnce(new OutlineApiError(500, 'Error'))
      .mockResolvedValue({ data: 'success' });
    const delays: number[] = [];
    const onRetry = vi.fn((_, __, delay) => delays.push(delay));

    await withRetry(mockFn, { maxRetries: 3, retryDelayMs: 100, onRetry });

    expect(delays[0]).toBe(100); // 100 * 2^0
    expect(delays[1]).toBe(200); // 100 * 2^1
  });
});

describe('createApiCaller', () => {
  test('should create a caller with config options', async () => {
    const config = {
      OUTLINE_URL: 'https://example.com',
      OUTLINE_API_TOKEN: 'test',
      READ_ONLY: false,
      DISABLE_DELETE: false,
      MAX_RETRIES: 2,
      RETRY_DELAY_MS: 50,
      ENABLE_SMART_FEATURES: false,
    };
    const apiCall = createApiCaller(config);
    const mockFn = vi.fn().mockResolvedValue({ data: 'test' });

    const result = await apiCall(mockFn);

    expect(result).toEqual({ data: 'test' });
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
