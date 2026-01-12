#!/usr/bin/env node

/**
 * Outline Wiki MCP Server v3.2
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
 * - MCP Resources for direct content access
 * - Tool annotations for LLM guidance
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z, ZodError } from 'zod';

import { createConfig, formatConfigError, type Config } from './lib/config.js';
import { createAppContext, type AppContext } from './lib/context.js';
import { allTools } from './lib/tools.js';
import { toolSchemas, type ToolName } from './lib/schemas.js';
import { filterToolsByAccess } from './lib/access-control.js';
import { createAllHandlers } from './lib/handlers/index.js';
import { createResourceHandlers, getResourceTemplates } from './lib/resources.js';
import { getErrorMessage } from './lib/errors.js';
import type { ToolHandlers } from './lib/types/handlers.js';

/** Server version */
const SERVER_VERSION = '3.2.0';

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
// Shared Server Setup (Eliminates Duplication)
// ============================================

interface ServerDependencies {
  config: Config;
  handlers: ToolHandlers;
  resourceHandlers: ReturnType<typeof createResourceHandlers>;
}

/**
 * Configure MCP server with all request handlers
 * This is the single source of truth for server configuration
 */
function configureServer(server: Server, deps: ServerDependencies): void {
  const { config, handlers, resourceHandlers } = deps;

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: filterToolsByAccess(allTools, config),
  }));

  // List resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
    resourceTemplates: getResourceTemplates(),
  }));

  // Read resource by URI
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    try {
      return await resourceHandlers.readResource(request.params.uri);
    } catch (error) {
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: 'text/plain',
            text: `Error: ${getErrorMessage(error)}`,
          },
        ],
      };
    }
  });

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
        errorMessage = `Validation Error:\n${issues.join('\n')}\n\nHint: Check parameter names and types. Use the tool description for valid values.`;
      } else {
        errorMessage = getErrorMessage(error);
      }
      return {
        content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  });
}

/**
 * Create server with dependencies from context
 */
function createServerFromContext(ctx: AppContext): Server {
  const handlers = createAllHandlers(ctx);
  const resourceHandlers = createResourceHandlers(ctx);

  const server = new Server(
    { name: 'outline-wiki-server', version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  configureServer(server, {
    config: ctx.config,
    handlers,
    resourceHandlers,
  });

  return server;
}

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

  return createServerFromContext(ctx);
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
  const server = createServerFromContext(ctx);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const toolCount = filterToolsByAccess(allTools, config).length;
  console.error(`Outline Wiki MCP Server v${SERVER_VERSION} running on stdio`);
  console.error(`Available tools: ${toolCount}`);
  console.error(`Available resources: ${getResourceTemplates().length} templates`);
  console.error(`Read-only mode: ${config.READ_ONLY}`);
  console.error(`Delete disabled: ${config.DISABLE_DELETE}`);
  console.error(`Smart features: ${config.ENABLE_SMART_FEATURES}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
