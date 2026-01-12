/**
 * Zod Schemas Module
 *
 * Tool input schema definitions using Zod with detailed descriptions
 */

import { z } from 'zod';

// ========== Common Schema Fragments with Descriptions ==========

const documentId = z
  .string()
  .uuid('Invalid document ID format. Must be a valid UUID.')
  .describe('UUID of the document. Use search_documents or get_document_id_from_title to find it.');

const collectionId = z
  .string()
  .uuid('Invalid collection ID')
  .describe('UUID of the collection. Use list_collections to get available collection IDs.');

const limit = z
  .number()
  .int()
  .min(1)
  .max(100)
  .describe('Maximum number of results to return (1-100).');

const offset = z
  .number()
  .int()
  .min(0)
  .default(0)
  .describe('Number of results to skip for pagination (default: 0). Use offset=10 for results 11-20.');

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
  .describe('Hex color code (e.g., "#FF5733", "#4A90D9").');

const exportFormat = z
  .enum(['outline-markdown', 'json', 'html'])
  .default('outline-markdown')
  .describe('Export format: "outline-markdown" (default), "json", or "html".');

const documentIds = z
  .array(documentId)
  .min(1, 'At least one document ID is required')
  .describe('Array of document UUIDs to process.');

// ========== Search & Discovery ==========

export const searchDocumentsSchema = z.object({
  query: z
    .string()
    .min(1, 'Query is required')
    .max(500, 'Query too long. Maximum 500 characters.')
    .describe('Search keywords or phrase (e.g., "vacation policy", "project plan").'),
  collectionId: collectionId
    .optional()
    .describe('Optional: Limit search to a specific collection.'),
  limit: limit
    .default(10)
    .describe('Results per page (default: 10, max: 100).'),
  offset: offset
    .describe('Skip N results for pagination (default: 0).'),
});

export const getDocumentIdFromTitleSchema = z.object({
  query: z
    .string()
    .min(1, 'Query is required')
    .describe('Document title or partial title to search for.'),
  collectionId: collectionId
    .optional()
    .describe('Optional: Limit search to a specific collection.'),
});

export const listCollectionsSchema = z.object({});

export const getCollectionStructureSchema = z.object({
  collectionId: collectionId
    .describe('UUID of the collection to get structure for.'),
});

export const listRecentDocumentsSchema = z.object({
  limit: limit
    .default(10)
    .describe('Number of recent documents to return (default: 10).'),
});

// ========== Document CRUD ==========

export const getDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to retrieve.'),
});

export const exportDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to export as Markdown.'),
});

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .describe('Title of the new document.'),
  text: z
    .string()
    .default('')
    .describe('Document content in Markdown format (optional).'),
  collectionId: collectionId
    .describe('UUID of the collection to create the document in. Use list_collections to find.'),
  parentDocumentId: z
    .string()
    .uuid()
    .optional()
    .describe('Optional: UUID of parent document to nest under.'),
  publish: z
    .boolean()
    .default(true)
    .describe('If true (default), publish immediately. If false, save as draft.'),
});

export const updateDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to update.'),
  title: z
    .string()
    .min(1)
    .optional()
    .describe('Optional: New title for the document.'),
  text: z
    .string()
    .optional()
    .describe('Optional: New content (replaces existing unless append=true).'),
  append: z
    .boolean()
    .default(false)
    .describe('If true, append text to existing content instead of replacing.'),
});

export const moveDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to move.'),
  collectionId: collectionId
    .optional()
    .describe('Optional: Target collection UUID to move the document to.'),
  parentDocumentId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe('Optional: Parent document UUID to nest under (null to make top-level).'),
});

// ========== Document Lifecycle ==========

export const archiveDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to archive.'),
});

export const unarchiveDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the archived document to restore.'),
});

export const restoreDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the trashed document to restore.'),
});

export const getDocumentBacklinksSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to find backlinks for.'),
});

export const deleteDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to delete.'),
  permanent: z
    .boolean()
    .default(false)
    .describe('If true, permanently delete (CANNOT BE UNDONE). If false (default), move to trash.'),
});

export const listArchivedDocumentsSchema = z.object({
  limit: limit
    .default(25)
    .describe('Number of archived documents to return (default: 25).'),
});

export const listTrashSchema = z.object({
  limit: limit
    .default(25)
    .describe('Number of trashed documents to return (default: 25).'),
});

// ========== Comments ==========

export const addCommentSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to comment on.'),
  text: z
    .string()
    .min(1, 'Comment text is required')
    .describe('Comment content (supports Markdown).'),
  parentCommentId: z
    .string()
    .uuid()
    .optional()
    .describe('Optional: UUID of parent comment for threaded replies.'),
});

