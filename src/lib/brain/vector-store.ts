/**
 * Vector Store
 *
 * LanceDB-based local vector database for document storage and search
 */

import * as lancedb from '@lancedb/lancedb';
import fs from 'fs';
import path from 'path';
import { VECTOR_STORE, EMBEDDING, SEARCH } from './constants.js';
import type { IVectorStore, VectorRecord, SearchResult, VectorStoreConfig } from './types.js';

export class VectorStore implements IVectorStore {
  private readonly dbPath: string;
  private readonly tableName: string;
  private readonly dimensions: number;
  private db: lancedb.Connection | null = null;

  constructor(config: VectorStoreConfig = {}, dimensions?: number) {
    this.dbPath =
      config.dataDir || path.join(process.cwd(), VECTOR_STORE.DEFAULT_DATA_DIR);
    this.tableName = config.tableName ?? VECTOR_STORE.TABLE_NAME;
    this.dimensions = dimensions ?? EMBEDDING.DIMENSIONS;
  }

  async init(): Promise<void> {
    if (this.db) return;

    // Create data directory if not exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = await lancedb.connect(this.dbPath);

    const tables = await this.db.tableNames();
    if (!tables.includes(this.tableName)) {
      // Create initial table with schema
      await this.db.createTable(this.tableName, [this.createInitRecord()]);
    }
  }

  private createInitRecord(): VectorRecord {
    return {
      id: VECTOR_STORE.INIT_RECORD_ID,
      vector: Array(this.dimensions).fill(0),
      text: '',
      title: '',
      url: '',
    };
  }

  async save(records: VectorRecord[]): Promise<number> {
    if (!this.db) await this.init();

    if (records.length === 0) return 0;

    const table = await this.db!.openTable(this.tableName);

    // Overwrite mode for simple sync
    await table.add(records, { mode: 'overwrite' });

    return records.length;
  }

  /**
   * Upsert records - add new or update existing (for incremental sync)
   */
  async upsert(records: VectorRecord[]): Promise<number> {
    if (!this.db) await this.init();

    if (records.length === 0) return 0;

    const table = await this.db!.openTable(this.tableName);

    // Add records (append mode)
    await table.add(records);

    return records.length;
  }

  /**
   * Get all document IDs with their updatedAt timestamps
   */
  async getDocumentIds(): Promise<Map<string, string>> {
    if (!this.db) await this.init();

    const table = await this.db!.openTable(this.tableName);
    const results = await table.query().select(['documentId', 'updatedAt']).toArray();

    const docMap = new Map<string, string>();
    for (const r of results) {
      const docId = r.documentId as string | undefined;
      const updatedAt = r.updatedAt as string | undefined;
      if (docId && docId !== VECTOR_STORE.INIT_RECORD_ID) {
        // Keep the latest updatedAt for each document
        const existing = docMap.get(docId);
        if (!existing || (updatedAt && updatedAt > existing)) {
          docMap.set(docId, updatedAt || '');
        }
      }
    }

    return docMap;
  }

  /**
   * Delete all chunks for a specific document
   */
  async deleteByDocumentId(documentId: string): Promise<void> {
    if (!this.db) await this.init();

    const table = await this.db!.openTable(this.tableName);
    await table.delete(`documentId = '${documentId}'`);
  }

  async search(queryVector: number[], limit: number = SEARCH.DEFAULT_LIMIT): Promise<SearchResult[]> {
    if (!this.db) await this.init();

    const table = await this.db!.openTable(this.tableName);

    const results = await table.vectorSearch(queryVector).limit(limit).toArray();

    return results
      .filter((r: Record<string, unknown>) => r.id !== VECTOR_STORE.INIT_RECORD_ID)
      .map((r: Record<string, unknown>) => ({
        id: r.id as string,
        text: r.text as string,
        title: r.title as string,
        url: r.url as string,
        score: r._distance as number | undefined,
      }));
  }

  async count(): Promise<number> {
    if (!this.db) await this.init();

    const table = await this.db!.openTable(this.tableName);
    return await table.countRows();
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    const table = await this.db!.openTable(this.tableName);
    await table.add([this.createInitRecord()], { mode: 'overwrite' });
  }
}
