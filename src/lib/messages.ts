/**
 * Messages Constants
 *
 * All user message constants (i18n ready)
 */

export const MESSAGES = {
  // Document related
  DOCUMENT_CREATED: 'Document created successfully.',
  DOCUMENT_UPDATED: 'Document updated successfully.',
  DOCUMENT_MOVED: 'Document moved successfully.',
  DOCUMENT_ARCHIVED: 'Document archived.',
  DOCUMENT_UNARCHIVED: 'Document restored from archive.',
  DOCUMENT_DELETED: 'Document moved to trash.',
  DOCUMENT_DELETED_PERMANENT: 'Document permanently deleted.',
  DOCUMENT_RESTORED: 'Document restored from trash.',

  // Collection related
  COLLECTION_CREATED: 'Collection created.',
  COLLECTION_UPDATED: 'Collection updated.',
  COLLECTION_DELETED: 'Collection deleted. All documents in the collection have been deleted.',
  COLLECTION_EXPORT_STARTED: 'Collection export started.',
  COLLECTION_EXPORT_ALL_STARTED: 'All collections export started.',

  // Comment related
  COMMENT_ADDED: 'Comment added.',
} as const;

export type MessageKey = keyof typeof MESSAGES;
