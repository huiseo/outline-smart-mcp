/**
 * Tool Definitions Module
 *
 * MCP tool definitions with detailed LLM-friendly descriptions
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import * as schemas from './schemas.js';

/**
 * Tool annotation hints for MCP clients
 */
export interface ToolAnnotations {
  /** If true, the tool does not modify any state */
  readOnlyHint?: boolean;
  /** If true, the tool may perform destructive updates */
  destructiveHint?: boolean;
  /** If true, calling the tool multiple times with same args has same effect */
  idempotentHint?: boolean;
  /** If true, the tool may return results from external/unverified sources */
  openWorldHint?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: ToolAnnotations;
}

/**
 * Tool relationship information for workflow guidance
 */
export interface ToolRelationship {
  /** Tools that should be run before this tool */
  prerequisite?: string[];
  /** Tools commonly used after this tool */
  followUp?: string[];
  /** Usage tips for LLM */
  tips?: string;
}

export const TOOL_RELATIONSHIPS: Record<string, ToolRelationship> = {
  // Smart Features
  ask_wiki: {
    prerequisite: ['sync_knowledge'],
    tips: 'IMPORTANT: Run sync_knowledge first to index documents before using ask_wiki.',
  },
  find_related: {
    prerequisite: ['sync_knowledge'],
    tips: 'Run sync_knowledge first to enable semantic search.',
  },
  summarize_document: {
    prerequisite: ['search_documents', 'get_document_id_from_title'],
    tips: 'Find document ID first using search_documents or get_document_id_from_title.',
  },
  suggest_tags: {
    prerequisite: ['search_documents', 'get_document_id_from_title'],
    tips: 'Find document ID first using search_documents or get_document_id_from_title.',
  },

  // Document Operations
  get_document: {
    prerequisite: ['search_documents', 'get_document_id_from_title'],
    followUp: ['update_document', 'list_document_comments', 'get_document_backlinks'],
    tips: 'Find document ID first using search_documents or get_document_id_from_title.',
  },
  export_document: {
    prerequisite: ['search_documents', 'get_document_id_from_title'],
    tips: 'Find document ID first using search_documents or get_document_id_from_title.',
  },
  create_document: {
    prerequisite: ['list_collections'],
    followUp: ['get_document', 'update_document'],
    tips: 'Get available collection IDs using list_collections first.',
  },
  update_document: {
    prerequisite: ['get_document'],
    tips: 'Read the document first with get_document to understand its current content.',
  },
  move_document: {
    prerequisite: ['list_collections', 'get_collection_structure'],
    followUp: ['get_document'],
    tips: 'Use list_collections to get target collection ID.',
  },
  archive_document: {
    prerequisite: ['search_documents', 'get_document_id_from_title'],
    followUp: ['list_archived_documents'],
    tips: 'Archives are reversible. Use unarchive_document to restore.',
  },
  unarchive_document: {
    prerequisite: ['list_archived_documents'],
    tips: 'Use list_archived_documents to find archived document IDs.',
  },
  delete_document: {
    prerequisite: ['search_documents'],
    followUp: ['list_trash'],
    tips: 'WARNING: permanent=true cannot be undone. Default moves to trash.',
  },
  restore_document: {
    prerequisite: ['list_trash'],
    tips: 'Use list_trash to find deleted document IDs.',
  },
  get_document_backlinks: {
    prerequisite: ['search_documents', 'get_document_id_from_title'],
    tips: 'Find document ID first to see what links to it.',
  },

  // Collection Operations
  create_collection: {
    followUp: ['create_document', 'list_collections'],
    tips: 'After creating, use the new collection ID to add documents.',
  },
  update_collection: {
    prerequisite: ['list_collections'],
    tips: 'Use list_collections to get collection IDs.',
  },
  delete_collection: {
    prerequisite: ['list_collections'],
    tips: 'WARNING: Deletes all documents in the collection. Consider archiving instead.',
  },
  export_collection: {
    prerequisite: ['list_collections'],
    tips: 'Use list_collections to get collection IDs.',
  },

  // Comment Operations
  add_comment: {
    prerequisite: ['search_documents', 'get_document_id_from_title'],
    followUp: ['list_document_comments'],
    tips: 'Find document ID first. Use parentCommentId for threaded replies.',
  },
  list_document_comments: {
    prerequisite: ['search_documents', 'get_document_id_from_title'],
    tips: 'Find document ID first.',
  },
  get_comment: {
    prerequisite: ['list_document_comments'],
    tips: 'Use list_document_comments to find comment IDs.',
  },

  // Batch Operations
  batch_create_documents: {
    prerequisite: ['list_collections'],
    tips: 'Get collection IDs using list_collections before batch creation.',
  },
  batch_update_documents: {
    prerequisite: ['search_documents'],
    tips: 'Search for documents first to get their IDs.',
  },
  batch_move_documents: {
    prerequisite: ['list_collections', 'search_documents'],
    tips: 'Get target collection ID and document IDs first.',
  },
  batch_archive_documents: {
    prerequisite: ['search_documents'],
    tips: 'Search for documents first to get their IDs.',
  },
  batch_delete_documents: {
    prerequisite: ['search_documents'],
    tips: 'WARNING: permanent=true cannot be undone for any documents.',
  },
};

