/**
 * LLM Processor
 *
 * Handles text processing tasks using LLM (summarization, tagging, Q&A)
 */

import OpenAI from 'openai';
import { LLM, ERROR_MESSAGES } from './constants.js';
import type { ILlmProcessor, LlmConfig } from './types.js';

export class LlmProcessor implements ILlmProcessor {
  private client: OpenAI | null = null;
  private readonly model: string;
  private readonly temperature: number;

  constructor(apiKey?: string, config: LlmConfig = {}) {
    this.model = config.model ?? LLM.MODEL;
    this.temperature = config.temperature ?? LLM.TEMPERATURE;

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async complete(systemPrompt: string, userContent: string): Promise<string> {
    if (!this.client) {
      throw new Error(ERROR_MESSAGES.OPENAI_NOT_CONFIGURED);
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: this.temperature,
    });

    return response.choices[0].message.content || '';
  }

  async summarize(text: string, language: string = 'Korean'): Promise<string> {
    const prompt = `Summarize the following document in 3-5 bullet points.
Use ${language} language. Be concise and focus on key information.`;

    return this.complete(prompt, text.substring(0, LLM.MAX_SUMMARY_CHARS));
  }

  async suggestTags(text: string): Promise<string[]> {
    const prompt = `Analyze the following document and suggest 3-5 relevant tags.
Output ONLY comma-separated tags without explanation.
Example: Marketing, Q1 Report, Strategy`;

    const result = await this.complete(prompt, text.substring(0, LLM.MAX_TAG_ANALYSIS_CHARS));

    return result
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  async answerFromContext(question: string, context: string): Promise<string> {
    const prompt = `You are a helpful knowledge assistant for a company wiki (Outline).
Answer the user's question based ONLY on the provided context.
If the information is not in the context, say you don't know.
Always cite the document title(s) you referenced.
Respond in the same language as the question.`;

    const userContent = `Context:
${context}

Question: ${question}`;

    return this.complete(prompt, userContent);
  }

  async generateMermaid(description: string): Promise<string> {
    const prompt = `Convert the following process or flow description into a Mermaid.js diagram.
Output ONLY the Mermaid code block, no explanation.
Use appropriate diagram type (flowchart, sequence, etc.) based on the content.`;

    return this.complete(prompt, description);
  }
}
