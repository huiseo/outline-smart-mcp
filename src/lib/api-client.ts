/**
 * API Client Module
 *
 * Native Fetch-based HTTP client with AbortController support
 */

import type { Config } from './config.js';
import { OutlineApiError } from './errors.js';

/** API response type */
export interface ApiResponse<T = unknown> {
  data: T;
  ok: boolean;
  status: number;
}

/** Request options */
export interface RequestOptions {
  signal?: AbortSignal;
  timeout?: number;
}

/** Default timeout (30 seconds) */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * API Client Class
 */
export class OutlineApiClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly defaultTimeout: number;

  constructor(config: Config) {
    this.baseUrl = `${config.OUTLINE_URL}/api`;
    this.token = config.OUTLINE_API_TOKEN;
    this.defaultTimeout = DEFAULT_TIMEOUT_MS;
  }

  /**
   * Execute POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutMs = options?.timeout ?? this.defaultTimeout;

    const timeoutId = options?.signal
      ? undefined
      : setTimeout(() => controller.abort(), timeoutMs);

    const signal = options?.signal ?? controller.signal;

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      if (!response.ok) {
        throw new OutlineApiError(
          response.status,
          response.statusText,
          await this.parseResponseBody(response)
        );
      }

      const data = (await response.json()) as { data: T };
      return {
        data: data.data,
        ok: true,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof OutlineApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OutlineApiError(0, 'Request timeout or aborted', undefined, error);
      }

      throw OutlineApiError.from(error);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /** Parse response body (returns undefined on failure) */
  private async parseResponseBody(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}

/**
 * Create API client
 */
export function createApiClient(config: Config): OutlineApiClient {
  return new OutlineApiClient(config);
}

/** Retry options type */
export interface RetryOptions {
  maxRetries: number;
  retryDelayMs: number;
  onRetry?: (attempt: number, maxRetries: number, delay: number, error: unknown) => void;
}

/**
 * API call wrapper with retry logic and exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxRetries, retryDelayMs, onRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const apiError = OutlineApiError.from(error);

      if (apiError.isRetryable() && attempt < maxRetries) {
        const delay = apiError.isRateLimitError()
          ? 1000
          : retryDelayMs * Math.pow(2, attempt - 1);

        onRetry?.(attempt, maxRetries, delay, error);

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw apiError;
    }
  }

  throw new Error('Unexpected: retry loop completed without return or throw');
}

/**
 * Create API caller with retry options
 */
export function createApiCaller(config: Config) {
  const retryOptions: RetryOptions = {
    maxRetries: config.MAX_RETRIES,
    retryDelayMs: config.RETRY_DELAY_MS,
    onRetry: (attempt, max, delay) => {
      console.error(`Retry ${attempt}/${max} after ${delay}ms...`);
    },
  };

  return <T>(fn: () => Promise<T>) => withRetry(fn, retryOptions);
}
