/**
 * Zod Schemas Module
 *
 * Tool input schema definitions using Zod
 */

import { z } from 'zod';

// ========== Common Schema Fragments ==========

const documentId = z.string().min(1, 'Document ID is required');
const collectionId = z.string().uuid('Invalid collection ID');
const limit = z.number().int().min(1).max(100);
const offset = z.number().int().min(0).default(0);
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color');
const exportFormat = z.enum(['outline-markdown', 'json']).default('outline-markdown');
const documentIds = z.array(documentId).min(1, 'At least one document ID is required');

// ========== Search & Discovery ==========

export const searchDocumentsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  collectionId: collectionId.optional(),
  limit: limit.default(10),
  offset,
});

export const getDocumentIdFromTitleSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  collectionId: collectionId.optional(),
});

export const listCollectionsSchema = z.object({});
export const getCollectionStructureSchema = z.object({ collectionId });
export const listRecentDocumentsSchema = z.object({ limit: limit.default(10) });

// ========== Document CRUD ==========

export const getDocumentSchema = z.object({ documentId });
export const exportDocumentSchema = z.object({ documentId });

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  text: z.string().default(''),
  collectionId,
  parentDocumentId: z.string().uuid().optional(),
  publish: z.boolean().default(true),
});

export const updateDocumentSchema = z.object({
  documentId,
  title: z.string().min(1).optional(),
  text: z.string().optional(),
  append: z.boolean().default(false),
});

export const moveDocumentSchema = z.object({
  documentId,
  collectionId: collectionId.optional(),
  parentDocumentId: z.string().uuid().nullable().optional(),
});

// ========== Document Lifecycle ==========

export const archiveDocumentSchema = z.object({ documentId });
export const unarchiveDocumentSchema = z.object({ documentId });
export const restoreDocumentSchema = z.object({ documentId });
export const getDocumentBacklinksSchema = z.object({ documentId });
export const deleteDocumentSchema = z.object({ documentId, permanent: z.boolean().default(false) });
export const listArchivedDocumentsSchema = z.object({ limit: limit.default(25) });
export const listTrashSchema = z.object({ limit: limit.default(25) });

// ========== Comments ==========

export const addCommentSchema = z.object({
  documentId,
  text: z.string().min(1, 'Comment text is required'),
  parentCommentId: z.string().uuid().optional(),
});

export const listDocumentCommentsSchema = z.object({
  documentId,
  limit: limit.default(25),
  offset,
});

export const getCommentSchema = z.object({
  commentId: z.string().uuid('Invalid comment ID'),
});

// ========== Collection Management ==========

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: hexColor.optional(),
});

export const updateCollectionSchema = z.object({
  collectionId,
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: hexColor.optional(),
});

export const deleteCollectionSchema = z.object({ collectionId });
export const exportCollectionSchema = z.object({ collectionId, format: exportFormat });
export const exportAllCollectionsSchema = z.object({ format: exportFormat });

// ========== Batch Operations ==========

export const batchCreateDocumentsSchema = z.object({
  documents: z.array(z.object({
    title: z.string().min(1),
    text: z.string().default(''),
    collectionId,
    parentDocumentId: z.string().uuid().optional(),
    publish: z.boolean().default(true),
  })).min(1, 'At least one document is required'),
});

export const batchUpdateDocumentsSchema = z.object({
  updates: z.array(z.object({
    documentId,
    title: z.string().min(1).optional(),
    text: z.string().optional(),
    append: z.boolean().default(false),
  })).min(1, 'At least one update is required'),
});

export const batchMoveDocumentsSchema = z.object({
  documentIds,
  collectionId: collectionId.optional(),
  parentDocumentId: z.string().uuid().nullable().optional(),
});

export const batchArchiveDocumentsSchema = z.object({ documentIds });
export const batchDeleteDocumentsSchema = z.object({ documentIds, permanent: z.boolean().default(false) });

// ========== Smart Features ==========

export const syncKnowledgeSchema = z.object({
  collectionId: collectionId.optional(),
});

export const askWikiSchema = z.object({
  question: z.string().min(1, 'Question is required'),
});

export const summarizeDocumentSchema = z.object({
  documentId,
  language: z.string().optional(),
});

export const suggestTagsSchema = z.object({
  documentId,
});

export const findRelatedSchema = z.object({
  documentId,
  limit: limit.default(5).optional(),
});

export const generateDiagramSchema = z.object({
  description: z.string().min(1, 'Description is required'),
});

export const smartStatusSchema = z.object({});

// Type Extraction
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
} as const satisfies SchemaRecord;

export type ToolName = keyof typeof toolSchemas;
