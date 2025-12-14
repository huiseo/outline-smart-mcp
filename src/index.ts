#!/usr/bin/env node

/**
 * Outline Wiki MCP Server v3.0
 *
 * Full-featured MCP server for Outline Wiki integration.
 * Built with TypeScript, Zod validation, and Native Fetch.
 *
 * Features:
 * - Document CRUD with move, archive, restore
 * - Collection management with hierarchy
 * - Comments and backlinks
 * - Batch operations
 * - Rate limiting with retry
 * - Access control modes
 * - Zod schema validation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z, ZodError } from 'zod';

import { createConfig, formatConfigError, type Config } from './lib/config.js';
import { createAppContext } from './lib/context.js';
import { allTools } from './lib/tools.js';
import { toolSchemas, type ToolName } from './lib/schemas.js';
import { filterToolsByAccess } from './lib/access-control.js';
import { createAllHandlers } from './lib/handlers/index.js';

// ============================================
// Smithery Configuration Schema
// ============================================

export const configSchema = z.object({
  outlineUrl: z
    .string()
    .url()
    .default('https://app.getoutline.com')
    .describe('Your Outline Wiki instance URL'),
  outlineApiToken: z
    .string()
    .min(1)
    .describe('Outline API token (starts with ol_api_)'),
  readOnly: z
    .boolean()
    .default(false)
    .describe('Enable read-only mode (disable all write operations)'),
  disableDelete: z
    .boolean()
    .default(false)
    .describe('Disable delete operations while allowing other modifications'),
  enableSmartFeatures: z
    .boolean()
    .default(false)
    .describe('Enable AI-powered features (requires OpenAI API key)'),
  openaiApiKey: z
    .string()
    .optional()
    .describe('OpenAI API key for smart features'),
});

export type SmitheryConfig = z.infer<typeof configSchema>;

// ============================================
// Create Server Function (Smithery Compatible)
// ============================================

export default function createServer({ config: smitheryConfig }: { config: SmitheryConfig }) {
  // Convert Smithery config to environment-style config
  const envConfig: Record<string, string | undefined> = {
    OUTLINE_URL: smitheryConfig.outlineUrl,
    OUTLINE_API_TOKEN: smitheryConfig.outlineApiToken,
    READ_ONLY: String(smitheryConfig.readOnly),
    DISABLE_DELETE: String(smitheryConfig.disableDelete),
    ENABLE_SMART_FEATURES: String(smitheryConfig.enableSmartFeatures),
    OPENAI_API_KEY: smitheryConfig.openaiApiKey,
  };

  const config = createConfig(envConfig);
  const ctx = createAppContext(config);
  const handlers = createAllHandlers(ctx);

  const server = new Server(
    { name: 'outline-wiki-server', version: '3.0.0' },
    { capabilities: { tools: {} } }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: filterToolsByAccess(allTools, config),
  }));

  // Execute tool with Zod validation
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Get handler
      const handler = handlers[name];
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Validate input with Zod schema
      const schema = toolSchemas[name as ToolName];
      if (!schema) {
        throw new Error(`No schema found for tool: ${name}`);
      }

      const validatedArgs = schema.parse(args);

      // Execute handler
      const result = await handler(validatedArgs);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof ZodError) {
        const issues = error.issues.map(
          (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
        );
        errorMessage = `Validation Error:\n${issues.join('\n')}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  return server;
}

// ============================================
// Standalone CLI Mode
// ============================================

async function main() {
  // Only run in CLI mode (not when imported by Smithery)
  if (process.env.SMITHERY_RUNTIME) {
    return;
  }

  let config: Config;
  try {
    config = createConfig(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Configuration Error:\n' + formatConfigError(error));
    } else {
      console.error('Configuration Error:', error);
    }
    process.exit(1);
  }

  const ctx = createAppContext(config);
  const handlers = createAllHandlers(ctx);

  const server = new Server(
    { name: 'outline-wiki-server', version: '3.0.0' },
    { capabilities: { tools: {} } }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: filterToolsByAccess(allTools, config),
  }));

  // Execute tool with Zod validation
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const handler = handlers[name];
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      const schema = toolSchemas[name as ToolName];
      if (!schema) {
        throw new Error(`No schema found for tool: ${name}`);
      }

      const validatedArgs = schema.parse(args);
      const result = await handler(validatedArgs);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof ZodError) {
        const issues = error.issues.map(
          (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
        );
        errorMessage = `Validation Error:\n${issues.join('\n')}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const toolCount = filterToolsByAccess(allTools, config).length;
  console.error(`Outline Wiki MCP Server v3.0 running on stdio`);
  console.error(`Available tools: ${toolCount}`);
  console.error(`Read-only mode: ${config.READ_ONLY}`);
  console.error(`Delete disabled: ${config.DISABLE_DELETE}`);
  console.error(`Smart features: ${config.ENABLE_SMART_FEATURES}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