/**
 * Cache for converted JSON schemas to avoid repeated conversions
 */
const schemaCache = new Map<schemas.ToolName, Record<string, unknown>>();

/**
 * Get cached JSON schema or convert and cache it
 */
function getCachedJsonSchema(schemaName: schemas.ToolName): Record<string, unknown> {
  let cached = schemaCache.get(schemaName);
  if (!cached) {
    const zodSchema = schemas.toolSchemas[schemaName];
    cached = zodToJsonSchema(zodSchema, { target: 'openApi3' }) as Record<string, unknown>;
    schemaCache.set(schemaName, cached);
  }
  return cached;
}

/**
 * Convert Zod schema to MCP tool definition with annotations
 */
function createTool(
  name: string,
  description: string,
  schema: schemas.ToolName,
  annotations?: ToolAnnotations
): ToolDefinition {
  return {
    name,
    description,
    inputSchema: getCachedJsonSchema(schema),
    annotations,
  };
}

// ============================================================
// Tool Descriptions - Detailed LLM-friendly format
// ============================================================

const DESCRIPTIONS = {
  // ========== Search & Discovery ==========
  search_documents: `Search documents by keyword across your Outline knowledge base.

IMPORTANT: Performs full-text search across document titles and content.
Results are ranked by relevance. Returns excerpts showing where matches appear.

PAGINATION: Returns up to 10 results by default.
Use offset for additional pages (e.g., offset=10 for results 11-20).

Use this tool when you need to:
- Find documents containing specific terms or topics
- Locate information across multiple documents
- Search within a specific collection
- Browse large result sets with pagination

EXAMPLES:
- Search all: { "query": "vacation policy" }
- With collection: { "query": "onboarding", "collectionId": "uuid-here" }
- Paginated: { "query": "project", "limit": 5, "offset": 10 }`,

  get_document_id_from_title: `Find document ID by searching for a document title.

IMPORTANT: Use this when you know the document title but need its ID.
Returns multiple matches if the title is ambiguous.

Use this tool when you need to:
- Get document ID before calling get_document
- Find a specific document by its title
- Resolve document references

EXAMPLES:
- Exact title: { "query": "Company Handbook" }
- Partial match: { "query": "Handbook", "collectionId": "uuid-here" }`,

  list_collections: `Get a list of all collections in the Outline workspace.

IMPORTANT: Collections are top-level containers for organizing documents.
Use this to discover available collections before creating or searching documents.

Use this tool when you need to:
- See all available collections
- Get collection IDs for filtering searches
- Find where to create new documents
- Understand workspace organization

RETURNS: List of collections with id, name, description, and color.`,

  get_collection_structure: `Get the hierarchical document structure within a collection.

IMPORTANT: Returns the full tree structure showing parent-child relationships.
Useful for understanding how documents are organized.

Use this tool when you need to:
- View document hierarchy in a collection
- Find parent-child document relationships
- Navigate nested document structures
- Plan where to place new documents

EXAMPLE: { "collectionId": "collection-uuid-here" }`,

  list_recent_documents: `Get a list of recently modified documents.

IMPORTANT: Documents are sorted by last update time (most recent first).
Useful for finding recently edited content.

Use this tool when you need to:
- See what documents were recently updated
- Monitor document activity
- Find your recent work
- Track changes in the workspace

EXAMPLE: { "limit": 20 } for last 20 documents.`,

  // ========== Document Reading ==========
  get_document: `Get the full content of a document by its ID.

IMPORTANT: Returns complete document including title, text, metadata, and URL.
You need the document ID first - use search_documents or get_document_id_from_title.

Use this tool when you need to:
- Read the full content of a document
- Get document metadata (author, dates, etc.)
- Access document for editing or analysis
- View document details

EXAMPLE: { "documentId": "document-uuid-here" }`,

  export_document: `Export a document in Markdown format.

IMPORTANT: Returns raw Markdown text, suitable for download or processing.
Preserves formatting, links, and structure.

Use this tool when you need to:
- Get clean Markdown content
- Export for external use
- Process document text programmatically
- Backup document content

EXAMPLE: { "documentId": "document-uuid-here" }`,

  // ========== Document Management ==========
  create_document: `Create a new document in a collection.

IMPORTANT: Requires a valid collectionId. Use list_collections first if needed.
Documents can optionally be nested under a parent document.

Use this tool when you need to:
- Create new documentation
- Add a new page to a collection
- Create child documents under existing ones
- Start drafts (publish: false)

EXAMPLES:
- Basic: { "title": "New Doc", "collectionId": "uuid", "text": "Content here" }
- As child: { "title": "Sub Doc", "collectionId": "uuid", "parentDocumentId": "parent-uuid" }
- Draft: { "title": "Draft", "collectionId": "uuid", "publish": false }`,

  update_document: `Update an existing document's title or content.

IMPORTANT: Can either replace content or append to existing content.
Use append: true to add content without overwriting.

Use this tool when you need to:
- Edit document content
- Change document title
- Add content to existing document
- Update documentation

EXAMPLES:
- Update content: { "documentId": "uuid", "text": "New content" }
- Append: { "documentId": "uuid", "text": "Additional content", "append": true }
- Change title: { "documentId": "uuid", "title": "New Title" }`,

  move_document: `Move a document to a different collection or under a different parent.

IMPORTANT: Can change both collection and parent document in one operation.
Use list_collections and get_collection_structure to find valid targets.

Use this tool when you need to:
- Reorganize documents
- Move documents between collections
- Change document hierarchy
- Restructure documentation

EXAMPLES:
- Move to collection: { "documentId": "uuid", "collectionId": "new-collection-uuid" }
- Move under parent: { "documentId": "uuid", "parentDocumentId": "parent-uuid" }`,

  // ========== Document Lifecycle ==========
  archive_document: `Archive a document (soft delete, can be restored).

IMPORTANT: Archived documents are hidden but not deleted.
Use unarchive_document to restore. Use list_archived_documents to see archived items.

Use this tool when you need to:
- Hide outdated documents
- Temporarily remove content
- Clean up without permanent deletion

EXAMPLE: { "documentId": "document-uuid-here" }`,

  unarchive_document: `Restore an archived document back to active state.

IMPORTANT: Only works on archived documents.
Use list_archived_documents to find archived document IDs.

EXAMPLE: { "documentId": "archived-document-uuid" }`,

  delete_document: `Delete a document (moves to trash or permanently deletes).

WARNING: If permanent=true, the document cannot be recovered!
Default behavior moves to trash (can be restored with restore_document).

Use this tool when you need to:
- Remove documents permanently (permanent: true)
- Move documents to trash (permanent: false or omit)
- Clean up unwanted content

EXAMPLES:
- Move to trash: { "documentId": "uuid" }
- Permanent delete: { "documentId": "uuid", "permanent": true }`,

  restore_document: `Restore a document from trash.

IMPORTANT: Only works on documents in trash (not archived documents).
Use list_trash to find documents in trash.

EXAMPLE: { "documentId": "trashed-document-uuid" }`,

  list_archived_documents: `Get a list of all archived documents.

Use this tool when you need to:
- Find archived documents to restore
- Review what has been archived
- Audit archived content

EXAMPLE: { "limit": 50 }`,

  list_trash: `Get a list of documents in trash.

IMPORTANT: Trash documents can be restored or will be permanently deleted after retention period.

Use this tool when you need to:
- Find documents to restore from trash
- Review deleted content
- Audit trash before permanent deletion

EXAMPLE: { "limit": 50 }`,

  // ========== Comments & Collaboration ==========
  add_comment: `Add a comment to a document.

IMPORTANT: Can create threaded replies by specifying parentCommentId.
Comments support Markdown formatting.

Use this tool when you need to:
- Add feedback to a document
- Reply to existing comments
- Start discussions on content
- Leave notes for collaborators

EXAMPLES:
- New comment: { "documentId": "uuid", "text": "Great document!" }
- Reply: { "documentId": "uuid", "text": "I agree", "parentCommentId": "comment-uuid" }`,

  list_document_comments: `Get all comments on a document.

IMPORTANT: Returns threaded comments with author information.
Supports pagination for documents with many comments.

EXAMPLE: { "documentId": "uuid", "limit": 50 }`,

  get_comment: `Get details of a specific comment.

EXAMPLE: { "commentId": "comment-uuid-here" }`,

  get_document_backlinks: `Find all documents that link to a specific document.

IMPORTANT: Useful for understanding document relationships and impact of changes.

Use this tool when you need to:
- Find documents referencing this document
- Assess impact before editing/deleting
- Understand document connections
- Build knowledge graphs

EXAMPLE: { "documentId": "document-uuid-here" }`,

  // ========== Collection Management ==========
  create_collection: `Create a new collection for organizing documents.

IMPORTANT: Collections are top-level containers. Choose a clear, descriptive name.
Color is optional (hex format like #FF5733).

Use this tool when you need to:
- Create new project spaces
- Organize documents by topic
- Set up team workspaces
- Structure knowledge base

EXAMPLES:
- Basic: { "name": "Engineering Docs" }
- With details: { "name": "HR Policies", "description": "Human Resources documentation", "color": "#4A90D9" }`,

  update_collection: `Update collection properties (name, description, color).

EXAMPLE: { "collectionId": "uuid", "name": "New Name", "description": "Updated description" }`,

  delete_collection: `Delete a collection and ALL documents within it.

WARNING: This is destructive! All documents in the collection will be deleted.
Consider archiving or moving documents first.

EXAMPLE: { "collectionId": "collection-uuid-here" }`,

  export_collection: `Export all documents in a collection.

IMPORTANT: Starts an async export operation. Returns file operation info.
Formats: "outline-markdown" (default), "json", "html"

Use this tool when you need to:
- Backup collection content
- Export for external sharing
- Migrate content to other systems
- Create offline copies

EXAMPLE: { "collectionId": "uuid", "format": "outline-markdown" }`,

  export_all_collections: `Export the entire workspace (all collections and documents).

IMPORTANT: Starts an async export operation for all content.
May take time for large workspaces.

EXAMPLE: { "format": "outline-markdown" }`,

  // ========== Batch Operations ==========
  batch_create_documents: `Create multiple documents in a single operation.

IMPORTANT: More efficient than creating documents one by one.
All documents should have valid collectionId. Partial failures are possible.

Use this tool when you need to:
- Bulk import documents
- Create multiple related documents
- Set up document structures quickly

EXAMPLE: { "documents": [
  { "title": "Doc 1", "collectionId": "uuid", "text": "Content 1" },
  { "title": "Doc 2", "collectionId": "uuid", "text": "Content 2" }
]}`,

  batch_update_documents: `Update multiple documents in a single operation.

IMPORTANT: Supports append mode for each document individually.
Partial failures are possible - check results.

EXAMPLE: { "updates": [
  { "documentId": "uuid1", "text": "New content" },
  { "documentId": "uuid2", "title": "New Title" }
]}`,

  batch_move_documents: `Move multiple documents to a new location.

IMPORTANT: All documents move to the same target collection/parent.
Use for bulk reorganization.

EXAMPLE: { "documentIds": ["uuid1", "uuid2"], "collectionId": "target-collection-uuid" }`,

  batch_archive_documents: `Archive multiple documents at once.

IMPORTANT: All specified documents will be archived.
Use list_archived_documents to review later.

EXAMPLE: { "documentIds": ["uuid1", "uuid2", "uuid3"] }`,

  batch_delete_documents: `Delete multiple documents at once.

WARNING: If permanent=true, documents cannot be recovered!
Use with caution.

EXAMPLE: { "documentIds": ["uuid1", "uuid2"], "permanent": false }`,

  // ========== Smart Features (AI-Powered) ==========
  sync_knowledge: `Sync documents to vector store for AI-powered search and Q&A.

CRITICAL: You MUST run this tool BEFORE using ask_wiki or find_related.
Indexes document content for semantic search using embeddings.

Use this tool when you need to:
- Enable AI-powered search
- Prepare for ask_wiki queries
- Update the search index after document changes
- Index a specific collection

EXAMPLES:
- Sync all: {}
- Sync collection: { "collectionId": "collection-uuid" }

NOTE: Requires ENABLE_SMART_FEATURES=true and OPENAI_API_KEY to be set.`,

  ask_wiki: `Ask a question and get an AI-generated answer based on wiki content.

CRITICAL: Run sync_knowledge first to index documents!
Uses RAG (Retrieval Augmented Generation) to find relevant content and answer.

Use this tool when you need to:
- Get answers from your knowledge base
- Query documentation naturally
- Find information without knowing exact keywords
- Summarize knowledge on a topic

EXAMPLES:
- Simple question: { "question": "What is our vacation policy?" }
- Specific topic: { "question": "How do I set up the development environment?" }

NOTE: Requires sync_knowledge to be run first. Requires ENABLE_SMART_FEATURES=true.`,

  summarize_document: `Generate an AI-powered summary of a document.

IMPORTANT: Creates a concise summary of the document content.
Optionally specify language for the summary.

Use this tool when you need to:
- Get quick overview of long documents
- Create executive summaries
- Understand document content quickly

EXAMPLES:
- Default: { "documentId": "uuid" }
- In Korean: { "documentId": "uuid", "language": "Korean" }

NOTE: Requires ENABLE_SMART_FEATURES=true.`,

  suggest_tags: `Get AI-suggested tags for a document based on its content.

IMPORTANT: Analyzes document content and suggests relevant tags/keywords.

Use this tool when you need to:
- Categorize documents
- Improve discoverability
- Organize content by topics

EXAMPLE: { "documentId": "document-uuid-here" }

NOTE: Requires ENABLE_SMART_FEATURES=true.`,

  find_related: `Find documents semantically related to a specific document.

CRITICAL: Run sync_knowledge first to enable semantic search!
Uses vector similarity to find conceptually related documents.

Use this tool when you need to:
- Discover related content
- Find similar documents
- Explore knowledge connections
- Suggest related reading

EXAMPLES:
- Default (5 results): { "documentId": "uuid" }
- More results: { "documentId": "uuid", "limit": 10 }

NOTE: Requires sync_knowledge to be run first. Requires ENABLE_SMART_FEATURES=true.`,

  generate_diagram: `Generate a Mermaid diagram from a text description.

IMPORTANT: Creates Mermaid diagram code that can be embedded in Outline documents.
Outline natively renders Mermaid diagrams.

Use this tool when you need to:
- Create flowcharts
- Generate architecture diagrams
- Visualize processes
- Create sequence diagrams

EXAMPLES:
- Flowchart: { "description": "User login flow with authentication and redirect" }
- Architecture: { "description": "Microservices architecture with API gateway" }

NOTE: Requires ENABLE_SMART_FEATURES=true.`,

  smart_status: `Check if smart features are enabled and get index statistics.

Use this tool to:
- Verify smart features are working
- Check how many documents are indexed
- Troubleshoot AI feature issues

RETURNS: enabled status, indexed chunk count, and status message.`,

  // ========== Health Check ==========
  health_check: `Check server health and connectivity status.

IMPORTANT: Use this tool to diagnose connection or configuration issues.
Returns comprehensive status including Outline API connectivity and latency.

Use this tool when you need to:
- Verify the server is running correctly
- Check Outline API connectivity
- View current configuration (read-only mode, etc.)
- Diagnose issues with the MCP server
- Check how many tools are available

RETURNS:
- status: "ok", "degraded", or "error"
- version: Server version
- outline.connected: Whether Outline API is reachable
- outline.latencyMs: API response time
- config: Current configuration settings
- tools.available: Number of tools accessible
- smartFeatures: AI feature status (if enabled)`,
};

