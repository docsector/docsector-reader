# MCP and WebMCP Reference

Docsector can expose documentation to agents through MCP, WebMCP, Markdown negotiation, and `llms.txt`. Use these sources when an assistant needs current docs instead of only the static guidance in this skill.

## MCP Server

When configured, Docsector generates an MCP endpoint at:

```text
/mcp
```

The server exposes tools named with the configured suffix:

| Tool                | Purpose                               |
| ------------------- | ------------------------------------- |
| `search_{suffix}`   | Search documentation pages by keyword |
| `get_page_{suffix}` | Fetch raw Markdown for a page path    |

This repository configures `toolSuffix: 'docsector'`, so connected MCP clients should see:

```text
search_docsector
get_page_docsector
```

## MCP Page Paths

`get_page_{suffix}` expects paths without a leading slash, trailing slash, or `.md` suffix. It can try an `/overview` fallback when the primary path is not found.

Useful examples:

```text
manual/content/blocks/quick-links/overview
manual/content/blocks/cards/overview
manual/content/blocks/code-examples/overview
manual/content/blocks/api-reference/overview
manual/content/blocks/timeline/showcase
guide/getting-started/overview
```

## Recommended Agent Flow

1. Use `search_{suffix}` for discovery, such as `search_docsector` with `"timeline block"`.
2. Use `get_page_{suffix}` with the best matching path.
3. Read the returned Markdown examples before authoring or changing a custom element.
4. Prefer the live manual page when it conflicts with this static skill.
5. If MCP is not connected, use Markdown URLs, `llms.txt`, or the references bundled with this skill.

## WebMCP Browser Tools

When `navigator.modelContext` is available in a secure browser context, Docsector can register browser-side tools. Typical tool names are:

| Tool                     | Purpose                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| `docs.search_docs`       | Search docs through the MCP bridge                                |
| `docs.get_page`          | Fetch page Markdown through the MCP bridge                        |
| `docs.navigate_to`       | Navigate the single-page app to a route and optional hash         |
| `docs.copy_current_page` | Return the current page path, Markdown URL, and optionally source |

Use these tools when working inside a Docsector page with a browser agent. Use MCP tools directly when working from an editor or external assistant.

## Markdown and LLM Discovery

Docsector pages can expose raw Markdown in several ways:

- Append `.md` to a page URL.
- Send `Accept: text/markdown` to use Markdown negotiation.
- Use `/llms.txt` for an index of pages when `siteUrl` is configured.
- Use `/llms-full.txt` for concatenated full content when generated.

These are useful fallbacks when MCP is unavailable.

## Discovery Artifacts

Docsector can also publish machine-readable discovery files:

| Artifact                               | Purpose                      |
| -------------------------------------- | ---------------------------- |
| `/.well-known/mcp/server-card.json`    | MCP server discovery         |
| `/.well-known/agent-skills/index.json` | Agent Skills Discovery index |
| `/.well-known/api-catalog`             | API catalog Linkset JSON     |

## Caveats

- MCP search indexes pages, not individual component schemas.
- Public API JSON files under `/api/...` and `/quasar-api/...` are static assets and may not be directly searchable through MCP page search.
- WebMCP requires browser support for `navigator.modelContext` and a secure context, except where localhost is allowed by the browser.
- Generated MCP indexes are build artifacts, so a production build is required after source changes.
- If multiple Docsector sites are connected to the same assistant, each site should use a unique MCP tool suffix.
