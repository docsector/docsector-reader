## Overview

Docsector Reader ships a public authoring skill for AI agents that need to understand how Docsector documentation works.

The skill is a `SKILL.md` file with companion references. It explains Docsector Markdown conventions, every documented block, page structure, asset paths, authoring patterns, MCP lookup, and WebMCP browser tools.

## Public URLs

The built-in skill is published as a static artifact:

```text
/.well-known/agent-skills/docsector-documentation-authoring/SKILL.md
```

The discovery index points agents to the same file and includes a SHA-256 digest:

```text
/.well-known/agent-skills/index.json
```

## What the Skill Contains

<d-block-quick-links title="Skill references">
  <d-block-quick-link
    title="SKILL.md"
    description="The compact workflow agents load first"
    href="/.well-known/agent-skills/docsector-documentation-authoring/SKILL.md"
  />
  <d-block-quick-link
    title="Block catalog"
    description="All Docsector blocks, syntax, and when-to-use guidance"
    href="/.well-known/agent-skills/docsector-documentation-authoring/references/block-catalog.md"
  />
  <d-block-quick-link
    title="Page structure"
    description="Page files, locales, assets, examples, and API JSON conventions"
    href="/.well-known/agent-skills/docsector-documentation-authoring/references/page-structure.md"
  />
  <d-block-quick-link
    title="MCP and WebMCP"
    description="How agents can search, fetch, navigate, and copy live docs"
    href="/.well-known/agent-skills/docsector-documentation-authoring/references/mcp-webmcp.md"
  />
</d-block-quick-links>

## Local and Published Copies

Docsector keeps two synchronized copies of the same skill:

- `.github/skills/docsector-documentation-authoring/` for repository-local assistants such as GitHub Copilot in VS Code.
- `public/.well-known/agent-skills/docsector-documentation-authoring/` for the built documentation site.

During build, Docsector copies the public artifact into `dist/spa/.well-known/agent-skills/` and generates the discovery index.

## How Agents Should Use It

Agents should load `SKILL.md` first, then open reference files only when a task needs more detail.

For current page examples, agents can combine the skill with Docsector's MCP tools:

```text
search_docsector
get_page_docsector
```

Browser agents can also use WebMCP tools when `navigator.modelContext` is available:

- `docs.search_docs`
- `docs.get_page`
- `docs.navigate_to`
- `docs.copy_current_page`

## When to Publish Your Own Skill

Publish a project-specific skill when your documentation has domain rules that are not covered by the built-in Docsector authoring skill.

Use Docsector's `agentSkills` config to expose the skill through `/.well-known/agent-skills/index.json`, and keep the artifact under `public/.well-known/agent-skills/...` when you want Docsector to compute the digest automatically.
