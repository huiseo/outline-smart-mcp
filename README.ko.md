# Outline Wiki MCP Server

[![npm version](https://img.shields.io/npm/v/outline-smart-mcp.svg)](https://www.npmjs.com/package/outline-smart-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

LLM이 구조화된 API 호출을 통해 [Outline](https://www.getoutline.com/) 위키와 상호작용할 수 있게 해주는 Model Context Protocol (MCP) 서버입니다. 문서 관리, 검색, 컬렉션, 댓글 및 RAG 기반 Q&A를 포함한 AI 기반 스마트 기능을 제공합니다.

## 왜 이 서버인가?

대부분의 Outline MCP 서버는 기본적인 API 래퍼를 제공합니다. 이 서버는 선택적 **스마트 기능**을 추가합니다:

| 기능 | 설명 |
|------|------|
| `ask_wiki` | 자연어로 질문하면 위키 내용 기반으로 답변 (RAG) |
| `find_related` | 키워드가 아닌 의미 기반으로 유사 문서 검색 |
| `summarize_document` | 긴 문서 요약 생성 |
| `suggest_tags` | 내용 분석 기반 태그 제안 |

**이 서버가 필요한 경우:**
- 위키가 커져서 검색만으로 부족할 때
- 문서를 대화형으로 질의하고 싶을 때
- 지식 베이스 전체에 의미 기반 검색이 필요할 때

**기본 MCP로 충분한 경우:**
- 문서 CRUD 작업만 필요할 때
- OpenAI API 설정을 원하지 않을 때
- 위키가 작고 잘 정리되어 있을 때

스마트 기능은 `ENABLE_SMART_FEATURES=true`와 OpenAI API 키가 필요합니다. 이 설정 없이는 일반 Outline MCP로 동작합니다.

## 지원 클라이언트

| 클라이언트 | Tools | Resources | Prompts |
|-----------|:-----:|:---------:|:-------:|
| [Claude Desktop](https://claude.ai/download) | ✅ | ✅ | ✅ |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | ✅ | ✅ | ✅ |
| [VS Code GitHub Copilot](https://code.visualstudio.com/) | ✅ | ✅ | ✅ |
| [Cursor](https://cursor.sh/) | ✅ | - | ✅ |
| [Windsurf](https://codeium.com/windsurf) | ✅ | - | - |
| [ChatGPT Desktop](https://chatgpt.com/) | ✅ | - | - |

## 시작하기

### 요구사항

- Node.js 18.0.0 이상
- API 접근이 가능한 Outline 인스턴스
- (선택) 스마트 기능을 위한 OpenAI API 키

### Outline API 토큰 발급

1. Outline 인스턴스에 로그인
2. **설정** → **API** 이동
3. **API 키 생성** 클릭
4. 생성된 토큰 복사 (`ol_api_`로 시작)

### 설치

<details>
<summary>Claude Desktop</summary>

Claude Desktop 설정 파일에 추가:

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

다음 명령어 실행:

```bash
claude mcp add outline -e OUTLINE_URL=https://your-outline-instance.com -e OUTLINE_API_TOKEN=ol_api_xxxxxxxxxxxxx -- npx -y outline-smart-mcp
```

또는 `~/.claude.json` (전역) 또는 `.mcp.json` (프로젝트 로컬)에 추가:

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

> **참고**: `~/.claude/settings.json` 파일은 MCP 서버에서 무시됩니다. `~/.claude.json` 또는 `.mcp.json`을 사용하세요.

</details>

<details>
<summary>VS Code GitHub Copilot</summary>

VS Code 설정에 추가 (`.vscode/mcp.json`):

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

Cursor MCP 설정에 추가 (`~/.cursor/mcp.json`):

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

Windsurf MCP 설정에 추가 (`~/.codeium/windsurf/mcp_config.json`):

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

ChatGPT는 데스크톱 앱에서 MCP를 지원합니다. **설정** → **MCP Servers**에서 다음과 같이 추가:

- Command: `npx`
- Arguments: `-y outline-smart-mcp`
- 환경 변수는 위와 동일

</details>

## 설정

### 환경 변수

| 변수 | 설명 | 필수 | 기본값 |
|------|------|:----:|--------|
| `OUTLINE_URL` | Outline 인스턴스 URL | 예 | `https://app.getoutline.com` |
| `OUTLINE_API_TOKEN` | Outline API 토큰 | 예 | - |
| `READ_ONLY` | 읽기 전용 모드 활성화 | 아니오 | `false` |
| `DISABLE_DELETE` | 삭제 작업 비활성화 | 아니오 | `false` |
| `MAX_RETRIES` | API 재시도 횟수 | 아니오 | `3` |
| `RETRY_DELAY_MS` | 재시도 지연 시간 (ms) | 아니오 | `1000` |
| `ENABLE_SMART_FEATURES` | AI 기능 활성화 | 아니오 | `false` |
| `OPENAI_API_KEY` | OpenAI API 키 | 아니오* | - |

\* `ENABLE_SMART_FEATURES=true`일 때 필수

### 스마트 기능 설정

AI 기반 기능(RAG Q&A, 요약 등)을 활성화하려면 설정에 다음을 추가:

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

## 도구

### 검색 및 탐색

| 도구 | 설명 |
|------|------|
| `search_documents` | 키워드로 문서 검색 (페이지네이션 지원) |
| `get_document_id_from_title` | 제목으로 문서 ID 찾기 |
| `list_collections` | 모든 컬렉션 조회 |
| `get_collection_structure` | 컬렉션 내 문서 계층 구조 조회 |
| `list_recent_documents` | 최근 수정된 문서 조회 |

### 문서 작업

| 도구 | 설명 |
|------|------|
| `get_document` | ID로 문서 전체 내용 조회 |
| `export_document` | 마크다운으로 문서 내보내기 |
| `create_document` | 새 문서 생성 |
| `update_document` | 문서 업데이트 (추가 모드 지원) |
| `move_document` | 문서를 다른 위치로 이동 |

### 문서 수명주기

| 도구 | 설명 |
|------|------|
| `archive_document` | 문서 보관 |
| `unarchive_document` | 보관된 문서 복원 |
| `delete_document` | 문서 삭제 (소프트/영구) |
| `restore_document` | 휴지통에서 복원 |
| `list_archived_documents` | 보관된 문서 목록 |
| `list_trash` | 휴지통 문서 목록 |

### 댓글 및 협업

| 도구 | 설명 |
|------|------|
| `add_comment` | 댓글 추가 (답글 지원) |
| `list_document_comments` | 문서의 댓글 조회 |
| `get_comment` | 특정 댓글 조회 |
| `get_document_backlinks` | 링크된 문서 찾기 |

### 컬렉션 관리

| 도구 | 설명 |
|------|------|
| `create_collection` | 컬렉션 생성 |
| `update_collection` | 컬렉션 업데이트 |
| `delete_collection` | 컬렉션 삭제 |
| `export_collection` | 컬렉션 내보내기 |
| `export_all_collections` | 모든 컬렉션 내보내기 |

### 일괄 작업

| 도구 | 설명 |
|------|------|
| `batch_create_documents` | 여러 문서 생성 |
| `batch_update_documents` | 여러 문서 업데이트 |
| `batch_move_documents` | 여러 문서 이동 |
| `batch_archive_documents` | 여러 문서 보관 |
| `batch_delete_documents` | 여러 문서 삭제 |

### 스마트 기능 (AI 기반)

`ENABLE_SMART_FEATURES=true`와 `OPENAI_API_KEY` 필요.

| 도구 | 설명 |
|------|------|
| `smart_status` | 상태 및 인덱싱 수 확인 |
| `sync_knowledge` | 벡터 데이터베이스에 문서 동기화 |
| `ask_wiki` | 위키 콘텐츠 기반 RAG Q&A |
| `summarize_document` | AI 요약 생성 |
| `suggest_tags` | AI 태그 제안 |
| `find_related` | 의미적으로 관련된 문서 찾기 |
| `generate_diagram` | Mermaid 다이어그램 생성 |

#### 스마트 기능 사용법

```bash
# 1. 먼저 위키 문서 동기화
sync_knowledge

# 2. 위키에 대해 질문
ask_wiki: "배포 프로세스는 무엇인가요?"

# 3. 긴 문서 요약
summarize_document: { documentId: "doc-id", language: "Korean" }

# 4. 관련 콘텐츠 찾기
find_related: { documentId: "doc-id", limit: 5 }
```

#### 기술 스택

| 구성요소 | 기술 |
|----------|------|
| 벡터 데이터베이스 | LanceDB (임베디드) |
| 임베딩 | OpenAI text-embedding-3-small |
| LLM | GPT-4o-mini |
| 텍스트 청킹 | LangChain |

## 안전 기능

### 읽기 전용 모드

```bash
READ_ONLY=true
```

읽기 작업만 허용: 검색, 조회, 내보내기, 목록 작업 및 모든 스마트 기능.

### 삭제 비활성화

```bash
DISABLE_DELETE=true
```

차단 대상: `delete_document`, `delete_collection`, `batch_delete_documents`

## 개발

```bash
# 저장소 복제
git clone https://github.com/huiseo/outline-wiki-mcp.git
cd outline-wiki-mcp

# 의존성 설치
npm install

# 빌드
npm run build

# 테스트 실행
npm test

# 타입 체크
npm run typecheck
```

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE) 참조.

## 링크

- [Outline Wiki](https://www.getoutline.com/)
- [Outline API 문서](https://www.getoutline.com/developers)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP 클라이언트](https://modelcontextprotocol.io/clients)
