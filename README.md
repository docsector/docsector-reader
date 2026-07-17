<p align="center">
  <img src="https://github.com/docsector.png" alt="docsector-logo" width="120px" height="120px"/>
</p>
<h1 align="center">Docsector Reader 📖</h1>
<p align="center">
  <i>A documentation rendering engine built with Vue 3, Quasar v2 and Vite with AI features.</i>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@docsector/docsector-reader">
    <img alt="npm version" src="https://img.shields.io/npm/v/@docsector/docsector-reader?color=blue&label=npm"/>
  </a>
  <a href="https://github.com/docsector/docsector-reader/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/github/license/docsector/docsector-reader"/>
  </a>
</p>

Transform Markdown content into beautiful, navigable documentation sites — with i18n, syntax highlighting, OS-aware dark/light theming, and anchor navigation.

---

## 🤖 AI-Friendly Features

- 📋 **Copy Page** — One-click button copies the current page as raw Markdown, ready to paste into LLMs
- 📄 **View as Markdown** — Open any page as plain text by appending `.md` to the URL, with locale support (`?lang=`)
- 🧠 **Markdown Negotiation** — Requests with `Accept: text/markdown` receive markdown responses, while browsers keep HTML by default
- 🔐 **Web Bot Auth Directory** — Optional signed JWKS directory at `/.well-known/http-message-signatures-directory` for bot identity verification
- 🤖 **Open in ChatGPT / Claude** — One-click links to open the current page directly in ChatGPT or Claude for Q&A
- 🤖 **LLM Bot Detection** — Automatically serves raw Markdown to known AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Cloudflare-AI-Search, GrokBot, and others)
- 🗺️ **Sitemap Generation** — Automatic `sitemap.xml` generation at build time with root-relative URLs by default and absolute URLs when `siteUrl` is configured
- 🤖 **AI-Friendly robots.txt** — Scaffold includes a `robots.txt` explicitly allowing 24 AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Cloudflare-AI-Search, GrokBot, etc.), and the build appends `Sitemap: /sitemap.xml` at the end for crawler discovery
- 🧭 **Content Signals** — Optional `Content-Signal` directive for declaring AI usage policy (`ai-train`, `search`, `ai-input`) in `robots.txt`
- 🧩 **Agent Skills Discovery Index** — Optional `/.well-known/agent-skills/index.json` with RFC v0.2.0 schema and SHA-256 digests
- ✍️ **Docsector Authoring Skill** — Publishable `SKILL.md` that teaches agents Docsector blocks, page patterns, MCP lookup, and WebMCP tools
- 🪪 **MCP Server Card** — Optional `/.well-known/mcp/server-card.json` for MCP server discovery before connection
- 🌐 **WebMCP Browser Tools** — Optional registration of in-page tools via `navigator.modelContext` for browser agents
- 🤖 **AI Assistant Panel** — Optional documentation assistant drawer backed by Cloudflare AI Search through an internal same-origin endpoint, with an opt-in page-context toggle in the composer
- 🗂️ **API Catalog Well-Known** — Auto-generates `/.well-known/api-catalog` as Linkset JSON for machine-readable API discovery
- 🔗 **Homepage Link Headers** — Auto-generated `Link` response headers for agent discovery (`api-catalog`, `service-doc`, `service-desc`, `describedby`) per RFC 8288 / RFC 9727
- ⚡ **Early Hints (103)** — Per-book `Link` preload rules in `_headers` expose each route's critical request wave so Cloudflare can 103-hint it before the HTML body arrives
- 🔌 **MCP Server** — Auto-generated [MCP](https://modelcontextprotocol.io) server at `/mcp` for AI assistant integration (Claude Desktop, VS Code, etc.)
- 📄 **llms.txt / llms-full.txt** — Auto-generated [llms.txt](https://llmstxt.org) index and full-content file for LLM discovery (requires `siteUrl` in config)

---

## ✨ Features

- 📝 **Markdown Rendering** — Write docs in Markdown, rendered with syntax highlighting (Prism.js)
- ⚡ **Build-Time Page Compilation** — Pages are tokenized at build into ready-to-render modules (math pre-rendered with KaTeX), keeping the markdown engine out of the client's critical path
- 🚀 **Progressive Page Mounting** — The first blocks of a page render synchronously and the below-the-fold rest appends in idle batches, keeping the main thread responsive
- 🌐 **Per-Locale Static Markdown** — The build emits `<route>.<lang>.md` files so copy-page and agent tools fetch pristine localized sources
- 📋 **Clickable Inline Code** — Backtick-rendered inline code snippets are clickable across pages, subpages, and AI assistant answers
- 🔽 **Nested Markdown Lists** — Ordered and unordered lists preserve sublist hierarchy across multiple indentation levels
- ☑️ **Markdown Task Lists** — GitBook-style `- [ ]` and `- [x]` items render as read-only checkboxes with nested subtasks
- ⌨️ **Keyboard Shortcut Keycaps** — Author GitBook-style shortcuts with raw `<kbd>...</kbd>` tags, rendered consistently across docs and AI assistant answers
- 🖼️ **Block Image Captions & Zoom** — Standalone Markdown images render as zoomable figures, and raw `figure` / `picture` markup supports separate alt text and captions
- 🧱 **Raw HTML in Markdown** — Renders inline and block HTML tags inside markdown sections (including homepage remote README content)
- 🧩 **Mermaid Diagrams** — Native support for fenced ` ```mermaid ` blocks, with diagrams re-rendered to match the active theme
- ➗ **Math & KaTeX** — Native support for inline `$...$` and display `$$...$$` formulas rendered with KaTeX
- 🚨 **GitHub-Style Alerts** — Native support for `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, and `[!CAUTION]`
- 🌍 **Internationalization (i18n)** — Multi-language support with HJSON locale files and per-page translations
- 🌗 **Auto / Light / Dark Theme** — Follows the reader's operating system colour scheme by default via `prefers-color-scheme`, switching live when the OS flips; Light and Dark pin the theme instead, persisted under `setting.theme` (migrated from the pre-4.16 boolean). A pre-paint inline script applies the theme before the first paint, so there is no flash — localized via `settings.appearance.theme.*`, no configuration needed
- 🧰 **Docsector CLI Skill Installer** — Install the built-in authoring skill into older scaffolds with `docsector install-skill`
- 🔗 **Anchor Navigation** — Right-side source-ordered Table of Contents tree with stable scroll tracking, resize-safe drawer state, auto-scroll to the active section, and active-heading resolution based on the last heading that crossed the content threshold
- 🖱️ **Active Menu Item UX** — Active menu entries keep pointer cursor, clear URL hash without redundant navigation, and prevent accidental label text selection
- ➖ **Explicit Menu Item Separators** — `menu.separators: { lineTop, lineBottom }` spells out whether the line renders above or below the item (values can name thickness variants like `'page'`/`'list'`); the legacy `menu.separator` form remains supported as a line below
- 🔻 **Bottom-Pinned Social Links** — The menu's social links bar (Website, Email, Chat, Discussions, GitHub) is pinned to the bottom of the sidebar for constant access on mobile and while a documentation page is open — the project website button is opt-in via `links.website`
- ⭐ **GitHub Stars Badge** — Optional star-count badge on the menu's GitHub button, opt-in via `github.stars` and derived from `links.github`, using the unauthenticated GitHub API cached for 6h in localStorage
- 🔎 **Search** — Menu search across all documentation content and tags
- ⚡ **On-Demand Page Content** — Page markdown stays out of the boot bundle: each page's sources (all locales) merge into vue-i18n at navigation time, sidebar content search reads per-locale `search-index.<lang>.json` files emitted at build, and KaTeX plus the file-icon map load only when a page needs them — cutting megabytes of boot JavaScript on large sites
- 🎨 **Tree-Shaken SVG Icons** — No icon webfonts: the build scans the engine, your page registry/markdown and `docsector.config.js` for material icon names and bundles only those as SVGs (dynamic `icon:` names keep working through Quasar's `iconMapFn`); fully computed names can be forced via `icons: { include: [...] }`
- 🔡 **Self-Hosted Variable Roboto** — One variable woff2 covers every weight (replacing six ~25 KB static `.woff` files), split into `latin` / `latin-ext` `unicode-range` subsets so extended glyphs only download when used, with `font-display: optional` for a shift-free first paint — ~45% less font weight on the critical path
- 💬 **Assistant Chat UX Enhancements** — Long conversations keep focus on recent messages, load earlier history progressively, deduplicate repeated sources, preserve the assistant panel open state across reloads, include per-message copy actions and hover-revealed message times, and show a floating quick return to the bottom
- 📱 **Responsive** — Mobile-friendly with collapsible sidebar and drawers
- 🏷️ **Clickable Header Branding** — The configured `branding.logo` and `branding.name` render as a home link in the global header, aligned left on desktop with a compact mobile treatment
- 📖 **Localized Brand Lockup** — The header and menu render `branding.name` together with the word *Documentation* through the `system.brand` i18n key, where each locale owns the full phrase and its word order (`{name} Documentation` in `en-US`, `Documentação {name}` in `pt-BR`); override the key in your own language files to reword it
- 🔄 **Update Notification** — Production builds stamp a build ID (Cloudflare Pages commit SHA, `DOCSECTOR_BUILD_ID`, or a per-build timestamp) into the bundle and into an emitted `version.json` (with a `Cache-Control: no-cache` `_headers` rule); open tabs poll it while visible and on re-focus, showing a high-contrast floating **Refresh** / **Dismiss** banner at the bottom center (inverse surface, dark/light aware) when a newer deploy is live — localized via `system.update.*`, tunable or disabled via the `updates` config key
- ♻️ **Stale Chunk Auto-Recovery** — When a redeploy removes the hashed chunks a stale session still references, failed lazy route imports (`router.onError` + `vite:preloadError`) trigger a full-page reload straight to the intended route, with a session guard that falls back to the update banner instead of reload-looping on a broken deploy
- 📚 **Book Tabs with Per-State Colors** — Define `*.book.js` tabs with icons, order, and `color.active` / `color.inactive`
- 📐 **Book Layout Presets** — Configure books with the default documentation chrome or a `fullwidth` layout that keeps the header and book tabs while removing the sidebar, subpage toolbar, and Table of Contents
- 🦶 **Global Branding Footer** — Built-in `Powered by Docsector` footer (Docsector logo + wordmark, bundled from the engine so it never resolves to a consumer asset) renders across documentation and system pages, while respecting each page's own scroll container for full-width layout integration without double scrollbars
- ⚖️ **Footer Legal Links** — Opt-in row of legal / compliance links (Privacy, Cookies, License, …) rendered above the footer credit, configured via `footer.legalLinks` with plain-string or per-locale labels and automatic new-tab handling for external URLs
- 🔀 **Internal Shortcut Pages** — Route entries can redirect with `config.link.to`, keeping localized titles while inheriting icon/status from the destination page
- 📐 **Responsive Subpage Toolbar** — Subpage actions align with the content column on desktop and pin to the top (below the book tabs) on mobile, with full-height active tabs
- 🆚 **Subpage Templates** — Subpages opt into a structured template via `vs: { template: 'vs' }`; the managed/strict `vs` template owns the order and localized titles of its **Features**, **Performance** and **Security** sections (one `##` heading per section, missing sections dropped gracefully), auto-colorizes `✓`/`✗`/`➕` comparison marks, and highlights the column (by header) or row (by first cell) that matches the consumer's `branding.name`
- ⬆️ **Reading Progress Back to Top** — Documentation subpages can show a floating back-to-top control with circular reading progress in the bottom corner
- 🏷️ **Status Badges** — Mark pages as `done`, `draft`, `empty`, or `new` with visual indicators
- ✏️ **Edit on GitHub** — Direct links to edit pages on your repository
- 🧭 **Robust Edit Link Mapping** — Normalizes route paths (including trailing slashes) into `page.subpage.locale.md` source files for reliable GitHub edit URLs
- 📅 **Last Updated Date** — Automatic per-page "last updated" date from git commit history, locale-formatted
- 📊 **Translation Progress** — Automatic translation percentage based on header coverage
- 🌐 **Accurate Available Translations** — Locale availability counter now uses actual localized page source presence, avoiding false negatives when metadata is equal
- 🏠 **Markdown Home at Root** — Homepage is rendered from `src/pages/Homepage.{lang}.md` directly at `/`
- 🧱 **Configurable Homepage Layout** — Set `homePage.layout` to `default` or `fullwidth`; fullwidth keeps the header and book tabs while removing the sidebar, subpage toolbar, Table of Contents, and homepage footer
- 🌍 **Remote README as Home** — Optional build-time remote README source for homepage with automatic local fallback and automatic primary-title handoff when the remote README already provides the project heading
- 🔗 **GitHub-Compatible Heading Anchors** — Markdown headings use GitHub-style slugs so standard README Table of Contents links work inside Docsector
- 📖 **Expandable Markdown Sections** — Use `<d-block-expandable title="...">...</d-block-expandable>` to collapse secondary content while keeping rich Markdown support inside the body; titles render inline Markdown (backtick code becomes a styled chip), including for native `<details><summary>` blocks normalized from READMEs
- 1️⃣ **Stepper Guides** — Use `<d-block-stepper>` with nested `<d-block-step title="...">...</d-block-step>` items to render native Quasar vertical steppers with rich Markdown and optional per-step icon overrides
- 🕒 **Timeline Updates** — Use `<d-block-timeline>` with nested `<d-block-timeline-item date="...">...</d-block-timeline-item>` entries and optional `<d-block-timeline-tag>` labels to publish GitBook-inspired changelog items with direct-link anchors, tag icons/colors, and rich Markdown bodies
- 📎 **File Attachment Blocks** — Use `<d-block-file src="/files/...">...</d-block-file>` in Markdown to render downloadable file cards with automatic local size detection and support for external URLs
- 🌐 **Embedded URL Blocks** — Use `<d-block-embedded-url url="https://...">...</d-block-embedded-url>` to render curated embeds for YouTube, Vimeo, Spotify, and CodePen with a safe link-card fallback for unsupported URLs
- 🧭 **Quick Links Custom Element** — Use `<d-block-quick-links>` and `<d-block-quick-link>` in Markdown to render rich home navigation cards
- 🗂️ **Cards Custom Element** — Use `<d-block-cards>` and `<d-block-card>` in Markdown to render linked content cards with optional cover images
- 🧾 **API JSON Reference Block** — Use `<d-block-api src="..." />` in Markdown to render Quasar-compatible API reference UIs from public JSON assets without inventing a new schema
- 🧠 **Docsector Authoring Skill Docs** — Documents the built-in `SKILL.md` and reference files so agents can learn Docsector blocks, page patterns, MCP lookup, and WebMCP tools from a public manual page
- 🗃️ **Multi-Version History** — Archive older major versions under `src/pages/.old/<version>/` and expose them at prefixed routes (e.g. `/v0.x/guide/...`) while keeping the current docs at unprefixed routes
- 🏷️ **Version Selector Badges** — Every version in the sidebar selector displays a color-coded badge: green for released, orange for draft, red for deprecated; fully customizable via `badge: { label, color, textColor }`
- 📂 **Tabbed Code Blocks** — Group consecutive fenced code blocks into tabs using the `group` and `tab` attributes in the fence info line
- 🧪 **Live Code Example Blocks** — Use `<d-block-code-example src="..." />` to render bundled Vue SFC examples with a live preview, GitHub source link, source toggle, and CodePen export for compatible examples
- 🖥️ **Live Terminal Blocks** — Use `<d-block-terminal engine="..." />` to embed a runnable xterm.js terminal driven by a project-provided engine (`src/terminals/**/*.js`) — e.g. a PHP-WASM CLI — with streaming ANSI output, interactive click-to-focus input, deep-linkable command tabs (`?t<n>` survives reloads), source panel, lazy runtime loading, and a mobile-safe column floor (`min-columns`, default 80): narrow screens pan the terminal horizontally instead of wrapping TUI layouts
- 🧰 **Code Block Toolbar Override** — The metadata row (language label + copy button) follows the content by default — shown on multi-line, tabbed or breadcrumbed blocks, hidden on single-line ones — and the `toolbar` fence attribute overrides it both ways: `:toolbar="true";` opts a one-line command in, `:toolbar="false";` strips it from any block; on remote-README home pages (which cannot carry fence attributes) the row defaults ON for every block
- 🍞 **Breadcrumb Path Display** — Show a file path breadcrumb above code blocks with the `breadcrumb` attribute; renders as clickable path segments
- 🎨 **File Type Icons** — Automatically resolves file extension or filename to a Material Icon Theme SVG icon, shown inline in tabs and beside the last breadcrumb segment
- ⚙️ **Single Config File** — Customize branding, links, and languages via `docsector.config.js`

---

## 🔌 MCP Server (Model Context Protocol)

Docsector Reader can automatically generate an [MCP](https://modelcontextprotocol.io) server at `/mcp` during build, allowing AI assistants like Claude to search and read your documentation in real time.

### Enable MCP

Add `mcp` to your `docsector.config.js`:

```javascript
export default {
  // ... other config ...

  mcp: {
    serverName: 'my-docs',       // MCP server identifier
    toolSuffix: 'my_docs'        // Tool name suffix (e.g. search_my_docs)
  },

  siteUrl: 'https://my-docs.example.com'  // Required for MCP URLs
}
```

### What the build generates

When `mcp` is configured, `docsector build` generates:

| File | Purpose |
|---|---|
| `dist/spa/mcp-pages.json` | Page index (title, path, book) for search |
| `functions/mcp.js` | Cloudflare Pages Function implementing MCP |
| `dist/spa/_routes.json` | Routes `/mcp` to the function |
| `dist/spa/_headers` | CORS headers for MCP endpoint |

### Exposed tools

| Tool | Description |
|---|---|
| `search_{suffix}` | Search documentation by keyword, returns matching pages |
| `get_page_{suffix}` | Get full Markdown content of a specific page |

### Test locally

```bash
npx docsector build
npx wrangler pages dev dist/spa

# In another terminal:
curl http://localhost:8788/mcp
curl -X POST http://localhost:8788/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Configure in AI assistants

**VS Code** (`mcp.json`):
```json
{
  "servers": {
    "my-docs": {
      "type": "http",
      "url": "https://my-docs.example.com/mcp"
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "my-docs": {
      "type": "url",
      "url": "https://my-docs.example.com/mcp"
    }
  }
}
```

---

## 🪪 MCP Server Card Discovery

Docsector Reader can publish an MCP Server Card at:

- `/.well-known/mcp/server-card.json`

This supports pre-connection MCP discovery, exposing:

- `serverInfo` (`name`, `version`)
- MCP transport endpoint (defaults to `/mcp`)
- `capabilities` for tools/resources/prompts

When MCP is enabled, tool capabilities are derived from the generated server:

- `search_{toolSuffix}`
- `get_page_{toolSuffix}`

### Configure

```javascript
export default {
  // ...other config

  mcp: {
    serverName: 'my-docs',
    toolSuffix: 'my_docs'
  },

  mcpServerCard: {
    enabled: true,
    path: '/.well-known/mcp/server-card.json',
    transportEndpoint: '/mcp',
    transportType: 'streamable-http',
    protocolVersion: '2025-03-26',
    capabilities: {
      tools: { supported: true },
      resources: { supported: false },
      prompts: { supported: false }
    }
  }
}
```

### Validate

```bash
npx docsector build
cat dist/spa/.well-known/mcp/server-card.json
cat dist/spa/_headers
```

External validation:

```bash
curl -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://YOUR-SITE.com"}'
```

Check `checks.discovery.mcpServerCard.status` equals `"pass"`.

---

## 🌐 WebMCP Browser Tools

Docsector Reader can register browser-side tools for agents when
`navigator.modelContext` is available (secure context required).

Default tools:

- `docs.search_docs` (bridges to MCP `search_{toolSuffix}`)
- `docs.get_page` (bridges to MCP `get_page_{toolSuffix}`)
- `docs.navigate_to` (SPA navigation)
- `docs.copy_current_page` (current page markdown URL/content)

### WebMCP Configure

```javascript
export default {
  // ...other config

  mcp: {
    serverName: 'my-docs',
    toolSuffix: 'my_docs'
  },

  webMcp: {
    enabled: true,
    apiMode: 'dual', // 'registerTool' | 'dual'
    toolPrefix: 'docs',
    bridgeEndpoint: '/mcp',
    bridgeToMcp: true,
    tools: {
      searchDocs: true,
      getPage: true,
      navigateTo: true,
      copyCurrentPage: true
    }
  }
}
```

Notes:

- `apiMode: 'registerTool'` uses only `navigator.modelContext.registerTool()`.
- `apiMode: 'dual'` also attempts `provideContext` fallback when available.
- Registration happens on page load and is automatically cleaned up on unmount.

### WebMCP Validate

```bash
curl -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://YOUR-SITE.com"}'
```

Check `checks.discovery.webMcp.status` equals `"pass"`.

---

## 🤖 AI Assistant Panel

Docsector Reader can add an opt-in assistant panel for documentation Q&A. Users open it from the global header while reading pages and subpages; it is not a dedicated documentation route. The drawer posts to a same-origin Cloudflare Pages Function, and that function calls Cloudflare AI Search so secrets, rate-limit strategy, provider errors, and future auth stay server-side.

The panel is disabled by default. When enabled, desktop pages get a dedicated right-side assistant rail that can sit beside the table of contents on wide screens. Mobile uses a fullscreen dialog. Conversations restore at the latest message, reveal earlier history progressively in long chats, deduplicate repeated source links, preserve the panel open state across page reloads, and provide per-message copy actions with hover-revealed message times.

### Configure

```javascript
export default {
  // ...other config

  siteUrl: 'https://my-docs.example.com',

  aiAssistant: {
    enabled: true,
    provider: 'aiSearch',
    endpoint: '/assistant',
    ui: {
      title: 'Docs Assistant',
      drawerWidth: 380,
      wideBreakpoint: 1280,
      showCitations: true,
      // A prompt is a plain string, or an object when it only makes sense with
      // the current page attached — clicking it turns the page-context chip on.
      suggestedPrompts: [
        'How do I get started?',
        { text: 'Summarize this page.', pageContext: true },
        'Where is the related API reference?'
      ]
    },
    aiSearch: {
      binding: 'AI_SEARCH',
      instanceNameEnv: 'AI_SEARCH_INSTANCE_NAME',
      accountIdEnv: 'CLOUDFLARE_ACCOUNT_ID',
      apiTokenEnv: 'CLOUDFLARE_API_TOKEN',
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      retrievalType: 'vector',
      maxResults: 10,
      matchThreshold: 0.4,
      contextExpansion: 1,
      queryRewrite: { enabled: true },
      reranking: { enabled: false },
      stream: true
    }
  }
}
```

### Cloudflare setup

Use Cloudflare AI Search as the first provider path:

- Create an AI Search instance in Cloudflare.
- Build and deploy the Docsector site first; build output always publishes `/sitemap.xml` and appends `Sitemap: /sitemap.xml` to the end of `robots.txt` for crawler discovery.
- Use a Website data source. For the cleanest retrieval, point its specific sitemap to `/ai-search-sitemap.xml`. Docsector keeps that Markdown-focused sitemap available for explicit AI Search configuration, but does not auto-announce it from `robots.txt` so Cloudflare does not index the same content twice alongside `/sitemap.xml`.
- Add metadata fields such as title, path, locale, book, version, and subpage if you want filtering later.
- Set `AI_SEARCH_INSTANCE_NAME` as a Cloudflare Pages environment variable or local `.dev.vars` entry.
- Bind the instance to Pages as `AI_SEARCH` when available, or set encrypted Pages secrets for `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` with AI Search run access.
- Keep AI Search public endpoints optional; the built-in UI uses the configured internal endpoint by default.

### Build output

When enabled, `docsector build` can generate:

| File | Purpose |
|---|---|
| `functions/assistant.js` | Cloudflare Pages Function for browser assistant requests |
| `dist/spa/sitemap.xml` | Default crawler sitemap advertised from `robots.txt` |
| `dist/spa/robots.txt` | Crawler policy with `Sitemap: /sitemap.xml` |
| `dist/spa/ai-search-sitemap.xml` | Markdown-focused sitemap for explicit AI Search Website data source configuration |
| `dist/spa/.well-known/ai-search/manifest.json` | Source metadata for indexed documentation pages |
| `dist/spa/_routes.json` | Routes the internal assistant endpoint to the Pages Function |

### Validate

```bash
npx docsector build
cat dist/spa/sitemap.xml
cat dist/spa/robots.txt
cat dist/spa/ai-search-sitemap.xml
cat dist/spa/.well-known/ai-search/manifest.json
npx wrangler pages dev dist/spa
```

Workers AI, AI Search, and remote bindings can incur Cloudflare usage during local development.

### Environment variables quick guide

Docsector now ships `.env.example` so teams can standardize Cloudflare variables.

Use the right place for each environment:

- Cloudflare Pages production/preview: set vars in Pages settings (recommended).
- Local `wrangler pages dev`: use `.dev.vars` for Function runtime variables.
- Local Node-based tools: `.env` works when your runner actually loads it.

Minimum variables when not using direct AI Search binding:

```bash
AI_SEARCH_INSTANCE_NAME=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

If you bind AI Search as `AI_SEARCH`, the Assistant tries binding first and uses REST fallback when binding is not available.

---

## � llms.txt (LLM Discovery)

Docsector Reader automatically generates [llms.txt](https://llmstxt.org) files at build time when `siteUrl` is configured. `sitemap.xml` is generated even without `siteUrl`; `llms.txt` keeps the `siteUrl` requirement because it contains absolute Markdown links.

| File | Purpose |
|---|---|
| `/llms.txt` | Markdown index of all pages with links to `.md` versions, grouped by type |
| `/llms-full.txt` | Full documentation content concatenated in a single file for LLM context |

Optionally add a `description` to your branding for a richer `llms.txt` blockquote:

```javascript
export default {
  branding: {
    name: 'My Project',
    version: 'v1.0.0',
    description: 'A framework for building awesome things'
  },
  siteUrl: 'https://my-docs.example.com'
}
```

---

## 🔗 Link Headers (Agent Discovery)

Docsector Reader adds homepage `Link` response headers at build time for agent discovery, following [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) and [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727#section-3).

Default relations emitted on homepage (`/` and `/index.html`):

- `rel="api-catalog"` → `</.well-known/api-catalog>`
- `rel="service-doc"` → `</>`
- `rel="service-desc"` → `</mcp>` (only when `mcp` is enabled)
- `rel="describedby"` → `</llms.txt>` (only when `siteUrl` is configured, i.e. `llms.txt` is generated)

Generated in:

- `dist/spa/_headers`
- `dist/spa/.well-known/api-catalog` (Linkset JSON)

### Optional configuration

```javascript
export default {
  // ...other config

  linkHeaders: {
    enabled: true,
    apiCatalog: '/.well-known/api-catalog',
    serviceDoc: '/',
    serviceDesc: '/mcp',
    describedBy: '/llms.txt'
  },

  apiCatalog: {
    enabled: true,
    path: '/.well-known/api-catalog',
    items: [
      '/mcp',
      'https://api.example.com/openapi.json'
    ]
  }
}
```

Set any target to `null` or `false` to disable that relation.

---

## 🏠 Remote README as Home

You can configure Docsector Reader to use a remote README as homepage content.

- Fetch happens at build-time.
- The same README content is used for all configured languages.
- The homepage uses the `default` layout unless `homePage.layout` is set to `fullwidth`.
- `homePage.layout` accepts only `default` and `fullwidth`.
- The `fullwidth` homepage layout keeps the global header and book tabs, but removes the sidebar, subpage toolbar, Table of Contents, and homepage footer.
- When the remote README resolves successfully, Docsector hides the autogenerated homepage title and uses the README's own primary heading in the rendered content.
- If fetch fails, it falls back to local `src/pages/Homepage.{lang}.md` by default and keeps the usual autogenerated homepage title.
- Standard GitHub-style heading links and README Table of Contents fragments keep working in the rendered homepage.

### Configure

```javascript
export default {
  // ...other config

  homePage: {
    source: 'remote-readme',
    layout: 'fullwidth',
    remoteReadmeUrl: 'https://raw.githubusercontent.com/your-org/your-repo/main/README.md',
    timeoutMs: 8000,
    fallbackToLocal: true
  }
}
```

### Validate

```bash
npx docsector build
cat dist/spa/homepage.md
cat dist/spa/homepage.en-US.md
```

---

## 🔐 Web Bot Auth

Docsector Reader can publish a signed Web Bot Auth directory at:

- `/.well-known/http-message-signatures-directory`

This response is served by Cloudflare Pages runtime middleware and includes:

- `Content-Type: application/http-message-signatures-directory+json`
- `Signature`
- `Signature-Input`

### Configure directory publishing

```javascript
export default {
  // ...other config

  webBotAuth: {
    enabled: true,
    directoryPath: '/.well-known/http-message-signatures-directory',
    jwksEnv: 'WEB_BOT_AUTH_JWKS',
    privateJwkEnv: 'WEB_BOT_AUTH_PRIVATE_JWK',
    keyIdEnv: 'WEB_BOT_AUTH_KEY_ID',
    keyId: null,
    signatureMaxAge: 300,
    signatureLabel: 'sig1'
  }
}
```

Required runtime variables (Cloudflare Pages / Workers environment):

- `WEB_BOT_AUTH_JWKS`: JSON string with a valid JWKS payload (`{ "keys": [...] }`)
- `WEB_BOT_AUTH_PRIVATE_JWK`: JSON string for an Ed25519 private JWK used to sign directory responses
- `WEB_BOT_AUTH_KEY_ID`: optional key id override (thumbprint or `kid`)

### Sign outbound bot requests

Use the helper export:

```javascript
import { createWebBotAuthHeaders } from '@docsector/docsector-reader/web-bot-auth'

const signed = await createWebBotAuthHeaders({
  url: 'https://crawltest.com/cdn-cgi/web-bot-auth',
  privateJwk,
  keyId: 'your-jwk-thumbprint',
  signatureAgent: 'https://docs.example.com/.well-known/http-message-signatures-directory'
})
```

Attach returned headers to your outbound request (`Signature-Agent`, `Signature-Input`, `Signature`).

### Validate

```bash
npx docsector build
cat dist/spa/_headers
cat dist/spa/.well-known/api-catalog
```

Or scan discoverability:

```bash
curl -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://YOUR-SITE.com"}'
```

Check `checks.discoverability.linkHeaders.status` equals `"pass"`.

---

## 🧭 Content Signals

Docsector Reader can declare AI usage preferences in `robots.txt` via `Content-Signal`.

When enabled, build output ensures a deterministic directive format:

- `Content-Signal: ai-train=..., search=..., ai-input=...`

### Configure

```javascript
export default {
  // ...other config

  contentSignals: {
    enabled: true,
    aiTrain: 'yes',
    search: 'yes',
    aiInput: 'yes',
    userAgent: '*',
    applyToAllBlocks: false
  }
}
```

Notes:

- `aiTrain`, `search`, and `aiInput` accept `yes` / `no` (or booleans).
- Default scope is only `User-agent: *`.
- Build patch is idempotent: repeated builds do not duplicate `Content-Signal` lines.
- Build also keeps `Sitemap: /sitemap.xml` discoverable at the end of `robots.txt` so crawlers can find the generated sitemap automatically.

### Validate

```bash
npx docsector build
cat dist/spa/robots.txt
```

Optional external validation:

```bash
curl -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://YOUR-SITE.com"}'
```

Check `checks.botAccessControl.contentSignals.status` equals `"pass"`.

---

## 🧩 Agent Skills Discovery Index

Docsector Reader can publish a discovery index at:

- `/.well-known/agent-skills/index.json`

The generated payload follows Agent Skills Discovery RFC v0.2.0 and includes:

- `$schema`
- `skills[]` entries with `name`, `type`, `description`, `url`, `digest`

This repository publishes the built-in Docsector authoring skill at:

- `/.well-known/agent-skills/docsector-documentation-authoring/SKILL.md`

The skill teaches agents Docsector Markdown authoring, all documented blocks, page/source conventions, MCP lookup, and WebMCP browser tools.

For projects scaffolded before the built-in skill existed, run:

```bash
npx docsector install-skill
```

The helper copies the skill into `.github/skills/` for repository-local assistants and into `public/.well-known/agent-skills/` for published discovery. Existing folders are skipped unless `--force` is passed.

When `digest` is omitted in config, Docsector computes it automatically from the referenced local artifact and writes it as:

- `sha256:{hex}`

### Configure

```javascript
export default {
  // ...other config

  agentSkills: {
    enabled: true,
    path: '/.well-known/agent-skills/index.json',
    schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'docsector-documentation-authoring',
        type: 'skill-md',
        description: 'Author Docsector documentation with Markdown, custom blocks, MCP, and WebMCP.',
        url: '/.well-known/agent-skills/docsector-documentation-authoring/SKILL.md'
      }
    ]
  }
}
```

Notes:

- `name` must be lowercase alphanumeric plus hyphens.
- `type` must be `skill-md` or `archive`.
- `url` should point to a locally published artifact when auto-digest is used.

### Validate

```bash
npx docsector build
cat dist/spa/.well-known/agent-skills/index.json
```

External validation:

```bash
curl -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://YOUR-SITE.com"}'
```

Check `checks.discovery.agentSkills.status` equals `"pass"`.

---

## �🚀 Quick Start

### 📦 Install

```bash
npm install @docsector/docsector-reader
```

### 🏗️ Scaffold a new project

```bash
npx docsector init my-docs
cd my-docs
npm install
```

This creates a minimal project with `quasar.config.js`, `docsector.config.js`, `src/pages/`, `src/i18n/`, and `public/` — all powered by the docsector-reader engine.

The scaffolded `quasar.config.js` delegates to `createQuasarConfig()`, which registers Docsector virtual registries and keeps the engine router out of Vite dependency optimization so modules like `virtual:docsector-books` resolve during dev and build.

### 💻 Development

```bash
npx docsector dev
# or
npx quasar dev
```

### 🏭 Production Build

```bash
npx docsector build
npx docsector serve    # Preview production build
```

---

## 📐 Architecture — Library Mode

Docsector Reader works as a **rendering engine**: it provides the layout, components, router, store, and boot files. Consumer projects supply only their **content** (pages, i18n, config, assets).

```
┌───────────────────────────────────────────────────────┐
│  Consumer project (your-docs/)                        │
│  ├── docsector.config.js   ← branding, links, langs  │
│  ├── quasar.config.js      ← thin wrapper            │
│  ├── src/pages/            ← Markdown + route defs    │
│  ├── src/i18n/             ← language files + tags    │
│  └── public/               ← logo, images, icons, files │
│                                                       │
│  ┌───────────────────────────────────────────────┐    │
│  │  @docsector/docsector-reader (engine)         │    │
│  │  ├── App.vue, router, store, boot files       │    │
│  │  ├── DPage, DMenu, DH1–DH6, DefaultLayout    │    │
│  │  ├── composables (useNavigator)               │    │
│  │  └── CSS, Prism.js, QZoom                     │    │
│  └───────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

### Consumer `quasar.config.js`

The consumer's Quasar config is a thin wrapper around the factory:

```javascript
import { configure, createQuasarConfig } from '@docsector/docsector-reader/quasar-factory'

export default configure(() => {
  return createQuasarConfig({
    projectRoot: import.meta.dirname,

    // Optional: consumer-specific boot files (resolved from src/boot/)
    boot: ['qmediaplayer'],

    // Optional: PWA manifest overrides
    pwa: {
      name: 'My Docs',
      short_name: 'Docs',
      theme_color: '#027be3'
    },

    // Optional: extra Vite plugins
    vitePlugins: [],

    // Optional: extend Vite config further
    extendViteConf (viteConf) {
      // custom aliases, plugins, etc.
    }
  })
})
```

### How aliases work

| Alias | Standalone | Consumer mode |
|---|---|---|
| `components` | project `src/components/` | package `src/components/` |
| `layouts` | project `src/layouts/` | package `src/layouts/` |
| `boot` | project `src/boot/` | package `src/boot/` |
| `composables` | project `src/composables/` | package `src/composables/` |
| `css` | project `src/css/` | package `src/css/` |
| `stores` | project `src/store/` | package `src/store/` |
| `pages` | project `src/pages/` | consumer `src/pages/` |
| `src/i18n` | project `src/i18n/` | consumer `src/i18n/` |
| `docsector.config.js` | project root | consumer root |

---

## ⚙️ Configuration (`docsector.config.js`)

```javascript
export default {
  branding: {
    logo: '/images/logo/my-logo.png',
    name: 'My Project',
    version: 'v1.0.0',
    versions: [
      { id: 'v1.0.0', current: true, released: false },
      { id: 'v0.9.0', released: true, status: 'deprecated' }
    ]
  },

  links: {
    website: 'https://example.com',
    github: 'https://github.com/org/repo',
    discussions: 'https://github.com/org/repo/discussions',
    chat: 'https://discord.gg/invite',
    email: 'contact@example.com',
    changelog: 'https://github.com/org/repo/releases',
    roadmap: 'https://github.com/org/repo/blob/main/ROADMAP.md',
    sponsor: 'https://github.com/sponsors/user',
    explore: [
      { label: '🌟 Related Project', url: 'https://github.com/org/related' }
    ]
  },

  github: {
    editBaseUrl: 'https://github.com/org/repo/edit/main/src/pages'
  },

  linkHeaders: {
    enabled: true,
    apiCatalog: '/.well-known/api-catalog',
    serviceDoc: '/',
    serviceDesc: '/mcp',
    describedBy: '/llms.txt'
  },

  apiCatalog: {
    enabled: true,
    path: '/.well-known/api-catalog',
    items: []
  },

  markdownNegotiation: {
    enabled: true,
    agentFallback: true
  },

  aiAssistant: {
    enabled: false,
    provider: 'aiSearch',
    endpoint: '/assistant',
    ui: {
      title: 'Docsector Assistant',
      drawerWidth: 380,
      wideBreakpoint: 1280,
      showCitations: true
    },
    aiSearch: {
      binding: 'AI_SEARCH',
      instanceNameEnv: 'AI_SEARCH_INSTANCE_NAME',
      accountIdEnv: 'CLOUDFLARE_ACCOUNT_ID',
      apiTokenEnv: 'CLOUDFLARE_API_TOKEN',
      retrievalType: 'vector',
      maxResults: 10,
      stream: true
    }
  },

  mcpServerCard: {
    enabled: true,
    path: '/.well-known/mcp/server-card.json',
    transportEndpoint: '/mcp',
    transportType: 'streamable-http',
    protocolVersion: '2025-03-26'
  },

  contentSignals: {
    enabled: true,
    aiTrain: 'yes',
    search: 'yes',
    aiInput: 'yes',
    userAgent: '*',
    applyToAllBlocks: false
  },

  agentSkills: {
    enabled: true,
    path: '/.well-known/agent-skills/index.json',
    schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'docsector-documentation-authoring',
        type: 'skill-md',
        description: 'Author Docsector documentation with Markdown, custom blocks, MCP, and WebMCP.',
        url: '/.well-known/agent-skills/docsector-documentation-authoring/SKILL.md'
      }
    ]
  },

  languages: [
    { image: '/images/flags/united-states-of-america.png', label: 'English (US)', value: 'en-US' },
    { image: '/images/flags/brazil.png', label: 'Português (BR)', value: 'pt-BR' }
  ],

  defaultLanguage: 'en-US'
}
```

The current version keeps the normal unprefixed routes such as `/guide/getting-started/overview/`. Archived major versions can be placed under `src/pages/.old/<version>/` with the same book/index/Markdown layout, and are exposed with a URL prefix such as `/v0.x/guide/getting-started/overview/`.

Every version shows a release badge in the selector. Released versions default to `released`; versions with `released: false` or `status: 'draft'` default to `draft`; versions with `status: 'deprecated'` or `deprecated: true` default to `deprecated` in red. Use `badge: { label, color, textColor }` when you need custom badge copy or colors.

### MCP (optional)

```javascript
  // Enable MCP server at /mcp
  mcp: {
    serverName: 'my-project',   // Server identifier
    toolSuffix: 'my_project'    // Tool name suffix
  }
```

---

## 🌍 Internationalization

### i18n setup (`src/i18n/index.js`)

Consumer projects use the `buildMessages` helper from the engine:

```javascript
import { buildMessages } from '@docsector/docsector-reader/i18n'
import homePageOverride from 'virtual:docsector-homepage-override'

const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
const currentMdModules = import.meta.glob('../pages/**/*.md', { eager: true, query: '?raw', import: 'default' })
const oldMdModules = import.meta.glob('../pages/.old/**/*.md', { eager: true, query: '?raw', import: 'default' })
const mdModules = { ...currentMdModules, ...oldMdModules }

import boot from 'pages/boot'
import { books, pageEntries } from 'virtual:docsector-books'

export default buildMessages({ langModules, mdModules, books, pageEntries, boot, homePageOverride })
```

> `pageEntries` is the preferred source because it preserves per-book and per-version registries and avoids path collisions when books or archived versions reuse the same route key.

### Language files

Place HJSON locale files in `src/i18n/languages/`:

```
src/i18n/languages/en-US.hjson
src/i18n/languages/pt-BR.hjson
```

### Search tags (`src/pages/*.index.js`)

Define search keywords per page using `metadata.tags` in each book registry file:

```javascript
export default {
  '/my-section/my-page': {
    config: {
      icon: 'description',
      book: 'manual',
      status: 'done',
      subpages: { showcase: false }
    },
    data: {
      'en-US': { title: 'My Page' },
      'pt-BR': { title: 'Minha Página' }
    },
    metadata: {
      tags: {
        'en-US': 'keyword1 keyword2 keyword3',
        'pt-BR': 'palavra1 palavra2 palavra3'
      }
    }
  }
}
```

---

## 📁 Consumer Project Structure

```
my-docs/
├── docsector.config.js        # Branding, links, languages
├── quasar.config.js           # Thin wrapper using createQuasarConfig()
├── package.json
├── src/
│   ├── pages/
│   │   ├── manual.book.js     # Manual tab metadata (icon, order, active/inactive colors)
│   │   ├── manual.index.js    # Manual page registry (routes + metadata)
│   │   ├── guide.book.js      # Guide tab metadata (icon, order, active/inactive colors)
│   │   ├── guide.index.js     # Guide page registry (routes + metadata)
│   │   ├── boot.js            # Boot page data
│   │   ├── guide/             # Guide pages (.md files)
│   │   └── manual/
│   │       ├── basic/         # Core UI docs exposed in the main manual nav
│   │       ├── content/
│   │       │   ├── blocks/    # User-facing Markdown block docs
│   │       │   └── structures/ # User-facing page structure docs
│   │       └── components/    # Legacy/internal engine-facing manual docs
│   ├── i18n/
│   │   ├── index.js           # Uses buildMessages() from engine
│   │   └── languages/         # HJSON locale files
│   ├── css/
│   │   └── app.sass           # Optional overrides (imports engine CSS)
│   └── boot/                  # Consumer-specific boot files
│       └── qmediaplayer.js    # Example: custom Quasar extension
└── public/
    ├── images/logo.png        # Project logo
    ├── flags/                 # Locale flag images
    ├── icons/                 # PWA icons
    └── files/                 # Downloadable attachments served as /files/...
```

  A common manual pattern is to keep core UI references under `src/pages/manual/basic/` with user-friendly page titles and focused entry pages such as Search, Branding, Version Switcher, Edit on GitHub, Translation Progress, and Previous & Next, end-user content references under `src/pages/manual/content/blocks/`, structural docs under `src/pages/manual/content/structures/`, and legacy/internal engine-specific references under `src/pages/manual/components/`.

  Blocks in `src/pages/manual/content/blocks/` should normally provide both `overview` and `showcase` markdown pages, while structural topics can stay overview-only when a visual demo adds little value.

---

## 📚 Defining Books (Tabs)

Each documentation tab is defined by a `*.book.js` file paired with a matching `*.index.js` registry.

```javascript
import { defineBook } from '@docsector/docsector-reader'

export default defineBook({
  id: 'guide',
  label: 'Guide',
  icon: 'school',
  order: 2,
  layout: 'default',
  color: {
    active: 'white',
    inactive: 'secondary'
  }
})
```

Declare menu search tags in each page entry under `metadata.tags`:

```javascript
export default {
  '/getting-started': {
    config: {
      icon: 'flag',
      book: 'guide',
      status: 'done',
      subpages: { showcase: false }
    },
    data: {
      'en-US': { title: 'Getting Started' },
      'pt-BR': { title: 'Começando' }
    },
    metadata: {
      tags: {
        'en-US': 'install setup start begin quick project structure',
        'pt-BR': 'instalar configurar iniciar começar rápido projeto estrutura'
      }
    }
  }
}
```

Notes:

- `color.active` and `color.inactive` control the tab text color for each state.
- Color values accept Quasar tokens (`secondary`, `red-6`), CSS variables (`--brand-color` or `var(--brand-color)`), and plain CSS colors (`white`, `#fff`, `rgb(...)`).
- Legacy `color: 'secondary'` still works, but the object form is the recommended API.
- `layout: 'default'` keeps the standard documentation chrome with sidebar, subpage toolbar, and Table of Contents.
- `layout: 'fullwidth'` keeps the global header and book tabs, but removes the book sidebar, subpage toolbar, and Table of Contents for pages in that book.
- Tabs are ordered by `order`.

---

## 📄 Adding Pages

1️⃣ Register in `src/pages/manual.index.js` (or `src/pages/guide.index.js`):

```javascript
import { definePage } from '@docsector/docsector-reader'

export default {
  '/my-section/my-page': definePage({
    config: {
      icon: 'description',
      status: 'new',         // 'done' | 'draft' | 'empty' | 'new'
      version: 'v2.1.0',     // Optional: shown as "New in" / "Novo em"
      menu: {
        header: { label: '.my-section', icon: 'category' }
      },
      subpages: { showcase: false, vs: false }
    },
    data: {
      'en-US': { title: 'My Page' },
      'pt-BR': { title: 'Minha Página' }
    }
  })
}
```

Notes:

- In `manual.index.js`, route keys are relative to the `manual` book (for example `'/my-section/my-page'` becomes `/manual/my-section/my-page/...`).
- You only need to set `config.book` when overriding the inferred book from the registry file.
- When `showcase` or `vs` are enabled, the subpage toolbar aligns with the content width on desktop and becomes a bottom action bar on mobile.
- A subpage can opt into a **structured template** with the object form `vs: { template: 'vs' }` (the boolean `true` stays `freestyle`). The built-in `vs` template is managed/strict: it owns the order and localized titles of its **Features**, **Performance** and **Security** sections — write one `##` heading per section in the Markdown and omitted sections are dropped gracefully.

2️⃣ Create Markdown files:

```
src/pages/manual/my-section/my-page.overview.en-US.md
src/pages/manual/my-section/my-page.overview.pt-BR.md
```

### Internal Links / Menu Shortcuts

Use `config.link.to` when an entry should appear in menus but redirect immediately to another internal page.

```javascript
import { definePage } from '@docsector/docsector-reader'

export default {
  '/getting-started': definePage({
    config: {
      link: {
        to: '/guide/getting-started/overview/'
      }
    },
    data: {
      'en-US': { title: 'Getting started' },
      'pt-BR': { title: 'Começando' }
    }
  })
}
```

Notes:

- For shortcut pages, `link.to` and `data` are enough.
- `icon` and `status` automatically fall back to the destination page when omitted.
- Internal links redirect directly to the target route instead of rendering `overview` / `showcase` / `vs` locally.

### GitHub-Style Alert Example

```markdown
> [!CAUTION]
> NOTICE OF BREAKING CHANGE.
>
> As of 7.0.0, multiple breaking changes were introduced into the library.
>
> Please review the migration guide before updating.
```

Supported alert types: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`.
Regular blockquotes without `[!TYPE]` continue to work normally.

### Code Example Blocks

```html
<d-block-code-example src="manual/code-examples/basic-counter" title="Basic counter">
Optional caption rendered as inline Markdown.
</d-block-code-example>
```

Notes:

- Store live examples as Vue SFCs under `src/examples/**/*.vue`; for example, `src="manual/code-examples/basic-counter"` resolves `src/examples/manual/code-examples/BasicCounter.vue` after kebab-case normalization.
- Readers get a live preview, a GitHub button for the example SFC, a source button with Template / Script / Style / All tabs, and a CodePen button when the example can be exported safely.
- Use `expanded="true"` only when the source code should be visible by default.
- CodePen export currently supports plain Vue SFCs with a template, optional style, and an Options API `export default` script. Named imports from `vue` and `quasar` are converted to browser globals.
- Examples using `<script setup>`, TypeScript scripts, or local imports still render in Docsector, but the CodePen action is disabled. Use `codepen="false"` to hide it intentionally.

### Terminal Blocks

```html
<d-block-terminal engine="demo-echo" title="Echo demo" command="echo Hello, Docsector!">
Optional caption rendered as inline Markdown.
</d-block-terminal>
```

Notes:

- Store engines as JS modules under `src/terminals/**/*.js`; for example, `engine="demo-echo"` resolves `src/terminals/demo-echo.js` after kebab-case normalization.
- An engine default-exports `async ({ onOutput, onError, onStatus }) => ({ run(command, { columns, rows }), source(command)?, input(data)?, stop()?, dispose()? })` and may export `meta = { label, language }`. The factory must be cheap (it runs at mount); heavy work belongs inside `run()`. When `stop()` exists, the block shows a Stop button during runs.
- When `input(data)` exists, the terminal is interactive: keyboard (and terminal mouse-tracking sequences) are forwarded to the engine byte-for-byte — including `Ctrl+C` (`\x03`), so the guest program owns interrupt semantics (double-press confirmations, graceful restores). Capture is click-to-focus; a runaway guest is killed with the Stop button.
- xterm.js and the engine module are lazily imported on the first Run (or on visibility with `autorun="true"`); engines should fetch heavy runtimes (e.g. `.wasm`) inside the first `run()` and report progress via `onStatus('downloading' | 'extracting' | 'booting' | 'running')`.
- Use `commands="Label:command|Label:command"` for a command tab strip below the toolbar (tabs run directly once the runtime is warm), `height` for the viewport size, `run-label` to rename the Run button, and `min-columns` (default `80`) for the terminal's column floor — containers narrower than the floor keep that many columns and pan horizontally (a scroll hint pill appears) instead of wrapping TUI output into garbage. Non-default tabs persist in the URL as `?t<index>`, so reloads and shared links restore the selected tab.
- When the engine implements `source(command)`, readers get a source panel (and a GitHub button when the returned object carries a `url`).

### File Attachment Blocks

```html
<d-block-file src="/files/manual/release-checklist.txt" title="Release checklist" size="1 KB">
Download the example file bundled with the docs.
</d-block-file>
```

Notes:

- Store small repo-tracked attachments in `public/files/` and link them with absolute paths such as `/files/manual/release-checklist.txt`.
- `title` and `size` are optional. If `title` is omitted, the rendered card falls back to the filename from `src`.
- The block body is rendered as an inline Markdown caption.
- External URLs also work, so the same syntax can later point to R2 or another CDN without changing the page structure.

### Embedded URL Blocks

```html
<d-block-embedded-url url="https://www.youtube.com/watch?v=M7lc1UVf-VE" title="YouTube player demo">
Optional caption rendered as inline Markdown.
</d-block-embedded-url>
```

Notes:

- Supported providers currently include YouTube, Vimeo, Spotify, and CodePen.
- The block preserves the original query string, so provider options such as `autoplay=1&loop=1` keep working when supported by the destination service.
- Unsupported or private URLs fall back to a safe external-link card instead of attempting a generic iframe.
- Raw HTML remains the escape hatch when you need a provider outside the curated list or full manual iframe control.

---


## 🖥️ CLI Commands

```bash
docsector init <name>          # Scaffold a new consumer project
docsector install-skill        # Install the built-in authoring skill
docsector install-skill --force # Refresh an existing installed authoring skill
docsector dev                  # Start dev server (port 8181)
docsector dev --port 3000      # Custom port
docsector build                # Build for production (dist/spa/)
docsector serve                # Serve production build
docsector help                 # Show help
```

---

## 🔌 Exports

| Import path | Export | Description |
|---|---|---|
| `@docsector/docsector-reader` | `createDocsector()` | Main helper for `docsector.config.js` objects |
| `@docsector/docsector-reader` | `defineBook()` | Define `*.book.js` tab metadata with active/inactive colors |
| `@docsector/docsector-reader` | `definePage()` | Define page registry entries, including internal shortcut pages |
| `@docsector/docsector-reader/quasar-factory` | `createQuasarConfig()` | Config factory for consumer projects |
| `@docsector/docsector-reader/quasar-factory` | `configure()` | No-op wrapper (avoids needing `quasar` dep) |
| `@docsector/docsector-reader/i18n` | `buildMessages()` | Build i18n messages from globs + book/page registries |
| `@docsector/docsector-reader/i18n` | `filter()` | Filter i18n messages by locale |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Vue 3** | Composition API + `<script setup>` |
| **Quasar v2** | UI framework |
| **@quasar/app-vite** | Vite-based Quasar build |
| **Vuex 4** | State management |
| **vue-i18n 9** | Internationalization |
| **markdown-it** | Markdown parsing |
| **Prism.js** | Syntax highlighting |
| **HJSON** | Human-friendly JSON for locale files |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📃 License

Copyright (c) Rodrigo de Araujo Vieira

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
