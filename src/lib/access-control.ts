/**
 * Access Control Module
 *
 * Read-only mode and delete restriction management
 */

import type { Config } from './config.js';
import type { ToolDefinition } from './tools.js';
import { AccessDeniedError } from './errors.js';

/** Write operation tools */
const WRITE_TOOLS = new Set([
  'create_document',
  'update_document',
  'move_document',
  'archive_document',
  'unarchive_document',
  'delete_document',
  'restore_document',
  'add_comment',
  'create_collection',
  'update_collection',
  'delete_collection',
  'batch_create_documents',
  'batch_update_documents',
  'batch_move_documents',
  'batch_archive_documents',
  'batch_delete_documents',
]);

/** Delete operation tools */
const DELETE_TOOLS = new Set([
  'delete_document',
  'delete_collection',
  'batch_delete_documents',
]);

// Re-export AccessDeniedError from errors.ts
export { AccessDeniedError } from './errors.js';

/**
 * Check write access
 */
export function checkWriteAccess(config: Config, toolName: string): void {
  if (config.READ_ONLY && WRITE_TOOLS.has(toolName)) {
    throw new AccessDeniedError(toolName, 'read-only mode is enabled');
  }
}

/**
 * Check delete access
 */
export function checkDeleteAccess(config: Config, toolName: string): void {
  if (config.DISABLE_DELETE && DELETE_TOOLS.has(toolName)) {
    throw new AccessDeniedError(toolName, 'delete operations are restricted');
  }
}

/**
 * Check all access permissions
 */
export function checkAccess(config: Config, toolName: string): void {
  checkWriteAccess(config, toolName);
  checkDeleteAccess(config, toolName);
}

/**
 * Filter tools by access control
 */
export function filterToolsByAccess(tools: ToolDefinition[], config: Config): ToolDefinition[] {
  return tools.filter((tool) => {
    if (config.READ_ONLY && WRITE_TOOLS.has(tool.name)) {
      return false;
    }
    if (config.DISABLE_DELETE && DELETE_TOOLS.has(tool.name)) {
      return false;
    }
    return true;
  });
}

/**
 * Check if tool is a write operation
 */
export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName);
}

/**
 * Check if tool is a delete operation
 */
export function isDeleteTool(toolName: string): boolean {
  return DELETE_TOOLS.has(toolName);
}