export const listDocumentCommentsSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to list comments for.'),
  limit: limit
    .default(25)
    .describe('Maximum number of comments to return (default: 25).'),
  offset: offset
    .describe('Number of comments to skip for pagination.'),
});

export const getCommentSchema = z.object({
  commentId: z
    .string()
    .uuid('Invalid comment ID')
    .describe('UUID of the comment to retrieve.'),
});

// ========== Collection Management ==========

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .describe('Name of the new collection (e.g., "Engineering Docs").'),
  description: z
    .string()
    .optional()
    .describe('Optional: Description of the collection purpose.'),
  color: hexColor
    .optional()
    .describe('Optional: Hex color code for the collection (e.g., "#4A90D9").'),
});

export const updateCollectionSchema = z.object({
  collectionId: collectionId
    .describe('UUID of the collection to update.'),
  name: z
    .string()
    .min(1)
    .optional()
    .describe('Optional: New name for the collection.'),
  description: z
    .string()
    .optional()
    .describe('Optional: New description for the collection.'),
  color: hexColor
    .optional()
    .describe('Optional: New hex color code (e.g., "#FF5733").'),
});

export const deleteCollectionSchema = z.object({
  collectionId: collectionId
    .describe('UUID of the collection to delete. WARNING: All documents in the collection will also be deleted!'),
});

export const exportCollectionSchema = z.object({
  collectionId: collectionId
    .describe('UUID of the collection to export.'),
  format: exportFormat
    .describe('Export format: "outline-markdown" (default) or "json".'),
});

export const exportAllCollectionsSchema = z.object({
  format: exportFormat
    .describe('Export format: "outline-markdown" (default) or "json".'),
});

// ========== Batch Operations ==========

export const batchCreateDocumentsSchema = z.object({
  documents: z
    .array(
      z.object({
        title: z
          .string()
          .min(1)
          .describe('Title of the document.'),
        text: z
          .string()
          .default('')
          .describe('Document content in Markdown.'),
        collectionId: collectionId
          .describe('Target collection UUID.'),
        parentDocumentId: z
          .string()
          .uuid()
          .optional()
          .describe('Optional: Parent document UUID.'),
        publish: z
          .boolean()
          .default(true)
          .describe('Publish immediately (default: true).'),
      })
    )
    .min(1, 'At least one document is required')
    .describe('Array of documents to create.'),
});

export const batchUpdateDocumentsSchema = z.object({
  updates: z
    .array(
      z.object({
        documentId: documentId
          .describe('UUID of document to update.'),
        title: z
          .string()
          .min(1)
          .optional()
          .describe('Optional: New title.'),
        text: z
          .string()
          .optional()
          .describe('Optional: New content.'),
        append: z
          .boolean()
          .default(false)
          .describe('If true, append text instead of replacing.'),
      })
    )
    .min(1, 'At least one update is required')
    .describe('Array of document updates to apply.'),
});

export const batchMoveDocumentsSchema = z.object({
  documentIds: documentIds
    .describe('Array of document UUIDs to move.'),
  collectionId: collectionId
    .optional()
    .describe('Optional: Target collection UUID.'),
  parentDocumentId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe('Optional: Parent document UUID (null for top-level).'),
});

export const batchArchiveDocumentsSchema = z.object({
  documentIds: documentIds
    .describe('Array of document UUIDs to archive.'),
});

export const batchDeleteDocumentsSchema = z.object({
  documentIds: documentIds
    .describe('Array of document UUIDs to delete.'),
  permanent: z
    .boolean()
    .default(false)
    .describe('If true, permanently delete (CANNOT BE UNDONE). If false (default), move to trash.'),
});

// ========== Smart Features ==========

export const syncKnowledgeSchema = z.object({
  collectionId: collectionId
    .optional()
    .describe('Optional: Sync only documents from this collection. If omitted, sync all documents.'),
});

export const askWikiSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .describe('Natural language question to ask about your wiki content (e.g., "What is our vacation policy?").'),
});

export const summarizeDocumentSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to summarize.'),
  language: z
    .string()
    .optional()
    .describe('Optional: Language for the summary (e.g., "Korean", "Japanese"). Defaults to English.'),
});

export const suggestTagsSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to analyze for tag suggestions.'),
});

export const findRelatedSchema = z.object({
  documentId: documentId
    .describe('UUID of the document to find related documents for.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe('Number of related documents to return (default: 5, max: 20).'),
});

export const generateDiagramSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .describe('Text description of the diagram to generate (e.g., "User login flow with authentication").'),
});

export const smartStatusSchema = z.object({});

// ========== Health Check ==========

export const healthCheckSchema = z.object({});

