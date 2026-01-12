# CLAUDE.md - AI Assistant Guide

This file provides guidance for AI assistants working with this codebase.

## Project Overview

**outline-smart-mcp** is a TypeScript-based MCP (Model Context Protocol) server for Outline Wiki integration. It provides 37 tools for document management, search, comments, collections, and AI-powered features.

## Architecture

```
src/
├── index.ts              # Entry point, MCP server setup
├── lib/
│   ├── config.ts         # Environment configuration with Zod validation
│   ├── context.ts        # Application context (API client, brain, config)
│   ├── tools.ts          # Tool definitions with descriptions and annotations
│   ├── schemas.ts        # Zod input schemas with descriptions
│   ├── errors.ts         # Error classes with recovery hints
│   ├── resources.ts      # MCP Resources (outline:// URIs)
│   ├── access-control.ts # Read-only mode, delete protection
│   ├── api-client.ts     # Native Fetch HTTP client with retry
│   ├── response.ts       # Response formatting utilities
│   ├── handlers/         # Tool handler implementations
│   │   ├── index.ts      # Handler registry
│   │   ├── search.ts     # Search & discovery handlers
│   │   ├── documents.ts  # Document CRUD handlers
│   │   ├── collections.ts # Collection handlers
│   │   ├── comments.ts   # Comment handlers
│   │   ├── batch.ts      # Batch operation handlers
│   │   └── smart.ts      # AI-powered feature handlers
│   ├── formatters/       # Output formatters for LLM readability
│   ├── brain/            # AI/RAG implementation (LanceDB + OpenAI)
│   └── types/            # TypeScript type definitions
```

## Key Design Patterns

### 1. Tool Definition Pattern
Tools are defined with detailed descriptions in `tools.ts`:
```typescript
const DESCRIPTIONS = {
  search_documents: `Search documents by keyword...

IMPORTANT: Performs full-text search...

Use this tool when you need to:
- Find documents...

EXAMPLES:
- Search all: { "query": "vacation policy" }`,
};
```

### 2. Schema with Description
Schemas use `.describe()` for LLM understanding:
```typescript
query: z
  .string()
  .min(1, 'Query is required')
  .describe('Search keywords or phrase (e.g., "vacation policy")'),
```

### 3. Error Recovery Hints
Errors provide actionable hints:
```typescript
getRecoveryHint(): string {
  if (this.status === 404) {
    return 'Hint: Resource not found. Use search_documents to find valid IDs.';
  }
}
```

### 4. Tool Annotations
Tools include MCP annotations for LLM guidance:
```typescript
{
  readOnlyHint: true,      // Doesn't modify state
  destructiveHint: false,  // Doesn't delete data
  idempotentHint: true,    // Same result if repeated
  openWorldHint: true,     // Uses external services (AI)
}
```

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Watch mode compilation
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Prettier
npm test             # Run tests
```

## Testing the MCP Server

```bash
# Build first
npm run build

# Test with JSON-RPC
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | \
  OUTLINE_URL=https://app.getoutline.com OUTLINE_API_TOKEN=your_token node dist/index.js
```

## Important Considerations

### When Adding New Tools

1. Add schema in `schemas.ts` with `.describe()` on all fields
2. Add detailed description in `tools.ts` DESCRIPTIONS object
3. Add annotations in `tools.ts` ANNOTATIONS object
4. Add relationship in TOOL_RELATIONSHIPS if applicable
5. Implement handler in appropriate file under `handlers/`
6. Add to `toolSchemas` map in `schemas.ts`
7. Add to `allTools` array in `tools.ts`

### When Modifying Error Handling

1. Add specific recovery hints in `errors.ts` RECOVERY_HINTS
2. Add context-specific hints in CONTEXT_HINTS
3. Use `OutlineApiError.from(error, context)` to attach context

### Smart Features

Smart features require:
- `ENABLE_SMART_FEATURES=true`
- `OPENAI_API_KEY` environment variable
- Running `sync_knowledge` before `ask_wiki` or `find_related`

## File Modification Guidelines

- **tools.ts**: Add/modify tool descriptions and annotations
- **schemas.ts**: Add/modify input validation schemas
- **errors.ts**: Add error types and recovery hints
- **handlers/*.ts**: Implement tool logic
- **resources.ts**: Add new MCP resource URIs
- **access-control.ts**: Modify permission rules

## Code Style

- Use TypeScript strict mode
- Use Zod for all input validation
- Use async/await for async operations
- Include JSDoc comments for public functions
- Keep handlers focused and single-purpose