// ============================================================
// Tool Annotations
// ============================================================

const ANNOTATIONS = {
  // Read-only tools
  search_documents: { readOnlyHint: true, idempotentHint: true },
  get_document_id_from_title: { readOnlyHint: true, idempotentHint: true },
  list_collections: { readOnlyHint: true, idempotentHint: true },
  get_collection_structure: { readOnlyHint: true, idempotentHint: true },
  list_recent_documents: { readOnlyHint: true, idempotentHint: true },
  get_document: { readOnlyHint: true, idempotentHint: true },
  export_document: { readOnlyHint: true, idempotentHint: true },
  list_archived_documents: { readOnlyHint: true, idempotentHint: true },
  list_trash: { readOnlyHint: true, idempotentHint: true },
  list_document_comments: { readOnlyHint: true, idempotentHint: true },
  get_comment: { readOnlyHint: true, idempotentHint: true },
  get_document_backlinks: { readOnlyHint: true, idempotentHint: true },
  export_collection: { readOnlyHint: true, idempotentHint: true },
  export_all_collections: { readOnlyHint: true, idempotentHint: true },
  smart_status: { readOnlyHint: true, idempotentHint: true },
  health_check: { readOnlyHint: true, idempotentHint: true },

  // Write tools (non-destructive)
  create_document: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  add_comment: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  create_collection: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  unarchive_document: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  restore_document: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  batch_create_documents: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  sync_knowledge: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },

  // Write tools (destructive - modifies existing data)
  update_document: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  move_document: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  archive_document: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  update_collection: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  batch_update_documents: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  batch_move_documents: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  batch_archive_documents: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },

  // Delete tools (highly destructive)
  delete_document: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  delete_collection: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  batch_delete_documents: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },

  // AI tools (may access external services)
  ask_wiki: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  summarize_document: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  suggest_tags: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  find_related: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  generate_diagram: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
};

