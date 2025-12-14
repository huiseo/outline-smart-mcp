/**
 * Tool Definitions Module
 *
 * MCP tool definitions (JSON Schema format)
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import * as schemas from './schemas.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Convert Zod schema to MCP tool definition
 */
function createTool(
  name: string,
  description: string,
  schema: schemas.ToolName
): ToolDefinition {
  const zodSchema = schemas.toolSchemas[schema];
  const jsonSchema = zodToJsonSchema(zodSchema, { target: 'openApi3' });

  return {
    name,
    description,
    inputSchema: jsonSchema as Record<string, unknown>,
  };
}

export const allTools: ToolDefinition[] = [
  // ========== Search & Discovery ==========
  createTool(
    'search_documents',
    'Search documents by keyword. Supports pagination.',
    'search_documents'
  ),
  createTool(
    'get_document_id_from_title',
    'Find document ID by title.',
    'get_document_id_from_title'
  ),
  createTool(
    'list_collections',
    'Get list of all collections.',
    'list_collections'
  ),
  createTool(
    'get_collection_structure',
    'Get document hierarchy within a collection.',
    'get_collection_structure'
  ),
  createTool(
    'list_recent_documents',
    'Get list of recently modified documents.',
    'list_recent_documents'
  ),

  // ========== Document Reading ==========
  createTool(
    'get_document',
    'Get full document content by document ID.',
    'get_document'
  ),
  createTool(
    'export_document',
    'Export document in Markdown format.',
    'export_document'
  ),

  // ========== Document Management ==========
  createTool(
    'create_document',
    'Create a new document.',
    'create_document'
  ),
  createTool(
    'update_document',
    'Update an existing document. Can append content with append mode.',
    'update_document'
  ),
  createTool(
    'move_document',
    'Move document to another collection or under a parent document.',
    'move_document'
  ),

  // ========== Document Lifecycle ==========
  createTool(
    'archive_document',
    'Archive a document.',
    'archive_document'
  ),
  createTool(
    'unarchive_document',
    'Restore an archived document.',
    'unarchive_document'
  ),
  createTool(
    'delete_document',
    'Delete a document. If permanent=true, permanently delete; otherwise move to trash.',
    'delete_document'
  ),
  createTool(
    'restore_document',
    'Restore a document from trash.',
    'restore_document'
  ),
  createTool(
    'list_archived_documents',
    'Get list of archived documents.',
    'list_archived_documents'
  ),
  createTool(
    'list_trash',
    'Get list of documents in trash.',
    'list_trash'
  ),

  // ========== Comments & Collaboration ==========
  createTool(
    'add_comment',
    'Add a comment to a document. Supports replies.',
    'add_comment'
  ),
  createTool(
    'list_document_comments',
    'Get list of comments on a document.',
    'list_document_comments'
  ),
  createTool(
    'get_comment',
    'Get details of a specific comment.',
    'get_comment'
  ),
  createTool(
    'get_document_backlinks',
    'Find other documents linking to this document.',
    'get_document_backlinks'
  ),

  // ========== Collection Management ==========
  createTool(
    'create_collection',
    'Create a new collection.',
    'create_collection'
  ),
  createTool(
    'update_collection',
    'Update collection information.',
    'update_collection'
  ),
  createTool(
    'delete_collection',
    'Delete a collection. All documents in the collection will also be deleted.',
    'delete_collection'
  ),
  createTool(
    'export_collection',
    'Export a collection.',
    'export_collection'
  ),
  createTool(
    'export_all_collections',
    'Export all collections.',
    'export_all_collections'
  ),

  // ========== Batch Operations ==========
  createTool(
    'batch_create_documents',
    'Create multiple documents at once.',
    'batch_create_documents'
  ),
  createTool(
    'batch_update_documents',
    'Update multiple documents at once.',
    'batch_update_documents'
  ),
  createTool(
    'batch_move_documents',
    'Move multiple documents at once.',
    'batch_move_documents'
  ),
  createTool(
    'batch_archive_documents',
    'Archive multiple documents at once.',
    'batch_archive_documents'
  ),
  createTool(
    'batch_delete_documents',
    'Delete multiple documents at once.',
    'batch_delete_documents'
  ),

  // ========== Smart Features (AI-Powered) ==========
  createTool(
    'sync_knowledge',
    'Sync documents to vector store for AI-powered search. Run this before using ask_wiki.',
    'sync_knowledge'
  ),
  createTool(
    'ask_wiki',
    'Ask a question and get an answer based on wiki content using RAG.',
    'ask_wiki'
  ),
  createTool(
    'summarize_document',
    'Generate an AI-powered summary of a document.',
    'summarize_document'
  ),
  createTool(
    'suggest_tags',
    'Get AI-suggested tags for a document based on its content.',
    'suggest_tags'
  ),
  createTool(
    'find_related',
    'Find documents semantically related to a specific document.',
    'find_related'
  ),
  createTool(
    'generate_diagram',
    'Generate a Mermaid diagram from a text description.',
    'generate_diagram'
  ),
  createTool(
    'smart_status',
    'Check if smart features are enabled and get index statistics.',
    'smart_status'
  ),
];
