/**
 * Config Module Tests
 */

import { describe, test, expect } from 'vitest';
import { createConfig, validateConfig, formatConfigError } from './config.js';

describe('createConfig', () => {
  test('should use default values when only token is provided', () => {
    const config = createConfig({
      OUTLINE_API_TOKEN: 'test-token',
    });

    expect(config.OUTLINE_URL).toBe('https://app.getoutline.com');
    expect(config.OUTLINE_API_TOKEN).toBe('test-token');
    expect(config.READ_ONLY).toBe(false);
    expect(config.DISABLE_DELETE).toBe(false);
    expect(config.MAX_RETRIES).toBe(3);
    expect(config.RETRY_DELAY_MS).toBe(1000);
  });

  test('should use provided env values', () => {
    const config = createConfig({
      OUTLINE_URL: 'https://example.com',
      OUTLINE_API_TOKEN: 'test-token',
      READ_ONLY: 'true',
      DISABLE_DELETE: 'true',
      MAX_RETRIES: '5',
      RETRY_DELAY_MS: '2000',
    });

    expect(config.OUTLINE_URL).toBe('https://example.com');
    expect(config.OUTLINE_API_TOKEN).toBe('test-token');
    expect(config.READ_ONLY).toBe(true);
    expect(config.DISABLE_DELETE).toBe(true);
    expect(config.MAX_RETRIES).toBe(5);
    expect(config.RETRY_DELAY_MS).toBe(2000);
  });

  test('should parse READ_ONLY correctly', () => {
    expect(createConfig({ OUTLINE_API_TOKEN: 'x', READ_ONLY: 'true' }).READ_ONLY).toBe(true);
    expect(createConfig({ OUTLINE_API_TOKEN: 'x', READ_ONLY: 'false' }).READ_ONLY).toBe(false);
    expect(createConfig({ OUTLINE_API_TOKEN: 'x', READ_ONLY: 'TRUE' }).READ_ONLY).toBe(false);
    expect(createConfig({ OUTLINE_API_TOKEN: 'x' }).READ_ONLY).toBe(false);
  });

  test('should throw when API token is missing', () => {
    expect(() => createConfig({})).toThrow();
  });

  test('should throw when URL is invalid', () => {
    expect(() =>
      createConfig({
        OUTLINE_URL: 'not-a-url',
        OUTLINE_API_TOKEN: 'test',
      })
    ).toThrow();
  });
});

describe('validateConfig', () => {
  test('should return success when valid', () => {
    const result = validateConfig({ OUTLINE_API_TOKEN: 'test-token' });
    expect(result.success).toBe(true);
  });

  test('should return error when API token is missing', () => {
    const result = validateConfig({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('formatConfigError', () => {
  test('should format error messages', () => {
    const result = validateConfig({});
    if (!result.success) {
      const formatted = formatConfigError(result.error);
      expect(formatted).toContain('OUTLINE_API_TOKEN');
    }
  });
});
