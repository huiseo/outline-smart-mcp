/**
 * MCP Resources Module
 *
 * Provides direct content access via URI patterns:
 * - outline://document/{id} - Full document content
 * - outline://document/{id}/backlinks - Documents linking to this document
 * - outline://collection/{id} - Collection metadata
 * - outline://collection/{id}/tree - Hierarchical document structure
 * - outline://collection/{id}/documents - Flat list of documents in collection
 */

import type { AppContext } from './context.js';
import type { OutlineDocument, OutlineCollection, OutlineDocumentTree } from './types/api.js';

/**
 * MCP Resource definition
 */
export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Resource template for pattern matching
 */
export interface ResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Get all available resource templates
 */
export function getResourceTemplates(): ResourceTemplate[] {
  return [
    {
      uriTemplate: 'outline://document/{documentId}',
      name: 'Document Content',
      description: 'Full document content in Markdown format',
      mimeType: 'text/markdown',
    },
    {
      uriTemplate: 'outline://document/{documentId}/backlinks',
      name: 'Document Backlinks',
      description: 'List of documents that link to this document',
      mimeType: 'application/json',
    },
    {
      uriTemplate: 'outline://collection/{collectionId}',
      name: 'Collection Metadata',
      description: 'Collection information including name, description, and document count',
      mimeType: 'application/json',
    },
    {
      uriTemplate: 'outline://collection/{collectionId}/tree',
      name: 'Collection Tree',
      description: 'Hierarchical document structure within the collection',
      mimeType: 'application/json',
    },
    {
      uriTemplate: 'outline://collection/{collectionId}/documents',
      name: 'Collection Documents',
      description: 'Flat list of all documents in the collection',
      mimeType: 'application/json',
    },
  ];
}

/**
 * Parse resource URI and extract parameters
 */
export function parseResourceUri(uri: string): {
  type: 'document' | 'collection';
  id: string;
  subResource?: 'backlinks' | 'tree' | 'documents';
} | null {
  // outline://document/{id}
  // outline://document/{id}/backlinks
  // outline://collection/{id}
  // outline://collection/{id}/tree
  // outline://collection/{id}/documents

  const documentMatch = uri.match(/^outline:\/\/document\/([^/]+)(\/backlinks)?$/);
  if (documentMatch) {
    return {
      type: 'document',
      id: documentMatch[1],
      subResource: documentMatch[2] ? 'backlinks' : undefined,
    };
  }

  const collectionMatch = uri.match(/^outline:\/\/collection\/([^/]+)(\/(tree|documents))?$/);
  if (collectionMatch) {
    return {
      type: 'collection',
      id: collectionMatch[1],
      subResource: collectionMatch[3] as 'tree' | 'documents' | undefined,
    };
  }

  return null;
}

/**
 * Create resource handlers
 */
export function createResourceHandlers({ apiClient, apiCall, config }: AppContext) {
  const baseUrl = config.OUTLINE_URL;

  return {
    /**
     * Read a resource by URI
     */
    async readResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
      const parsed = parseResourceUri(uri);
      if (!parsed) {
        throw new Error(`Invalid resource URI: ${uri}`);
      }

      if (parsed.type === 'document') {
        if (parsed.subResource === 'backlinks') {
          // Get document backlinks
          const { data } = await apiCall(() =>
            apiClient.post<{ documents: OutlineDocument[] }>('/documents.list', {
              backlinkDocumentId: parsed.id,
              limit: 100,
            })
          );

          const backlinks = (data.documents || []).map((doc) => ({
            id: doc.id,
            title: doc.title,
            url: `${baseUrl}${doc.url}`,
            updatedAt: doc.updatedAt,
          }));

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({ backlinks, count: backlinks.length }, null, 2),
              },
            ],
          };
        }

        // Get document content
        const { data } = await apiCall(() =>
          apiClient.post<OutlineDocument>('/documents.info', { id: parsed.id })
        );

        const markdown = [
          `# ${data.title}`,
          '',
          `> URL: ${baseUrl}${data.url}`,
          `> Updated: ${data.updatedAt}`,
          '',
          data.text || '',
        ].join('\n');

        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: markdown,
            },
          ],
        };
      }

      if (parsed.type === 'collection') {
        if (parsed.subResource === 'tree') {
          // Get collection document tree
          const { data } = await apiCall(() =>
            apiClient.post<OutlineDocumentTree[]>('/collections.documents', {
              id: parsed.id,
            })
          );

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(formatDocumentTree(data || [], baseUrl), null, 2),
              },
            ],
          };
        }

        if (parsed.subResource === 'documents') {
          // Get flat list of documents in collection
          const { data } = await apiCall(() =>
            apiClient.post<{ documents: OutlineDocument[] }>('/documents.list', {
              collectionId: parsed.id,
              limit: 100,
            })
          );

          const documents = (data.documents || []).map((doc) => ({
            id: doc.id,
            title: doc.title,
            url: `${baseUrl}${doc.url}`,
            updatedAt: doc.updatedAt,
            parentDocumentId: doc.parentDocumentId,
          }));

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({ documents, count: documents.length }, null, 2),
              },
            ],
          };
        }

        // Get collection metadata
        const { data } = await apiCall(() =>
          apiClient.post<OutlineCollection>('/collections.info', { id: parsed.id })
        );

        const metadata = {
          id: data.id,
          name: data.name,
          description: data.description,
          color: data.color,
          url: `${baseUrl}/collection/${data.urlId || data.id}`,
          documentCount: data.documentCount || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(metadata, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown resource type: ${parsed.type}`);
    },

    /**
     * List available resources
     * Note: Returns templates, not actual resources (would require API calls)
     */
    async listResources(): Promise<{ resources: ResourceDefinition[] }> {
      // For now, return empty - listing all documents/collections requires API calls
      // Clients should use resource templates instead
      return { resources: [] };
    },
  };
}

/**
 * Format document tree for readability
 */
function formatDocumentTree(
  documents: OutlineDocumentTree[],
  baseUrl: string,
  depth = 0
): Array<{ id: string; title: string; url: string; children?: unknown[] }> {
  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    url: `${baseUrl}${doc.url}`,
    ...(doc.children && doc.children.length > 0
      ? { children: formatDocumentTree(doc.children, baseUrl, depth + 1) }
      : {}),
  }));
}
