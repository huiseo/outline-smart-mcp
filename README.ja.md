# Outline Wiki MCP Server

[![npm version](https://img.shields.io/npm/v/outline-smart-mcp.svg)](https://www.npmjs.com/package/outline-smart-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

LLMが構造化されたAPI呼び出しを通じて[Outline](https://www.getoutline.com/)ウィキと対話できるようにするModel Context Protocol（MCP）サーバーです。ドキュメント管理、検索、コレクション、コメント、およびRAGベースのQ&Aを含むAI搭載スマート機能を提供します。

## 対応クライアント

| クライアント | Tools | Resources | Prompts |
|-------------|:-----:|:---------:|:-------:|
| [Claude Desktop](https://claude.ai/download) | ✅ | ✅ | ✅ |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | ✅ | ✅ | ✅ |
| [VS Code GitHub Copilot](https://code.visualstudio.com/) | ✅ | ✅ | ✅ |
| [Cursor](https://cursor.sh/) | ✅ | - | ✅ |
| [Windsurf](https://codeium.com/windsurf) | ✅ | - | - |
| [ChatGPT Desktop](https://chatgpt.com/) | ✅ | - | - |

## はじめに

### 必要条件

- Node.js 18.0.0以上
- APIアクセス可能なOutlineインスタンス
- （オプション）スマート機能用のOpenAI APIキー

### Outline APIトークンの取得

1. Outlineインスタンスにログイン
2. **設定** → **API** に移動
3. **APIキーを作成** をクリック
4. 生成されたトークンをコピー（`ol_api_`で始まる）

### インストール

<details>
<summary>Claude Desktop</summary>

Claude Desktop設定ファイルに追加：

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

以下のコマンドを実行：

```bash
claude mcp add outline -e OUTLINE_URL=https://your-outline-instance.com -e OUTLINE_API_TOKEN=ol_api_xxxxxxxxxxxxx -- npx -y outline-smart-mcp
```

または `~/.claude.json`（グローバル）または `.mcp.json`（プロジェクトローカル）に追加：

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

> **注意**: `~/.claude/settings.json`ファイルはMCPサーバーでは無視されます。`~/.claude.json`または`.mcp.json`を使用してください。

</details>

<details>
<summary>VS Code GitHub Copilot</summary>

VS Code設定に追加（`.vscode/mcp.json`）：

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

Cursor MCP設定に追加（`~/.cursor/mcp.json`）：

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

Windsurf MCP設定に追加（`~/.codeium/windsurf/mcp_config.json`）：

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

ChatGPTはデスクトップアプリでMCPをサポートしています。**設定** → **MCP Servers** で以下のように追加：

- Command: `npx`
- Arguments: `-y outline-smart-mcp`
- 環境変数は上記と同じ

</details>

## 設定

### 環境変数

| 変数 | 説明 | 必須 | デフォルト |
|------|------|:----:|-----------|
| `OUTLINE_URL` | OutlineインスタンスURL | はい | `https://app.getoutline.com` |
| `OUTLINE_API_TOKEN` | Outline APIトークン | はい | - |
| `READ_ONLY` | 読み取り専用モード有効化 | いいえ | `false` |
| `DISABLE_DELETE` | 削除操作を無効化 | いいえ | `false` |
| `MAX_RETRIES` | APIリトライ回数 | いいえ | `3` |
| `RETRY_DELAY_MS` | リトライ遅延（ms） | いいえ | `1000` |
| `ENABLE_SMART_FEATURES` | AI機能を有効化 | いいえ | `false` |
| `OPENAI_API_KEY` | OpenAI APIキー | いいえ* | - |

\* `ENABLE_SMART_FEATURES=true`の場合は必須

### スマート機能の設定

AI搭載機能（RAG Q&A、要約など）を有効にするには、設定に以下を追加：

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

## ツール

### 検索と探索

| ツール | 説明 |
|--------|------|
| `search_documents` | キーワードでドキュメント検索（ページネーション対応） |
| `get_document_id_from_title` | タイトルでドキュメントIDを検索 |
| `list_collections` | 全コレクションを取得 |
| `get_collection_structure` | コレクション内のドキュメント階層を取得 |
| `list_recent_documents` | 最近更新されたドキュメントを取得 |

### ドキュメント操作

| ツール | 説明 |
|--------|------|
| `get_document` | IDでドキュメント全文を取得 |
| `export_document` | Markdownでドキュメントをエクスポート |
| `create_document` | 新規ドキュメントを作成 |
| `update_document` | ドキュメントを更新（追記モード対応） |
| `move_document` | ドキュメントを別の場所に移動 |

### ドキュメントライフサイクル

| ツール | 説明 |
|--------|------|
| `archive_document` | ドキュメントをアーカイブ |
| `unarchive_document` | アーカイブされたドキュメントを復元 |
| `delete_document` | ドキュメントを削除（ソフト/完全） |
| `restore_document` | ゴミ箱から復元 |
| `list_archived_documents` | アーカイブされたドキュメント一覧 |
| `list_trash` | ゴミ箱のドキュメント一覧 |

### コメントとコラボレーション

| ツール | 説明 |
|--------|------|
| `add_comment` | コメントを追加（返信対応） |
| `list_document_comments` | ドキュメントのコメントを取得 |
| `get_comment` | 特定のコメントを取得 |
| `get_document_backlinks` | リンクしているドキュメントを検索 |

### コレクション管理

| ツール | 説明 |
|--------|------|
| `create_collection` | コレクションを作成 |
| `update_collection` | コレクションを更新 |
| `delete_collection` | コレクションを削除 |
| `export_collection` | コレクションをエクスポート |
| `export_all_collections` | 全コレクションをエクスポート |

### バッチ操作

| ツール | 説明 |
|--------|------|
| `batch_create_documents` | 複数ドキュメントを作成 |
| `batch_update_documents` | 複数ドキュメントを更新 |
| `batch_move_documents` | 複数ドキュメントを移動 |
| `batch_archive_documents` | 複数ドキュメントをアーカイブ |
| `batch_delete_documents` | 複数ドキュメントを削除 |

### スマート機能（AI搭載）

`ENABLE_SMART_FEATURES=true`と`OPENAI_API_KEY`が必要。

| ツール | 説明 |
|--------|------|
| `smart_status` | ステータスとインデックス数を確認 |
| `sync_knowledge` | ベクターデータベースにドキュメントを同期 |
| `ask_wiki` | ウィキコンテンツベースのRAG Q&A |
| `summarize_document` | AI要約を生成 |
| `suggest_tags` | AIタグ提案 |
| `find_related` | 意味的に関連するドキュメントを検索 |
| `generate_diagram` | Mermaidダイアグラムを生成 |

#### スマート機能の使用方法

```bash
# 1. まずウィキドキュメントを同期
sync_knowledge

# 2. ウィキについて質問
ask_wiki: "デプロイプロセスは何ですか？"

# 3. 長いドキュメントを要約
summarize_document: { documentId: "doc-id", language: "Japanese" }

# 4. 関連コンテンツを検索
find_related: { documentId: "doc-id", limit: 5 }
```

#### 技術スタック

| コンポーネント | 技術 |
|---------------|------|
| ベクターデータベース | LanceDB（組み込み） |
| エンベディング | OpenAI text-embedding-3-small |
| LLM | GPT-4o-mini |
| テキストチャンキング | LangChain |

## 安全機能

### 読み取り専用モード

```bash
READ_ONLY=true
```

読み取り操作のみ許可：検索、取得、エクスポート、リスト操作、全スマート機能。

### 削除の無効化

```bash
DISABLE_DELETE=true
```

ブロック対象：`delete_document`、`delete_collection`、`batch_delete_documents`

## 開発

```bash
# リポジトリをクローン
git clone https://github.com/huiseo/outline-wiki-mcp.git
cd outline-wiki-mcp

# 依存関係をインストール
npm install

# ビルド
npm run build

# テストを実行
npm test

# 型チェック
npm run typecheck
```

## ライセンス

MITライセンス - 詳細は[LICENSE](LICENSE)を参照。

## リンク

- [Outline Wiki](https://www.getoutline.com/)
- [Outline APIドキュメント](https://www.getoutline.com/developers)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCPクライアント](https://modelcontextprotocol.io/clients)
