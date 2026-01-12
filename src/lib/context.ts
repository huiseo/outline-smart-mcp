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
  /** Smart wiki brain (lazy-initialized) */
  readonly brain: IBrain;
}

/**
 * Lazy Brain wrapper - only initializes Brain when actually used
 * This saves memory and startup time when smart features are disabled
 */
class LazyBrain implements IBrain {
  private _instance: Brain | null = null;
  private readonly enabled: boolean;
  private readonly openaiApiKey?: string;

  constructor(config: { enabled: boolean; openaiApiKey?: string }) {
    this.enabled = config.enabled;
    this.openaiApiKey = config.openaiApiKey;
  }

  private get instance(): Brain {
    if (!this._instance) {
      this._instance = new Brain({
        enabled: this.enabled,
        openaiApiKey: this.openaiApiKey,
      });
    }
    return this._instance;
  }

  isEnabled(): boolean {
    // Don't create instance just to check if enabled
    return this.enabled;
  }

  async syncDocuments(documents: Parameters<IBrain['syncDocuments']>[0]) {
    return this.instance.syncDocuments(documents);
  }

  async syncDocument(doc: Parameters<IBrain['syncDocument']>[0]) {
    return this.instance.syncDocument(doc);
  }

  async ask(question: string) {
    return this.instance.ask(question);
  }

  async search(query: string, limit?: number) {
    return this.instance.search(query, limit);
  }

  async summarize(text: string, language?: string) {
    return this.instance.summarize(text, language);
  }

  async suggestTags(text: string) {
    return this.instance.suggestTags(text);
  }

  async generateDiagram(description: string) {
    return this.instance.generateDiagram(description);
  }

  async getStats() {
    // If not initialized yet and disabled, return early without creating instance
    if (!this._instance && !this.enabled) {
      return { enabled: false, chunks: 0 };
    }
    return this.instance.getStats();
  }

  async clear() {
    // Only clear if instance exists
    if (this._instance) {
      return this._instance.clear();
    }
  }
}

/**
 * Create application context
 */
export function createAppContext(config: Config): AppContext {
  const apiClient = createApiClient(config);
  const apiCall = createApiCaller(config);

  // Use lazy brain to defer initialization until needed
  const brain = new LazyBrain({
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
  const brain = overrides.brain ?? new LazyBrain({ enabled: false });

  return {
    apiClient: overrides.apiClient ?? createApiClient(config),
    apiCall: overrides.apiCall ?? (async (fn) => fn()),
    config,
    brain,
  };
}
