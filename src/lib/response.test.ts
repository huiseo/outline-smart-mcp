/**
 * Response Module Tests
 */

import { describe, test, expect } from 'vitest';
import { z } from 'zod';
import {
  jsonResponse,
  textResponse,
  errorResponse,
  validationErrorResponse,
} from './response.js';
import { OutlineApiError } from './errors.js';

describe('jsonResponse', () => {
  test('should format data as JSON', () => {
    const data = { id: '123', name: 'Test' };
    const result = jsonResponse(data);

    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    });
  });

  test('should handle arrays', () => {
    const data = [{ id: '1' }, { id: '2' }];
    const result = jsonResponse(data);

    expect(result.content[0].text).toContain('"id": "1"');
    expect(result.content[0].text).toContain('"id": "2"');
  });

  test('should handle null', () => {
    const result = jsonResponse(null);
    expect(result.content[0].text).toBe('null');
  });
});

describe('textResponse', () => {
  test('should format plain text', () => {
    const text = '# Markdown Content';
    const result = textResponse(text);

    expect(result).toEqual({
      content: [{ type: 'text', text }],
    });
  });
});

describe('errorResponse', () => {
  test('should format Error object', () => {
    const error = new Error('Something went wrong');
    const result = errorResponse(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: Something went wrong');
  });

  test('should format API error with data', () => {
    const error = new OutlineApiError(400, 'API Error', {
      code: 'INVALID_REQUEST',
      message: 'Bad input',
    });
    const result = errorResponse(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Outline API Error (400): API Error');
    expect(result.content[0].text).toContain('INVALID_REQUEST');
  });

  test('should handle unknown error type', () => {
    const result = errorResponse(null);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown error');
  });
});

describe('validationErrorResponse', () => {
  test('should format Zod validation errors', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
    });

    const parseResult = schema.safeParse({ name: '', age: -1 });
    if (!parseResult.success) {
      const result = validationErrorResponse(parseResult.error);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Validation Error');
      expect(result.content[0].text).toContain('name');
      expect(result.content[0].text).toContain('age');
    }
  });
});
