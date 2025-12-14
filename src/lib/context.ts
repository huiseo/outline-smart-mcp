/**
 * Application Context Module
 *
 * Context object for dependency injection
 */

import type { Config } from './config.js';
import type { OutlineApiClient } from './api-client.js';
import { createApiClient, createApiCaller } from './api-client.js';
import type { ApiCaller } from './types/handlers.js';
import type { IBrain } from './brain/types.js';
import { Brain } from './brain/index.js';

/**
 * Application context interface
 */
export interface AppContext {
  /** API client */
  readonly apiClient: OutlineApiClient;
  /** API caller with retry logic */
  readonly apiCall: ApiCaller;
  /** Configuration object (immutable) */
  readonly config: Readonly<Config>;
  /** Smart wiki brain (optional) */
  readonly brain: IBrain;
}

/**
 * Create application context
 */
export function createAppContext(config: Config): AppContext {
  const apiClient = createApiClient(config);
  const apiCall = createApiCaller(config);
  const brain = new Brain({
    enabled: config.ENABLE_SMART_FEATURES,
    openaiApiKey: config.OPENAI_API_KEY,
  });

  return Object.freeze({
    apiClient,
    apiCall,
    config: Object.freeze({ ...config }),
    brain,
  });
}

/**
 * Create test context helper
 */
export function createTestContext(overrides: Partial<AppContext> = {}): AppContext {
  const defaultConfig: Config = {
    OUTLINE_URL: 'https://test.example.com',
    OUTLINE_API_TOKEN: 'test-token',
    READ_ONLY: false,
    DISABLE_DELETE: false,
    MAX_RETRIES: 1,
    RETRY_DELAY_MS: 10,
    ENABLE_SMART_FEATURES: false,
  };

  const config = overrides.config ?? defaultConfig;
  const brain = overrides.brain ?? new Brain({ enabled: false });

  return {
    apiClient: overrides.apiClient ?? createApiClient(config),
    apiCall: overrides.apiCall ?? (async (fn) => fn()),
    config,
    brain,
  };
}
