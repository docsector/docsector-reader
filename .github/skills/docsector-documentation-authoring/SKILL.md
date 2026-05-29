---
name: docsector-documentation-authoring
description: "Author Docsector documentation with Markdown, d-block custom elements, page structures, blocks, MCP, WebMCP, and agent-readable docs. Use when writing or editing Docsector pages, choosing content blocks, creating examples, documenting APIs, or helping an AI understand Docsector authoring syntax."
argument-hint: "Describe the Docsector page, block, or documentation task"
user-invocable: true
---

# Docsector Documentation Authoring

## When to Use

Use this skill when creating, reviewing, or editing documentation for a site built with Docsector Reader.

Use it for:

- Choosing the right Docsector block for a content need.
- Writing Markdown pages with Docsector custom elements.
- Creating overview, showcase, guide, API reference, changelog, or landing content.
- Finding live Docsector docs through MCP, WebMCP, Markdown negotiation, or `llms.txt`.
- Teaching an AI assistant how Docsector pages, blocks, and examples are authored.

## Expected Outcome

- The page uses standard Markdown where Markdown is enough.
- Rich interactions use the appropriate Docsector custom element.
- Links, assets, examples, and API JSON use Docsector conventions.
- The result is easy to scan, accessible, and friendly to both humans and agents.
- When MCP or WebMCP is available, current Docsector documentation is queried instead of relying only on memory.

## Authoring Workflow

1. Identify the page purpose: concept, tutorial, API reference, release note, navigation hub, example showcase, or troubleshooting guide.
2. Use headings to shape the reading path. In normal page content, start with `##` because the page title is supplied by metadata.
3. Pick the simplest block that communicates the content. Prefer Markdown first, then Docsector custom elements when the layout or interaction needs it.
4. Keep custom element attributes short and explicit. Use `to` for internal navigation and `href` for external URLs.
5. Put reusable assets in stable public paths such as `/images/...`, `/files/...`, `/api/...`, or `/quasar-api/...`.
6. For live examples, place Vue SFCs under `src/examples/**/*.vue` and reference them with `<d-block-code-example>`.
7. For API references, serve JSON from a same-origin public asset and reference it with `<d-block-api>`.
8. Validate links, anchors, code fences, and custom element closing tags before finishing.

## Quick Block Selection

| Need                            | Use                      |
| ------------------------------- | ------------------------ |
| Narrative text                  | Paragraphs               |
| Page sections and anchors       | Headings                 |
| Features or requirements        | Unordered lists          |
| Sequential instructions         | Ordered lists or Stepper |
| Progress states                 | Task lists               |
| Notes, tips, warnings           | Hints                    |
| Quoted text                     | Quotes                   |
| Commands or source snippets     | Code blocks              |
| Live Vue demos                  | Code examples            |
| Flowcharts or diagrams          | Mermaid diagrams         |
| Screenshots or diagrams         | Images                   |
| Downloads                       | Files                    |
| Videos, audio, or pens          | Embedded URLs            |
| Equations                       | Math and TeX             |
| Optional detail                 | Expandable               |
| Guided sequence with navigation | Stepper                  |
| Changelog or release log        | Timeline                 |
| Comparisons or matrices         | Tables                   |
| Custom structure                | Raw HTML                 |
| Small navigation sets           | Quick Links              |
| Visual navigation grids         | Cards                    |
| Structured API docs             | API Reference            |

For the complete syntax and guidance, read [the block catalog](./references/block-catalog.md).

## MCP and WebMCP

When a Docsector site exposes MCP, prefer live lookup for exact syntax and current examples.

Typical MCP tools are named with the configured suffix:

- `search_{suffix}` searches documentation pages.
- `get_page_{suffix}` returns raw Markdown for a documentation page.

This repository uses the suffix `docsector`, so the local docs tools are expected to be `search_docsector` and `get_page_docsector` when the MCP server is connected.

Use known paths such as:

- `manual/content/blocks/cards/overview`
- `manual/content/blocks/quick-links/overview`
- `manual/content/blocks/api-reference/overview`
- `manual/content/blocks/timeline/showcase`

Browser agents may also see WebMCP tools such as `docs.search_docs`, `docs.get_page`, `docs.navigate_to`, and `docs.copy_current_page`.

Read [MCP and WebMCP reference](./references/mcp-webmcp.md) for details and caveats.

## Page and Asset Conventions

Read [page structure reference](./references/page-structure.md) before changing page layout, localization, examples, or public assets.

Key conventions:

- Manual block docs live under `src/pages/manual/content/blocks/`.
- Block pages usually have `overview` and `showcase` subpages.
- Localized source files use suffixes such as `.en-US.md` and `.pt-BR.md`.
- Downloadable files should use `/files/...` paths backed by `public/files/...`.
- Images should use `/images/...` paths backed by `public/images/...`.
- API JSON should use same-origin public paths such as `/api/...` or `/quasar-api/...`.

## Authoring Patterns

Read [authoring patterns](./references/authoring-patterns.md) for common page recipes such as tutorials, changelogs, navigation hubs, API reference pages, and example showcases.

## Quality Checklist

- The page has a clear first section and predictable heading hierarchy.
- Every custom element has required attributes and matching closing tags unless it is intentionally self-closing.
- Internal links use route paths and external links use absolute URLs.
- Images, files, examples, and API JSON point to assets that exist or are intentionally external.
- Hints are reserved for semantic callouts, not general decoration.
- Tables are not overloaded with prose that would read better as sections or lists.
- Nested custom blocks are used conservatively; avoid unsupported nested Expandable and Stepper patterns.
- MCP or WebMCP was used for current docs when available.
