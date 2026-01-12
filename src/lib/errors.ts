/**
 * Error Module
 *
 * Structured error class definitions with recovery hints for LLM
 */

/**
 * Recovery hints for common HTTP status codes
 */
const RECOVERY_HINTS: Record<number, string> = {
  400: 'Hint: Bad request. Check that all required parameters are provided and have valid values.',
  401: 'Hint: Authentication failed. Verify OUTLINE_API_TOKEN is correct (should start with "ol_api_" or similar).',
  403: 'Hint: Permission denied. The API token may not have access to this resource or operation.',
  404: 'Hint: Resource not found. Use search_documents or list_collections to find valid IDs.',
  409: 'Hint: Conflict error. The resource may have been modified by another request. Try again.',
  422: 'Hint: Validation error. Check that all parameters match the expected format and constraints.',
  429: 'Hint: Rate limit exceeded. The server will retry automatically with exponential backoff.',
  500: 'Hint: Server error. This is a temporary issue. Try again in a moment.',
  502: 'Hint: Bad gateway. The Outline server may be temporarily unavailable.',
  503: 'Hint: Service unavailable. The Outline server is under maintenance or overloaded.',
  504: 'Hint: Gateway timeout. The request took too long. Try with a smaller dataset or simpler query.',
};

/**
 * Context-specific recovery suggestions
 */
const CONTEXT_HINTS: Record<string, string> = {
  document_not_found:
    'The document ID does not exist. Use search_documents to find documents, or get_document_id_from_title if you know the title.',
  collection_not_found:
    'The collection ID does not exist. Use list_collections to get available collection IDs.',
  comment_not_found:
    'The comment ID does not exist. Use list_document_comments to get comment IDs for a document.',
  invalid_parent:
    'The parent document ID is invalid. Use get_collection_structure to see the document hierarchy.',
  sync_required:
    'Smart features require sync_knowledge to be run first. Run sync_knowledge before using ask_wiki or find_related.',
  smart_features_disabled:
    'Smart features are disabled. Set ENABLE_SMART_FEATURES=true and provide OPENAI_API_KEY to enable.',
};

/**
 * Outline API Error Class with Recovery Hints
 */
export class OutlineApiError extends Error {
  readonly name = 'OutlineApiError';

  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
    public readonly cause?: unknown,
    public readonly context?: string,
    public readonly retryAfterMs?: number
  ) {
    super(`Outline API Error (${status}): ${message}`);
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, OutlineApiError);
    }
  }

  /** Check if error is retryable */
  isRetryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }

  /** Check if error is authentication error */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** Check if error is rate limit error */
  isRateLimitError(): boolean {
    return this.status === 429;
  }

  /** Check if error is not found error */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /** Check if error is validation error */
  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  /**
   * Get recovery hint for this error
   * Provides actionable suggestions for the LLM to recover from the error
   */
  getRecoveryHint(): string {
    // Check for context-specific hint first
    if (this.context && CONTEXT_HINTS[this.context]) {
      return CONTEXT_HINTS[this.context];
    }

    // Check for status-based hint
    if (RECOVERY_HINTS[this.status]) {
      return RECOVERY_HINTS[this.status];
    }

    // Default hint based on error category
    if (this.isAuthError()) {
      return 'Hint: Authentication or permission error. Check API token and permissions.';
    }

    if (this.isRetryable()) {
      return 'Hint: Temporary error. The request will be retried automatically.';
    }

    return 'Hint: Check the error message for details on what went wrong.';
  }

  /**
   * Get user-friendly error message with recovery hint
   */
  getUserMessage(): string {
    return `${this.message}\n\n${this.getRecoveryHint()}`;
  }

  /** JSON serialization */
  toJSON() {
    return {
      name: this.name,
      status: this.status,
      message: this.message,
      data: this.data,
      recoveryHint: this.getRecoveryHint(),
      ...(this.retryAfterMs && { retryAfterMs: this.retryAfterMs }),
    };
  }

  /** Create OutlineApiError from error object */
  static from(error: unknown, context?: string): OutlineApiError {
    if (error instanceof OutlineApiError) {
      // Add context if provided
      if (context && !error.context) {
        return new OutlineApiError(
          error.status,
          error.message.replace(`Outline API Error (${error.status}): `, ''),
          error.data,
          error.cause,
          context,
          error.retryAfterMs
        );
      }
      return error;
    }

    if (error instanceof Error) {
      return new OutlineApiError(-1, error.message, undefined, error, context);
    }

    return new OutlineApiError(-1, String(error), undefined, error, context);
  }

  /**
   * Create a not found error with appropriate context
   */
  static notFound(resourceType: 'document' | 'collection' | 'comment', id: string): OutlineApiError {
    const contextMap = {
      document: 'document_not_found',
      collection: 'collection_not_found',
      comment: 'comment_not_found',
    };

    return new OutlineApiError(
      404,
      `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found: ${id}`,
      { resourceType, id },
      undefined,
      contextMap[resourceType]
    );
  }
}