export const allTools: ToolDefinition[] = [
  // ========== Search & Discovery ==========
  createTool('search_documents', DESCRIPTIONS.search_documents, 'search_documents', ANNOTATIONS.search_documents),
  createTool('get_document_id_from_title', DESCRIPTIONS.get_document_id_from_title, 'get_document_id_from_title', ANNOTATIONS.get_document_id_from_title),
  createTool('list_collections', DESCRIPTIONS.list_collections, 'list_collections', ANNOTATIONS.list_collections),
  createTool('get_collection_structure', DESCRIPTIONS.get_collection_structure, 'get_collection_structure', ANNOTATIONS.get_collection_structure),
  createTool('list_recent_documents', DESCRIPTIONS.list_recent_documents, 'list_recent_documents', ANNOTATIONS.list_recent_documents),

  // ========== Document Reading ==========
  createTool('get_document', DESCRIPTIONS.get_document, 'get_document', ANNOTATIONS.get_document),
  createTool('export_document', DESCRIPTIONS.export_document, 'export_document', ANNOTATIONS.export_document),

  // ========== Document Management ==========
  createTool('create_document', DESCRIPTIONS.create_document, 'create_document', ANNOTATIONS.create_document),
  createTool('update_document', DESCRIPTIONS.update_document, 'update_document', ANNOTATIONS.update_document),
  createTool('move_document', DESCRIPTIONS.move_document, 'move_document', ANNOTATIONS.move_document),

  // ========== Document Lifecycle ==========
  createTool('archive_document', DESCRIPTIONS.archive_document, 'archive_document', ANNOTATIONS.archive_document),
  createTool('unarchive_document', DESCRIPTIONS.unarchive_document, 'unarchive_document', ANNOTATIONS.unarchive_document),
  createTool('delete_document', DESCRIPTIONS.delete_document, 'delete_document', ANNOTATIONS.delete_document),
  createTool('restore_document', DESCRIPTIONS.restore_document, 'restore_document', ANNOTATIONS.restore_document),
  createTool('list_archived_documents', DESCRIPTIONS.list_archived_documents, 'list_archived_documents', ANNOTATIONS.list_archived_documents),
  createTool('list_trash', DESCRIPTIONS.list_trash, 'list_trash', ANNOTATIONS.list_trash),

  // ========== Comments & Collaboration ==========
  createTool('add_comment', DESCRIPTIONS.add_comment, 'add_comment', ANNOTATIONS.add_comment),
  createTool('list_document_comments', DESCRIPTIONS.list_document_comments, 'list_document_comments', ANNOTATIONS.list_document_comments),
  createTool('get_comment', DESCRIPTIONS.get_comment, 'get_comment', ANNOTATIONS.get_comment),
  createTool('get_document_backlinks', DESCRIPTIONS.get_document_backlinks, 'get_document_backlinks', ANNOTATIONS.get_document_backlinks),

  // ========== Collection Management ==========
  createTool('create_collection', DESCRIPTIONS.create_collection, 'create_collection', ANNOTATIONS.create_collection),
  createTool('update_collection', DESCRIPTIONS.update_collection, 'update_collection', ANNOTATIONS.update_collection),
  createTool('delete_collection', DESCRIPTIONS.delete_collection, 'delete_collection', ANNOTATIONS.delete_collection),
  createTool('export_collection', DESCRIPTIONS.export_collection, 'export_collection', ANNOTATIONS.export_collection),
  createTool('export_all_collections', DESCRIPTIONS.export_all_collections, 'export_all_collections', ANNOTATIONS.export_all_collections),

  // ========== Batch Operations ==========
  createTool('batch_create_documents', DESCRIPTIONS.batch_create_documents, 'batch_create_documents', ANNOTATIONS.batch_create_documents),
  createTool('batch_update_documents', DESCRIPTIONS.batch_update_documents, 'batch_update_documents', ANNOTATIONS.batch_update_documents),
  createTool('batch_move_documents', DESCRIPTIONS.batch_move_documents, 'batch_move_documents', ANNOTATIONS.batch_move_documents),
  createTool('batch_archive_documents', DESCRIPTIONS.batch_archive_documents, 'batch_archive_documents', ANNOTATIONS.batch_archive_documents),
  createTool('batch_delete_documents', DESCRIPTIONS.batch_delete_documents, 'batch_delete_documents', ANNOTATIONS.batch_delete_documents),

  // ========== Smart Features (AI-Powered) ==========
  createTool('sync_knowledge', DESCRIPTIONS.sync_knowledge, 'sync_knowledge', ANNOTATIONS.sync_knowledge),
  createTool('ask_wiki', DESCRIPTIONS.ask_wiki, 'ask_wiki', ANNOTATIONS.ask_wiki),
  createTool('summarize_document', DESCRIPTIONS.summarize_document, 'summarize_document', ANNOTATIONS.summarize_document),
  createTool('suggest_tags', DESCRIPTIONS.suggest_tags, 'suggest_tags', ANNOTATIONS.suggest_tags),
  createTool('find_related', DESCRIPTIONS.find_related, 'find_related', ANNOTATIONS.find_related),
  createTool('generate_diagram', DESCRIPTIONS.generate_diagram, 'generate_diagram', ANNOTATIONS.generate_diagram),
  createTool('smart_status', DESCRIPTIONS.smart_status, 'smart_status', ANNOTATIONS.smart_status),

  // ========== Health Check ==========
  createTool('health_check', DESCRIPTIONS.health_check, 'health_check', ANNOTATIONS.health_check),
];
