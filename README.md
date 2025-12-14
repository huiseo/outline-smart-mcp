# Outline Wiki MCP Server

[![npm version](https://img.shields.io/npm/v/outline-smart-mcp.svg)](https://www.npmjs.com/package/outline-smart-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

A Model Context Protocol (MCP) server that enables LLMs to interact with [Outline](https://www.getoutline.com/) wiki through structured API calls. This server provides document management, search, collections, comments, and AI-powered smart features including RAG-based Q&A.

## Why This Server?

Most Outline MCP servers provide basic API wrappers. This one adds optional **Smart Features**:

| Feature | What it does |
|---------|--------------|
| `ask_wiki` | Ask questions in natural language, get answers based on your wiki content (RAG) |
| `find_related` | Find semantically similar documents, not just keyword matches |
| `summarize_document` | Generate summaries of long documents |
| `suggest_tags` | Get tag suggestions based on content analysis |

**When you might need this:**
- Your team's wiki has grown large and search isn't enough
- You want to query your documentation conversationally
- You need semantic search across your knowledge base

**When basic MCP is sufficient:**
- You only need CRUD operations on documents
- You don't want to set up OpenAI API
- Your wiki is small and well-organized

Smart features require `ENABLE_SMART_FEATURES=true` and an OpenAI API key. Without these, the server works as a standard Outline MCP.

### Example Usage

```
User: "What's our policy on remote work?"
→ ask_wiki searches your wiki and returns an answer with source links

User: "Find documents related to the onboarding guide"
→ find_related returns semantically similar docs (not just keyword matches)

User: "Summarize the Q4 planning document"
→ summarize_document generates a concise summary in your preferred language
```

## Supported Clients

| Client | Tools | Resources | Prompts |
|--------|:-----:|:---------:|:-------:|
| [Claude Desktop](https://claude.ai/download) | ✅ | ✅ | ✅ |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | ✅ | ✅ | ✅ |
| [VS Code GitHub Copilot](https://code.visualstudio.com/) | ✅ | ✅ | ✅ |
| [Cursor](https://cursor.sh/) | ✅ | - | ✅ |
| [Windsurf](https://codeium.com/windsurf) | ✅ | - | - |
| [ChatGPT Desktop](https://chatgpt.com/) | ✅ | - | - |

## Getting Started

### Requirements

- Node.js 18.0.0 or higher
- Outline instance with API access
- (Optional) OpenAI API key for smart features

### Getting Your Outline API Token

1. Log in to your Outline instance
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the generated token (starts with `ol_api_`)

### Installation

<details>
<summary>Claude Desktop</summary>

Add to your Claude Desktop configuration:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "outline": {
      "command": "npx",
      "args": ["-y", "outline-smart-mcp"],
      "env": {
        "OUTLINE_URL": "https://your-outline-instance.com",
        "OUTLINE_API_TOKEN": "ol_api_xxxxxxxxxxxxx"
      }
    }
  }
}
```

</details>

<details>
<summary>Claude Code</summary>

Run the following command:

```bash
claude mcp add outline -e OUTLINE_URL=https://your-outline-instance.com -e OUTLINE_API_TOKEN=ol_api_xxxxxxxxxxxxx -- npx -y outline-smart-mcp
```

Or add to `~/.claude.json` (global) or `.mcp.json` (project-local):

```json
{
  "mcpServers": {
    "outline": {
      "command": "npx",
      "args": ["-y", "outline-smart-mcp"],
      "env": {
        "OUTLINE_URL": "https://your-outline-instance.com",
        "OUTLINE_API_TOKEN": "ol_api_xxxxxxxxxxxxx"
      }
    }
  }
}
```

> **Note**: The `~/.claude/settings.json` file is ignored for MCP servers. Use `~/.claude.json` or `.mcp.json` instead.

</details>

<details>
<summary>VS Code GitHub Copilot</summary>

Add to your VS Code settings (`.vscode/mcp.json`):

```json
{
  "servers": {
    "outline": {
      "command": "npx",
      "args": ["-y", "outline-smart-mcp"],
      "env": {
        "OUTLINE_URL": "https://your-outline-instance.com",
        "OUTLINE_API_TOKEN": "ol_api_xxxxxxxxxxxxx"
      }
    }
  }
}
```

</details>

<details>
<summary>Cursor</summary>

Add to Cursor MCP settings (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "outline": {
      "command": "npx",
      "args": ["-y", "outline-smart-mcp"],
      "env": {
        "OUTLINE_URL": "https://your-outline-instance.com",
        "OUTLINE_API_TOKEN": "ol_api_xxxxxxxxxxxxx"
      }
    }
  }
}
```

</details>

<details>
<summary>Windsurf</summary>

Add to Windsurf MCP settings (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "outline": {
      "command": "npx",
      "args": ["-y", "outline-smart-mcp"],
      "env": {
        "OUTLINE_URL": "https://your-outline-instance.com",
        "OUTLINE_API_TOKEN": "ol_api_xxxxxxxxxxxxx"
      }
    }
  }
}
```

</details>

<details>
<summary>ChatGPT Desktop</summary>

ChatGPT supports MCP through its desktop app. Add the server in **Settings** → **MCP Servers** with:

- Command: `npx`
- Arguments: `-y outline-smart-mcp`
- Environment variables as shown above

</details>

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|:--------:|---------|
| `OUTLINE_URL` | Your Outline instance URL | Yes | `https://app.getoutline.com` |
| `OUTLINE_API_TOKEN` | Your Outline API token | Yes | - |
| `READ_ONLY` | Enable read-only mode | No | `false` |
| `DISABLE_DELETE` | Disable delete operations | No | `false` |
| `MAX_RETRIES` | API retry attempts | No | `3` |
| `RETRY_DELAY_MS` | Retry delay (ms) | No | `1000` |
| `ENABLE_SMART_FEATURES` | Enable AI features | No | `false` |
| `OPENAI_API_KEY` | OpenAI API key | No* | - |

\* Required when `ENABLE_SMART_FEATURES=true`

### Smart Features Configuration

To enable AI-powered features (RAG Q&A, summarization, etc.), add these to your config:

```json
{
  "mcpServers": {
    "outline": {
      "command": "npx",
      "args": ["-y", "outline-smart-mcp"],
      "env": {
        "OUTLINE_URL": "https://your-outline-instance.com",
        "OUTLINE_API_TOKEN": "ol_api_xxxxxxxxxxxxx",
        "ENABLE_SMART_FEATURES": "true",
        "OPENAI_API_KEY": "sk-xxxxxxxxxxxxx"
      }
    }
  }
}
```

## Tools

### Search & Discovery

| Tool | Description |
|------|-------------|
| `search_documents` | Search documents by keyword with pagination |
| `get_document_id_from_title` | Find document ID by title |
| `list_collections` | Get all collections |
| `get_collection_structure` | Get document hierarchy in a collection |
| `list_recent_documents` | Get recently modified documents |

### Document Operations

| Tool | Description |
|------|-------------|
| `get_document` | Get full document content by ID |
| `export_document` | Export document in Markdown |
| `create_document` | Create a new document |
| `update_document` | Update document (supports append) |
| `move_document` | Move document to another location |

### Document Lifecycle

| Tool | Description |
|------|-------------|
| `archive_document` | Archive a document |
| `unarchive_document` | Restore archived document |
| `delete_document` | Delete document (soft/permanent) |
| `restore_document` | Restore from trash |
| `list_archived_documents` | List archived documents |
| `list_trash` | List trashed documents |

### Comments & Collaboration

| Tool | Description |
|------|-------------|
| `add_comment` | Add comment (supports replies) |
| `list_document_comments` | Get document comments |
| `get_comment` | Get specific comment |
| `get_document_backlinks` | Find linking documents |

### Collection Management

| Tool | Description |
|------|-------------|
| `create_collection` | Create collection |
| `update_collection` | Update collection |
| `delete_collection` | Delete collection |
| `export_collection` | Export collection |
| `export_all_collections` | Export all collections |

### Batch Operations

| Tool | Description |
|------|-------------|
| `batch_create_documents` | Create multiple documents |
| `batch_update_documents` | Update multiple documents |
| `batch_move_documents` | Move multiple documents |
| `batch_archive_documents` | Archive multiple documents |
| `batch_delete_documents` | Delete multiple documents |

### Smart Features (AI-Powered)

Requires `ENABLE_SMART_FEATURES=true` and `OPENAI_API_KEY`.

| Tool | Description |
|------|-------------|
| `smart_status` | Check status and indexed count |
| `sync_knowledge` | Sync docs to vector database |
| `ask_wiki` | RAG-based Q&A on wiki content |
| `summarize_document` | Generate AI summary |
| `suggest_tags` | AI-suggested tags |
| `find_related` | Find semantically related docs |
| `generate_diagram` | Generate Mermaid diagrams |

#### Smart Features Usage

```bash
# 1. First, sync your wiki documents
sync_knowledge

# 2. Ask questions about your wiki
ask_wiki: "What is our deployment process?"

# 3. Summarize long documents
summarize_document: { documentId: "doc-id", language: "Korean" }

# 4. Find related content
find_related: { documentId: "doc-id", limit: 5 }
```

#### Technology Stack

| Component | Technology |
|-----------|------------|
| Vector Database | LanceDB (embedded) |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | GPT-4o-mini |
| Text Chunking | LangChain |

## Safety Features

### Read-Only Mode

```bash
READ_ONLY=true
```

Restricts to read operations only: search, get, export, list operations, and all smart features.

### Disable Delete

```bash
DISABLE_DELETE=true
```

Blocks: `delete_document`, `delete_collection`, `batch_delete_documents`

## Development

```bash
# Clone repository
git clone https://github.com/huiseo/outline-wiki-mcp.git
cd outline-wiki-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Outline Wiki](https://www.getoutline.com/)
- [Outline API Docs](https://www.getoutline.com/developers)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Clients](https://modelcontextprotocol.io/clients)
