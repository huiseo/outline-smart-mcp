/**
 * MCP Response Module
 *
 * Response formatting for MCP protocol
 */

import type { ZodError } from 'zod';
import { OutlineApiError } from './errors.js';

export interface McpResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Create success response (JSON)
 */
export function jsonResponse(data: unknown): McpResponse {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Create success response (text)
 */
export function textResponse(text: string): McpResponse {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Create error response
 */
export function errorResponse(error: unknown): McpResponse {
  let message = 'Unknown error';
  let details = '';

  if (error instanceof OutlineApiError) {
    message = error.message;
    if (error.data) {
      details = JSON.stringify(error.data, null, 2);
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return {
    content: [
      {
        type: 'text',
        text: details ? `Error: ${message}\n${details}` : `Error: ${message}`,
      },
    ],
    isError: true,
  };
}

/**
 * Create Zod validation error response
 */
export function validationErrorResponse(error: ZodError): McpResponse {
  const issues = error.issues.map(
    (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
  );

  return {
    content: [
      {
        type: 'text',
        text: `Validation Error:\n${issues.join('\n')}`,
      },
    ],
    isError: true,
  };
}
