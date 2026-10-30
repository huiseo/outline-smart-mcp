# Outline Wiki MCP Server

[![npm version](https://img.shields.io/npm/v/outline-smart-mcp.svg)](https://www.npmjs.com/package/outline-smart-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md) | [Deutsch](README.de.md)

Ein Model-Context-Protocol-(MCP-)Server, der es LLMs ermöglicht, über strukturierte API-Aufrufe mit dem [Outline](https://www.getoutline.com/)-Wiki zu interagieren. Dieser Server bietet Dokumentenverwaltung, Suche, Sammlungen, Kommentare und KI-gestützte Smart Features, darunter RAG-basierte Fragen und Antworten.

## Warum dieser Server?

Die meisten Outline-MCP-Server bieten nur einfache API-Wrapper. Dieser Server ergänzt optionale **Smart Features**:

| Funktion | Was sie tut |
|---------|--------------|
| `ask_wiki` | Fragen in natürlicher Sprache stellen und Antworten auf Basis der Wiki-Inhalte erhalten (RAG) |
| `find_related` | Semantisch ähnliche Dokumente finden, nicht nur Stichwort-Treffer |
| `summarize_document` | Zusammenfassungen langer Dokumente erzeugen |
| `suggest_tags` | Tag-Vorschläge auf Basis einer Inhaltsanalyse erhalten |

**Wann Sie das brauchen könnten:**
- Das Wiki Ihres Teams ist stark gewachsen und die Suche reicht nicht mehr aus
- Sie möchten Ihre Dokumentation im Dialog abfragen
- Sie benötigen eine semantische Suche über Ihre Wissensbasis

**Wann der einfache MCP-Server genügt:**
- Sie benötigen nur CRUD-Operationen auf Dokumenten
- Sie möchten keine OpenAI-API einrichten
- Ihr Wiki ist klein und gut organisiert

Die Smart Features erfordern `ENABLE_SMART_FEATURES=true` und einen OpenAI-API-Schlüssel. Ohne diese Angaben arbeitet der Server als normaler Outline-MCP-Server.

### Anwendungsbeispiele

```
Nutzer: „Wie lautet unsere Richtlinie zur Remote-Arbeit?“
→ ask_wiki durchsucht Ihr Wiki und liefert eine Antwort mit Quellenlinks

Nutzer: „Finde Dokumente, die zum Onboarding-Leitfaden passen“
→ find_related liefert semantisch ähnliche Dokumente (nicht nur Stichwort-Treffer)

Nutzer: „Fasse das Planungsdokument für Q4 zusammen“
→ summarize_document erzeugt eine knappe Zusammenfassung in Ihrer bevorzugten Sprache
```

## Unterstützte Clients

| Client | Tools | Ressourcen | Prompts |
|--------|:-----:|:---------:|:-------:|
| [Claude Desktop](https://claude.ai/download) | ✅ | ✅ | ✅ |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | ✅ | ✅ | ✅ |
| [VS Code GitHub Copilot](https://code.visualstudio.com/) | ✅ | ✅ | ✅ |
| [Cursor](https://cursor.sh/) | ✅ | - | ✅ |
| [Windsurf](https://codeium.com/windsurf) | ✅ | - | - |
| [ChatGPT Desktop](https://chatgpt.com/) | ✅ | - | - |

## Erste Schritte

### Voraussetzungen

- Node.js 18.0.0 oder höher
- Outline-Instanz mit API-Zugriff
- (Optional) OpenAI-API-Schlüssel für die Smart Features

### Outline-API-Token erhalten

1. Melden Sie sich bei Ihrer Outline-Instanz an
2. Gehen Sie zu **Einstellungen** → **API**
3. Klicken Sie auf **API-Schlüssel erstellen**
4. Kopieren Sie das erzeugte Token (beginnt mit `ol_api_`)

### Installation

<details>
<summary>Claude Desktop</summary>

Fügen Sie Folgendes zu Ihrer Claude-Desktop-Konfiguration hinzu:

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

Führen Sie den folgenden Befehl aus:

```bash
claude mcp add outline -e OUTLINE_URL=https://your-outline-instance.com -e OUTLINE_API_TOKEN=ol_api_xxxxxxxxxxxxx -- npx -y outline-smart-mcp
```

Oder fügen Sie die Konfiguration zu `~/.claude.json` (global) oder `.mcp.json` (projektlokal) hinzu:

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

> **Hinweis**: Die Datei `~/.claude/settings.json` wird für MCP-Server ignoriert. Verwenden Sie stattdessen `~/.claude.json` oder `.mcp.json`.

</details>

<details>
<summary>VS Code GitHub Copilot</summary>

Fügen Sie Folgendes zu Ihren VS-Code-Einstellungen (`.vscode/mcp.json`) hinzu:

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

Fügen Sie Folgendes zu den MCP-Einstellungen von Cursor (`~/.cursor/mcp.json`) hinzu:

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

Fügen Sie Folgendes zu den MCP-Einstellungen von Windsurf (`~/.codeium/windsurf/mcp_config.json`) hinzu:

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

ChatGPT unterstützt MCP über die Desktop-App. Fügen Sie den Server unter **Einstellungen** → **MCP-Server** mit folgenden Angaben hinzu:

- Befehl: `npx`
- Argumente: `-y outline-smart-mcp`
- Umgebungsvariablen wie oben gezeigt

</details>

## Konfiguration

### Umgebungsvariablen

| Variable | Beschreibung | Erforderlich | Standard |
|----------|-------------|:--------:|---------|
| `OUTLINE_URL` | URL Ihrer Outline-Instanz | Ja | `https://app.getoutline.com` |
| `OUTLINE_API_TOKEN` | Ihr Outline-API-Token | Ja | - |
| `READ_ONLY` | Schreibgeschützten Modus aktivieren | Nein | `false` |
| `DISABLE_DELETE` | Löschvorgänge deaktivieren | Nein | `false` |
| `MAX_RETRIES` | Anzahl der API-Wiederholungsversuche | Nein | `3` |
| `RETRY_DELAY_MS` | Wartezeit zwischen Wiederholungen (ms) | Nein | `1000` |
| `ENABLE_SMART_FEATURES` | KI-Funktionen aktivieren | Nein | `false` |
| `OPENAI_API_KEY` | OpenAI-API-Schlüssel | Nein* | - |

\* Erforderlich, wenn `ENABLE_SMART_FEATURES=true` gesetzt ist

### Konfiguration der Smart Features

Um die KI-gestützten Funktionen (RAG-Fragen und -Antworten, Zusammenfassungen usw.) zu aktivieren, ergänzen Sie Ihre Konfiguration um Folgendes:

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

### Suche und Entdeckung

| Tool | Beschreibung |
|------|-------------|
| `search_documents` | Dokumente per Stichwort mit Paginierung durchsuchen |
| `get_document_id_from_title` | Dokument-ID anhand des Titels finden |
| `list_collections` | Alle Sammlungen abrufen |
| `get_collection_structure` | Dokumenthierarchie einer Sammlung abrufen |
| `list_recent_documents` | Zuletzt geänderte Dokumente abrufen |

### Dokumentoperationen

| Tool | Beschreibung |
|------|-------------|
| `get_document` | Vollständigen Dokumentinhalt anhand der ID abrufen |
| `export_document` | Dokument als Markdown exportieren |
| `create_document` | Neues Dokument erstellen |
| `update_document` | Dokument aktualisieren (unterstützt Anhängen) |
| `move_document` | Dokument an einen anderen Ort verschieben |

### Dokument-Lebenszyklus

| Tool | Beschreibung |
|------|-------------|
| `archive_document` | Dokument archivieren |
| `unarchive_document` | Archiviertes Dokument wiederherstellen |
| `delete_document` | Dokument löschen (vorläufig/endgültig) |
| `restore_document` | Aus dem Papierkorb wiederherstellen |
| `list_archived_documents` | Archivierte Dokumente auflisten |
| `list_trash` | Dokumente im Papierkorb auflisten |

### Kommentare und Zusammenarbeit

| Tool | Beschreibung |
|------|-------------|
| `add_comment` | Kommentar hinzufügen (unterstützt Antworten) |
| `list_document_comments` | Kommentare eines Dokuments abrufen |
| `get_comment` | Bestimmten Kommentar abrufen |
| `get_document_backlinks` | Verlinkende Dokumente finden |

### Sammlungsverwaltung

| Tool | Beschreibung |
|------|-------------|
| `create_collection` | Sammlung erstellen |
| `update_collection` | Sammlung aktualisieren |
| `delete_collection` | Sammlung löschen |
| `export_collection` | Sammlung exportieren |
| `export_all_collections` | Alle Sammlungen exportieren |

### Stapelverarbeitung

| Tool | Beschreibung |
|------|-------------|
| `batch_create_documents` | Mehrere Dokumente erstellen |
| `batch_update_documents` | Mehrere Dokumente aktualisieren |
| `batch_move_documents` | Mehrere Dokumente verschieben |
| `batch_archive_documents` | Mehrere Dokumente archivieren |
| `batch_delete_documents` | Mehrere Dokumente löschen |

### Smart Features (KI-gestützt)

Erfordert `ENABLE_SMART_FEATURES=true` und `OPENAI_API_KEY`.

| Tool | Beschreibung |
|------|-------------|
| `smart_status` | Status und Anzahl indexierter Dokumente prüfen |
| `sync_knowledge` | Dokumente mit der Vektordatenbank synchronisieren |
| `ask_wiki` | RAG-basierte Fragen und Antworten zu den Wiki-Inhalten |
| `summarize_document` | KI-Zusammenfassung erzeugen |
| `suggest_tags` | KI-generierte Tag-Vorschläge |
| `find_related` | Semantisch verwandte Dokumente finden |
| `generate_diagram` | Mermaid-Diagramme erzeugen |

#### Nutzung der Smart Features

```bash
# 1. Zuerst die Wiki-Dokumente synchronisieren
sync_knowledge

# 2. Fragen zum Wiki stellen
ask_wiki: "Wie sieht unser Deployment-Prozess aus?"

# 3. Lange Dokumente zusammenfassen
summarize_document: { documentId: "doc-id", language: "German" }

# 4. Verwandte Inhalte finden
find_related: { documentId: "doc-id", limit: 5 }
```

#### Technologie-Stack

| Komponente | Technologie |
|-----------|------------|
| Vektordatenbank | LanceDB (eingebettet) |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | GPT-4o-mini |
| Text-Chunking | LangChain |

## Sicherheitsfunktionen

### Schreibgeschützter Modus

```bash
READ_ONLY=true
```

Beschränkt auf Lesezugriffe: Suchen, Abrufen, Exportieren, Auflisten und alle Smart Features.

### Löschen deaktivieren

```bash
DISABLE_DELETE=true
```

Blockiert: `delete_document`, `delete_collection`, `batch_delete_documents`

## Entwicklung

```bash
# Repository klonen
git clone https://github.com/huiseo/outline-wiki-mcp.git
cd outline-wiki-mcp

# Abhängigkeiten installieren
npm install

# Build
npm run build

# Tests ausführen
npm test

# Typprüfung
npm run typecheck
```

## Lizenz

MIT-Lizenz – Details siehe [LICENSE](LICENSE).

## Links

- [Outline Wiki](https://www.getoutline.com/)
- [Outline-API-Dokumentation](https://www.getoutline.com/developers)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP-Clients](https://modelcontextprotocol.io/clients)