// ========== Type Extraction ==========

export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>;
export type GetDocumentIdFromTitleInput = z.infer<typeof getDocumentIdFromTitleSchema>;
export type GetCollectionStructureInput = z.infer<typeof getCollectionStructureSchema>;
export type ListRecentDocumentsInput = z.infer<typeof listRecentDocumentsSchema>;
export type GetDocumentInput = z.infer<typeof getDocumentSchema>;
export type ExportDocumentInput = z.infer<typeof exportDocumentSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type MoveDocumentInput = z.infer<typeof moveDocumentSchema>;
export type ArchiveDocumentInput = z.infer<typeof archiveDocumentSchema>;
export type UnarchiveDocumentInput = z.infer<typeof unarchiveDocumentSchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
export type RestoreDocumentInput = z.infer<typeof restoreDocumentSchema>;
export type ListArchivedDocumentsInput = z.infer<typeof listArchivedDocumentsSchema>;
export type ListTrashInput = z.infer<typeof listTrashSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type ListDocumentCommentsInput = z.infer<typeof listDocumentCommentsSchema>;
export type GetCommentInput = z.infer<typeof getCommentSchema>;
export type GetDocumentBacklinksInput = z.infer<typeof getDocumentBacklinksSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type DeleteCollectionInput = z.infer<typeof deleteCollectionSchema>;
export type ExportCollectionInput = z.infer<typeof exportCollectionSchema>;
export type ExportAllCollectionsInput = z.infer<typeof exportAllCollectionsSchema>;
export type BatchCreateDocumentsInput = z.infer<typeof batchCreateDocumentsSchema>;
export type BatchUpdateDocumentsInput = z.infer<typeof batchUpdateDocumentsSchema>;
export type BatchMoveDocumentsInput = z.infer<typeof batchMoveDocumentsSchema>;
export type BatchArchiveDocumentsInput = z.infer<typeof batchArchiveDocumentsSchema>;
export type BatchDeleteDocumentsInput = z.infer<typeof batchDeleteDocumentsSchema>;
export type SyncKnowledgeInput = z.infer<typeof syncKnowledgeSchema>;
export type AskWikiInput = z.infer<typeof askWikiSchema>;
export type SummarizeDocumentInput = z.infer<typeof summarizeDocumentSchema>;
export type SuggestTagsInput = z.infer<typeof suggestTagsSchema>;
export type FindRelatedInput = z.infer<typeof findRelatedSchema>;
export type GenerateDiagramInput = z.infer<typeof generateDiagramSchema>;

type SchemaRecord = Record<string, z.ZodType>;

/**
 * Schema map (tool name -> schema)
 */
export const toolSchemas = {
  search_documents: searchDocumentsSchema,
  get_document_id_from_title: getDocumentIdFromTitleSchema,
  list_collections: listCollectionsSchema,
  get_collection_structure: getCollectionStructureSchema,
  list_recent_documents: listRecentDocumentsSchema,
  get_document: getDocumentSchema,
  export_document: exportDocumentSchema,
  create_document: createDocumentSchema,
  update_document: updateDocumentSchema,
  move_document: moveDocumentSchema,
  archive_document: archiveDocumentSchema,
  unarchive_document: unarchiveDocumentSchema,
  delete_document: deleteDocumentSchema,
  restore_document: restoreDocumentSchema,
  list_archived_documents: listArchivedDocumentsSchema,
  list_trash: listTrashSchema,
  add_comment: addCommentSchema,
  list_document_comments: listDocumentCommentsSchema,
  get_comment: getCommentSchema,
  get_document_backlinks: getDocumentBacklinksSchema,
  create_collection: createCollectionSchema,
  update_collection: updateCollectionSchema,
  delete_collection: deleteCollectionSchema,
  export_collection: exportCollectionSchema,
  export_all_collections: exportAllCollectionsSchema,
  batch_create_documents: batchCreateDocumentsSchema,
  batch_update_documents: batchUpdateDocumentsSchema,
  batch_move_documents: batchMoveDocumentsSchema,
  batch_archive_documents: batchArchiveDocumentsSchema,
  batch_delete_documents: batchDeleteDocumentsSchema,
  // Smart Features
  sync_knowledge: syncKnowledgeSchema,
  ask_wiki: askWikiSchema,
  summarize_document: summarizeDocumentSchema,
  suggest_tags: suggestTagsSchema,
  find_related: findRelatedSchema,
  generate_diagram: generateDiagramSchema,
  smart_status: smartStatusSchema,
  // Health Check
  health_check: healthCheckSchema,
} as const satisfies SchemaRecord;

export type ToolName = keyof typeof toolSchemas;