/**
 * Access Denied Error Class
 */
export class AccessDeniedError extends Error {
  readonly name = 'AccessDeniedError';

  constructor(
    public readonly operation: string,
    public readonly reason: string
  ) {
    super(`Access denied for '${operation}': ${reason}`);
    Error.captureStackTrace?.(this, AccessDeniedError);
  }

  /**
   * Get recovery hint for access denied error
   */
  getRecoveryHint(): string {
    if (this.reason.includes('read-only')) {
      return 'Hint: Server is in read-only mode. Write operations are disabled. Contact admin to enable.';
    }
    if (this.reason.includes('delete')) {
      return 'Hint: Delete operations are disabled. Use archive_document instead, or contact admin.';
    }
    return 'Hint: This operation is not allowed with current configuration. Check server settings.';
  }

  getUserMessage(): string {
    return `${this.message}\n\n${this.getRecoveryHint()}`;
  }

  toJSON() {
    return {
      name: this.name,
      operation: this.operation,
      reason: this.reason,
      message: this.message,
      recoveryHint: this.getRecoveryHint(),
    };
  }
}

/**
 * Configuration Error Class
 */
export class ConfigurationError extends Error {
  readonly name = 'ConfigurationError';

  constructor(
    message: string,
    public readonly issues?: Array<{ path: string; message: string }>
  ) {
    super(message);
    Error.captureStackTrace?.(this, ConfigurationError);
  }

  /**
   * Get recovery hint for configuration error
   */
  getRecoveryHint(): string {
    if (this.issues?.some((i) => i.path.includes('API_TOKEN'))) {
      return 'Hint: Set OUTLINE_API_TOKEN environment variable. Get it from Outline: Settings → API Keys → Create New.';
    }
    if (this.issues?.some((i) => i.path.includes('OPENAI'))) {
      return 'Hint: Set OPENAI_API_KEY environment variable to enable smart features.';
    }
    return 'Hint: Check environment variables and configuration. See README for required settings.';
  }

  getUserMessage(): string {
    let msg = this.message;
    if (this.issues && this.issues.length > 0) {
      msg += '\n\nIssues:\n' + this.issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n');
    }
    msg += '\n\n' + this.getRecoveryHint();
    return msg;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      issues: this.issues,
      recoveryHint: this.getRecoveryHint(),
    };
  }
}

/**
 * Smart Features Error Class
 */
export class SmartFeaturesError extends Error {
  readonly name = 'SmartFeaturesError';

  constructor(
    message: string,
    public readonly code: 'disabled' | 'not_synced' | 'openai_error' | 'no_content'
  ) {
    super(message);
    Error.captureStackTrace?.(this, SmartFeaturesError);
  }

  getRecoveryHint(): string {
    switch (this.code) {
      case 'disabled':
        return CONTEXT_HINTS.smart_features_disabled;
      case 'not_synced':
        return CONTEXT_HINTS.sync_required;
      case 'openai_error':
        return 'Hint: OpenAI API error. Check OPENAI_API_KEY is valid and has available quota.';
      case 'no_content':
        return 'Hint: The document has no content to process. Make sure the document has text.';
      default:
        return 'Hint: An error occurred with smart features. Check configuration and try again.';
    }
  }

  getUserMessage(): string {
    return `${this.message}\n\n${this.getRecoveryHint()}`;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recoveryHint: this.getRecoveryHint(),
    };
  }
}

/**
 * Helper to get error message with recovery hint
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof OutlineApiError) {
    return error.getUserMessage();
  }
  if (error instanceof AccessDeniedError) {
    return error.getUserMessage();
  }
  if (error instanceof ConfigurationError) {
    return error.getUserMessage();
  }
  if (error instanceof SmartFeaturesError) {
    return error.getUserMessage();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
