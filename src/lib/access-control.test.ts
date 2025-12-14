/**
 * Access Control Module Tests
 */

import { describe, test, expect } from 'vitest';
import {
  checkWriteAccess,
  checkDeleteAccess,
  checkAccess,
  filterToolsByAccess,
  isWriteTool,
  isDeleteTool,
  AccessDeniedError,
} from './access-control.js';
import type { Config } from './config.js';
import type { ToolDefinition } from './tools.js';

const baseConfig: Config = {
  OUTLINE_URL: 'https://example.com',
  OUTLINE_API_TOKEN: 'test',
  READ_ONLY: false,
  DISABLE_DELETE: false,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  ENABLE_SMART_FEATURES: false,
};

describe('checkWriteAccess', () => {
  test('should not throw when READ_ONLY is false', () => {
    expect(() => checkWriteAccess(baseConfig, 'create_document')).not.toThrow();
  });

  test('should throw when READ_ONLY is true for write tools', () => {
    const config = { ...baseConfig, READ_ONLY: true };
    expect(() => checkWriteAccess(config, 'create_document')).toThrow(AccessDeniedError);
  });

  test('should not throw for read tools even in READ_ONLY mode', () => {
    const config = { ...baseConfig, READ_ONLY: true };
    expect(() => checkWriteAccess(config, 'search_documents')).not.toThrow();
  });
});

describe('checkDeleteAccess', () => {
  test('should not throw when DISABLE_DELETE is false', () => {
    expect(() => checkDeleteAccess(baseConfig, 'delete_document')).not.toThrow();
  });

  test('should throw when DISABLE_DELETE is true for delete tools', () => {
    const config = { ...baseConfig, DISABLE_DELETE: true };
    expect(() => checkDeleteAccess(config, 'delete_document')).toThrow(AccessDeniedError);
  });

  test('should not throw for non-delete tools even with DISABLE_DELETE', () => {
    const config = { ...baseConfig, DISABLE_DELETE: true };
    expect(() => checkDeleteAccess(config, 'create_document')).not.toThrow();
  });
});

describe('checkAccess', () => {
  test('should check both write and delete access', () => {
    const config = { ...baseConfig, READ_ONLY: true };
    expect(() => checkAccess(config, 'delete_document')).toThrow(AccessDeniedError);
  });
});

describe('filterToolsByAccess', () => {
  const mockTools: ToolDefinition[] = [
    { name: 'search_documents', description: '', inputSchema: {} },
    { name: 'get_document', description: '', inputSchema: {} },
    { name: 'create_document', description: '', inputSchema: {} },
    { name: 'update_document', description: '', inputSchema: {} },
    { name: 'delete_document', description: '', inputSchema: {} },
    { name: 'delete_collection', description: '', inputSchema: {} },
    { name: 'list_collections', description: '', inputSchema: {} },
  ];

  test('should return all tools when no restrictions', () => {
    const filtered = filterToolsByAccess(mockTools, baseConfig);
    expect(filtered).toHaveLength(7);
  });

  test('should filter write tools in READ_ONLY mode', () => {
    const config = { ...baseConfig, READ_ONLY: true };
    const filtered = filterToolsByAccess(mockTools, config);

    expect(filtered).toHaveLength(3);
    expect(filtered.map((t) => t.name)).toEqual([
      'search_documents',
      'get_document',
      'list_collections',
    ]);
  });

  test('should filter delete tools in DISABLE_DELETE mode', () => {
    const config = { ...baseConfig, DISABLE_DELETE: true };
    const filtered = filterToolsByAccess(mockTools, config);

    expect(filtered).toHaveLength(5);
    expect(filtered.map((t) => t.name)).not.toContain('delete_document');
    expect(filtered.map((t) => t.name)).not.toContain('delete_collection');
  });

  test('should combine READ_ONLY and DISABLE_DELETE filters', () => {
    const config = { ...baseConfig, READ_ONLY: true, DISABLE_DELETE: true };
    const filtered = filterToolsByAccess(mockTools, config);

    expect(filtered).toHaveLength(3);
    expect(filtered.map((t) => t.name)).toEqual([
      'search_documents',
      'get_document',
      'list_collections',
    ]);
  });
});

describe('isWriteTool', () => {
  test('should return true for write tools', () => {
    expect(isWriteTool('create_document')).toBe(true);
    expect(isWriteTool('update_document')).toBe(true);
    expect(isWriteTool('delete_document')).toBe(true);
  });

  test('should return false for read tools', () => {
    expect(isWriteTool('search_documents')).toBe(false);
    expect(isWriteTool('get_document')).toBe(false);
    expect(isWriteTool('list_collections')).toBe(false);
  });
});

describe('isDeleteTool', () => {
  test('should return true for delete tools', () => {
    expect(isDeleteTool('delete_document')).toBe(true);
    expect(isDeleteTool('delete_collection')).toBe(true);
    expect(isDeleteTool('batch_delete_documents')).toBe(true);
  });

  test('should return false for non-delete tools', () => {
    expect(isDeleteTool('create_document')).toBe(false);
    expect(isDeleteTool('update_document')).toBe(false);
    expect(isDeleteTool('archive_document')).toBe(false);
  });
});
