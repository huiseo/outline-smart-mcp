/**
 * Embedding Service
 *
 * Converts text to vector embeddings using OpenAI API
 */

import OpenAI from 'openai';
import { EMBEDDING, ERROR_MESSAGES } from './constants.js';
import type { IEmbeddingService, EmbeddingConfig } from './types.js';

export class EmbeddingService implements IEmbeddingService {
  private client: OpenAI | null = null;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(apiKey?: string, config: EmbeddingConfig = {}) {
    this.model = config.model ?? EMBEDDING.MODEL;
    this.dimensions = config.dimensions ?? EMBEDDING.DIMENSIONS;

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error(ERROR_MESSAGES.OPENAI_NOT_CONFIGURED);
    }

    // Clean text for better embedding quality
    const cleanText = text.replace(/\n+/g, ' ').trim();

    if (!cleanText) {
      return Array(this.dimensions).fill(0);
    }

    const response = await this.client.embeddings.create({
      model: this.model,
      input: cleanText,
    });

    return response.data[0].embedding;
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new Error(ERROR_MESSAGES.OPENAI_NOT_CONFIGURED);
    }

    const cleanTexts = texts.map((t) => t.replace(/\n+/g, ' ').trim());

    const response = await this.client.embeddings.create({
      model: this.model,
      input: cleanTexts,
    });

    return response.data.map((d) => d.embedding);
  }
}
