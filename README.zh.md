# Outline Wiki MCP Server

[![npm version](https://img.shields.io/npm/v/outline-smart-mcp.svg)](https://www.npmjs.com/package/outline-smart-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

一个 Model Context Protocol (MCP) 服务器，使 LLM 能够通过结构化 API 调用与 [Outline](https://www.getoutline.com/) 维基进行交互。该服务器提供文档管理、搜索、集合、评论以及包含基于 RAG 问答的 AI 智能功能。

## 为什么选择这个服务器？

大多数 Outline MCP 服务器提供基本的 API 封装。这个服务器添加了可选的**智能功能**：

| 功能 | 说明 |
|------|------|
| `ask_wiki` | 用自然语言提问，根据维基内容获取答案（RAG） |
| `find_related` | 基于语义而非关键词查找相似文档 |
| `summarize_document` | 生成长文档摘要 |
| `suggest_tags` | 基于内容分析的标签建议 |

**适用场景：**
- 团队维基规模较大，仅搜索已不够用
- 希望以对话方式查询文档
- 需要在知识库中进行语义搜索

**基本 MCP 足够的情况：**
- 只需要文档的增删改查操作
- 不想设置 OpenAI API
- 维基规模小且组织良好

智能功能需要 `ENABLE_SMART_FEATURES=true` 和 OpenAI API 密钥。没有这些设置时，服务器作为标准 Outline MCP 运行。

### 使用示例

```
用户："远程办公政策是什么？"
→ ask_wiki 搜索维基并返回带有来源链接的答案

用户："查找与入职指南相关的文档"
→ find_related 返回语义相似的文档（而非仅关键词匹配）

用户："总结一下 Q4 计划文档"
→ summarize_document 生成您指定语言的简洁摘要
```

## 支持的客户端

| 客户端 | Tools | Resources | Prompts |
|--------|:-----:|:---------:|:-------:|
| [Claude Desktop](https://claude.ai/download) | ✅ | ✅ | ✅ |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | ✅ | ✅ | ✅ |
| [VS Code GitHub Copilot](https://code.visualstudio.com/) | ✅ | ✅ | ✅ |
| [Cursor](https://cursor.sh/) | ✅ | - | ✅ |
| [Windsurf](https://codeium.com/windsurf) | ✅ | - | - |
| [ChatGPT Desktop](https://chatgpt.com/) | ✅ | - | - |

## 快速开始

### 环境要求

- Node.js 18.0.0 或更高版本
- 具有 API 访问权限的 Outline 实例
- （可选）用于智能功能的 OpenAI API 密钥

### 获取 Outline API 令牌

1. 登录您的 Outline 实例
2. 进入 **设置** → **API**
3. 点击 **创建 API 密钥**
4. 复制生成的令牌（以 `ol_api_` 开头）

### 安装

<details>
<summary>Claude Desktop</summary>

添加到 Claude Desktop 配置文件：

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

运行以下命令：

```bash
claude mcp add outline -e OUTLINE_URL=https://your-outline-instance.com -e OUTLINE_API_TOKEN=ol_api_xxxxxxxxxxxxx -- npx -y outline-smart-mcp
```

或添加到 `~/.claude.json`（全局）或 `.mcp.json`（项目本地）：

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

> **注意**：`~/.claude/settings.json` 文件在 MCP 服务器中会被忽略。请使用 `~/.claude.json` 或 `.mcp.json`。

</details>

<details>
<summary>VS Code GitHub Copilot</summary>

添加到 VS Code 设置（`.vscode/mcp.json`）：

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

添加到 Cursor MCP 设置（`~/.cursor/mcp.json`）：

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

添加到 Windsurf MCP 设置（`~/.codeium/windsurf/mcp_config.json`）：

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

ChatGPT 通过其桌面应用支持 MCP。在 **设置** → **MCP Servers** 中添加：

- Command: `npx`
- Arguments: `-y outline-smart-mcp`
- 环境变量如上所示

</details>

## 配置

### 环境变量

| 变量 | 描述 | 必需 | 默认值 |
|------|------|:----:|--------|
| `OUTLINE_URL` | Outline 实例 URL | 是 | `https://app.getoutline.com` |
| `OUTLINE_API_TOKEN` | Outline API 令牌 | 是 | - |
| `READ_ONLY` | 启用只读模式 | 否 | `false` |
| `DISABLE_DELETE` | 禁用删除操作 | 否 | `false` |
| `MAX_RETRIES` | API 重试次数 | 否 | `3` |
| `RETRY_DELAY_MS` | 重试延迟（毫秒） | 否 | `1000` |
| `ENABLE_SMART_FEATURES` | 启用 AI 功能 | 否 | `false` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | 否* | - |

\* 当 `ENABLE_SMART_FEATURES=true` 时必需

### 智能功能配置

要启用 AI 功能（RAG 问答、摘要等），请在配置中添加：

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

## 工具

### 搜索与发现

| 工具 | 描述 |
|------|------|
| `search_documents` | 按关键词搜索文档（支持分页） |
| `get_document_id_from_title` | 通过标题查找文档 ID |
| `list_collections` | 获取所有集合 |
| `get_collection_structure` | 获取集合中的文档层次结构 |
| `list_recent_documents` | 获取最近修改的文档 |

### 文档操作

| 工具 | 描述 |
|------|------|
| `get_document` | 通过 ID 获取完整文档内容 |
| `export_document` | 以 Markdown 格式导出文档 |
| `create_document` | 创建新文档 |
| `update_document` | 更新文档（支持追加） |
| `move_document` | 将文档移动到其他位置 |

### 文档生命周期

| 工具 | 描述 |
|------|------|
| `archive_document` | 归档文档 |
| `unarchive_document` | 恢复已归档文档 |
| `delete_document` | 删除文档（软删除/永久删除） |
| `restore_document` | 从回收站恢复 |
| `list_archived_documents` | 列出已归档文档 |
| `list_trash` | 列出回收站中的文档 |

### 评论与协作

| 工具 | 描述 |
|------|------|
| `add_comment` | 添加评论（支持回复） |
| `list_document_comments` | 获取文档评论 |
| `get_comment` | 获取特定评论 |
| `get_document_backlinks` | 查找链接到此文档的文档 |

### 集合管理

| 工具 | 描述 |
|------|------|
| `create_collection` | 创建集合 |
| `update_collection` | 更新集合 |
| `delete_collection` | 删除集合 |
| `export_collection` | 导出集合 |
| `export_all_collections` | 导出所有集合 |

### 批量操作

| 工具 | 描述 |
|------|------|
| `batch_create_documents` | 批量创建文档 |
| `batch_update_documents` | 批量更新文档 |
| `batch_move_documents` | 批量移动文档 |
| `batch_archive_documents` | 批量归档文档 |
| `batch_delete_documents` | 批量删除文档 |

### 智能功能（AI 驱动）

需要 `ENABLE_SMART_FEATURES=true` 和 `OPENAI_API_KEY`。

| 工具 | 描述 |
|------|------|
| `smart_status` | 检查状态和索引数量 |
| `sync_knowledge` | 将文档同步到向量数据库 |
| `ask_wiki` | 基于维基内容的 RAG 问答 |
| `summarize_document` | 生成 AI 摘要 |
| `suggest_tags` | AI 标签建议 |
| `find_related` | 查找语义相关的文档 |
| `generate_diagram` | 生成 Mermaid 图表 |

#### 智能功能使用方法

```bash
# 1. 首先同步维基文档
sync_knowledge

# 2. 询问关于维基的问题
ask_wiki: "我们的部署流程是什么？"

# 3. 摘要长文档
summarize_document: { documentId: "doc-id", language: "Chinese" }

# 4. 查找相关内容
find_related: { documentId: "doc-id", limit: 5 }
```

#### 技术栈

| 组件 | 技术 |
|------|------|
| 向量数据库 | LanceDB（嵌入式） |
| 嵌入 | OpenAI text-embedding-3-small |
| LLM | GPT-4o-mini |
| 文本分块 | LangChain |

## 安全功能

### 只读模式

```bash
READ_ONLY=true
```

仅允许读取操作：搜索、获取、导出、列表操作和所有智能功能。

### 禁用删除

```bash
DISABLE_DELETE=true
```

阻止：`delete_document`、`delete_collection`、`batch_delete_documents`

## 开发

```bash
# 克隆仓库
git clone https://github.com/huiseo/outline-wiki-mcp.git
cd outline-wiki-mcp

# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 类型检查
npm run typecheck
```

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE)。

## 链接

- [Outline Wiki](https://www.getoutline.com/)
- [Outline API 文档](https://www.getoutline.com/developers)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP 客户端](https://modelcontextprotocol.io/clients)
