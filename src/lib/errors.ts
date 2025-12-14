/**
 * Error Module
 *
 * Structured error class definitions
 */

/**
 * Outline API Error Class
 */
export class OutlineApiError extends Error {
  readonly name = 'OutlineApiError';

  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
    public readonly cause?: unknown
  ) {
    super(`Outline API Error (${status}): ${message}`);
    Error.captureStackTrace?.(this, OutlineApiError);
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

  /** JSON serialization */
  toJSON() {
    return {
      name: this.name,
      status: this.status,
      message: this.message,
      data: this.data,
    };
  }

  /** Create OutlineApiError from error object */
  static from(error: unknown): OutlineApiError {
    if (error instanceof OutlineApiError) {
      return error;
    }

    if (error instanceof Error) {
      return new OutlineApiError(0, error.message, undefined, error);
    }

    return new OutlineApiError(0, String(error), undefined, error);
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

  toJSON() {
    return {
      name: this.name,
      operation: this.operation,
      reason: this.reason,
      message: this.message,
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

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      issues: this.issues,
    };
  }
}
