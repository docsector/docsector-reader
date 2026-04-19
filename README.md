<p align="center">
  <img src="https://github.com/docsector.png" alt="docsector-logo" width="120px" height="120px"/>
</p>
<h1 align="center">Docsector Reader 📖</h1>
<p align="center">
  <i>A documentation rendering engine built with Vue 3, Quasar v2 and Vite.</i>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@docsector/docsector-reader">
    <img alt="npm version" src="https://img.shields.io/npm/v/@docsector/docsector-reader?color=blue&label=npm"/>
  </a>
  <a href="https://github.com/docsector/docsector-reader/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/github/license/docsector/docsector-reader"/>
  </a>
</p>

Transform Markdown content into beautiful, navigable documentation sites — with i18n, syntax highlighting, dark/light mode, and anchor navigation.

---

## 🤖 AI-Friendly Features

- 📋 **Copy Page** — One-click button copies the current page as raw Markdown, ready to paste into LLMs
- 📄 **View as Markdown** — Open any page as plain text by appending `.md` to the URL, with locale support (`?lang=`)
- 🧠 **Markdown Negotiation** — Requests with `Accept: text/markdown` receive markdown responses, while browsers keep HTML by default
- 🔐 **Web Bot Auth Directory** — Optional signed JWKS directory at `/.well-known/http-message-signatures-directory` for bot identity verification
- 🤖 **Open in ChatGPT / Claude** — One-click links to open the current page directly in ChatGPT or Claude for Q&A
- 🤖 **LLM Bot Detection** — Automatically serves raw Markdown to known AI crawlers (GPTBot, ClaudeBot, PerplexityBot, GrokBot, and others)
- 🗺️ **Sitemap Generation** — Automatic `sitemap.xml` generation at build time with all page URLs (requires `siteUrl` in config)
- 🤖 **AI-Friendly robots.txt** — Scaffold includes a `robots.txt` explicitly allowing 23 AI crawlers (GPTBot, ClaudeBot, PerplexityBot, GrokBot, etc.)
- 🧭 **Content Signals** — Optional `Content-Signal` directive for declaring AI usage policy (`ai-train`, `search`, `ai-input`) in `robots.txt`
- 🧩 **Agent Skills Discovery Index** — Optional `/.well-known/agent-skills/index.json` with RFC v0.2.0 schema and SHA-256 digests
- 🪪 **MCP Server Card** — Optional `/.well-known/mcp/server-card.json` for MCP server discovery before connection
- 🌐 **WebMCP Browser Tools** — Optional registration of in-page tools via `navigator.modelContext` for browser agents
- 🔗 **Homepage Link Headers** — Auto-generated `Link` response headers for agent discovery (`api-catalog`, `service-doc`, `service-desc`, `describedby`) per RFC 8288 / RFC 9727
- 🔌 **MCP Server** — Auto-generated [MCP](https://modelcontextprotocol.io) server at `/mcp` for AI assistant integration (Claude Desktop, VS Code, etc.)
- 📄 **llms.txt / llms-full.txt** — Auto-generated [llms.txt](https://llmstxt.org) index and full-content file for LLM discovery (requires `siteUrl` in config)

---

## ✨ Features

- 📝 **Markdown Rendering** — Write docs in Markdown, rendered with syntax highlighting (Prism.js)
- 🧩 **Mermaid Diagrams** — Native support for fenced ` ```mermaid ` blocks, with automatic dark/light theme switching
- 🚨 **GitHub-Style Alerts** — Native support for `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, and `[!CAUTION]`
- 🌍 **Internationalization (i18n)** — Multi-language support with HJSON locale files and per-page translations
- 🌗 **Dark/Light Mode** — Automatic theme switching with Quasar Dark Plugin
- 🔗 **Anchor Navigation** — Right-side Table of Contents tree with scroll tracking and auto-scroll to active section
- 🔎 **Search** — Menu search across all documentation content and tags
- 🌐 **WebMCP Browser Tools** — Registers in-page tools for browser agents with `registerTool` and optional `provideContext` fallback
- 📱 **Responsive** — Mobile-friendly with collapsible sidebar and drawers
- 🏷️ **Status Badges** — Mark pages as `done`, `draft`, or `empty` with visual indicators
- ✏️ **Edit on GitHub** — Direct links to edit pages on your repository
- 🧭 **Robust Edit Link Mapping** — Normalizes route paths (including trailing slashes) into `page.subpage.locale.md` source files for reliable GitHub edit URLs
- 📅 **Last Updated Date** — Automatic per-page "last updated" date from git commit history, locale-formatted
- 📊 **Translation Progress** — Automatic translation percentage based on header coverage
- 🧠 **Markdown Negotiation** — Responds with Markdown when clients send `Accept: text/markdown`, while keeping HTML as browser default
- 🔐 **Web Bot Auth** — Can publish a signed HTTP message signatures directory and includes helpers to sign outbound bot requests
- 🧭 **Content Signals** — Injects `Content-Signal` policy in `robots.txt` with deterministic, idempotent build output
- 🏠 **Markdown Home at Root** — Homepage is rendered from `src/pages/Homepage.{lang}.md` directly at `/`
- 🌍 **Remote README as Home** — Optional build-time remote README source for homepage with automatic local fallback
- 🧩 **HTML-Preserving Remote Home** — Preserves raw HTML blocks from fetched Home README sources and resolves Home title from HTML `<h1>` or Markdown heading
- 🧭 **Remote Home Action Routing** — Home action links adapt to remote mode (`/` for AI handoff prompts and `remoteReadmeUrl` for “View as Markdown”)
- 🧼 **Clean Remote Home Footer** — Hides edit and translation footer metadata on remote Home pages for a cleaner landing experience
- 🧭 **Quick Links Custom Element** — Use `<d-quick-links>` and `<d-quick-link>` in Markdown to render rich home navigation cards
- 🗂️ **API Catalog Well-Known** — Auto-generates `/.well-known/api-catalog` as Linkset JSON for machine-readable API discovery
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
| `dist/spa/mcp-pages.json` | Page index (title, path, type) for search |
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

## � llms.txt (LLM Discovery)

Docsector Reader automatically generates [llms.txt](https://llmstxt.org) files at build time when `siteUrl` is configured (same requirement as sitemap.xml).

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
- If fetch fails, it falls back to local `src/pages/Homepage.{lang}.md` by default.

### Configure

```javascript
export default {
  // ...other config

  homePage: {
    source: 'remote-readme',
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
        name: 'my-docs-mcp',
        type: 'skill-md',
        description: 'Search and fetch docs pages via MCP.',
        url: '/.well-known/agent-skills/my-docs-mcp/SKILL.md'
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
│  └── public/               ← logo, images, icons     │
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
| `@docsector/tags` | project `src/i18n/tags.hjson` | consumer `src/i18n/tags.hjson` |

---

## ⚙️ Configuration (`docsector.config.js`)

```javascript
export default {
  branding: {
    logo: '/images/logo/my-logo.png',
    name: 'My Project',
    version: 'v1.0.0',
    versions: ['v1.0.0', 'v0.9.0']
  },

  links: {
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
        name: 'my-docs-mcp',
        type: 'skill-md',
        description: 'Search and fetch docs pages via MCP.',
        url: '/.well-known/agent-skills/my-docs-mcp/SKILL.md'
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

const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
const mdModules = import.meta.glob('../pages/**/*.md', { eager: true, query: '?raw', import: 'default' })

import boot from 'pages/boot'
import pages from 'pages'

export default buildMessages({ langModules, mdModules, pages, boot })
```

### Language files

Place HJSON locale files in `src/i18n/languages/`:

```
src/i18n/languages/en-US.hjson
src/i18n/languages/pt-BR.hjson
```

### Search tags (`src/i18n/tags.hjson`)

Provide search keywords per route and locale for menu search:

```hjson
{
  "en-US": {
    "/manual/my-section/my-page": "keyword1 keyword2 keyword3"
  }
  "pt-BR": {
    "/manual/my-section/my-page": "palavra1 palavra2 palavra3"
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
│   │   ├── index.js           # Page registry (routes + metadata)
│   │   ├── boot.js            # Boot page data
│   │   ├── guide/             # Guide pages (.md files)
│   │   └── manual/            # Manual pages (.md files)
│   ├── i18n/
│   │   ├── index.js           # Uses buildMessages() from engine
│   │   ├── tags.hjson         # Search keywords per route/locale
│   │   └── languages/         # HJSON locale files
│   ├── css/
│   │   └── app.sass           # Optional overrides (imports engine CSS)
│   └── boot/                  # Consumer-specific boot files
│       └── qmediaplayer.js    # Example: custom Quasar extension
└── public/
    ├── images/logo/           # Project logo
    ├── images/flags/          # Locale flag images
    └── icons/                 # PWA icons
```

---

## 📄 Adding Pages

1️⃣ Register in `src/pages/index.js`:

```javascript
export default {
  '/manual/my-section/my-page': {
    config: {
      icon: 'description',
      status: 'done',        // 'done' | 'draft' | 'empty'
      type: 'manual',        // 'guide' | 'manual'
      menu: {
        header: { label: '.my-section', icon: 'category' }
      },
      subpages: { showcase: false, vs: false }
    },
    data: {
      'en-US': { title: 'My Page' },
      'pt-BR': { title: 'Minha Página' }
    }
  }
}
```

2️⃣ Create Markdown files:

```
src/pages/manual/my-section/my-page.overview.en-US.md
src/pages/manual/my-section/my-page.overview.pt-BR.md
```

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

---

## 🖥️ CLI Commands

```bash
docsector init <name>          # Scaffold a new consumer project
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
| `@docsector/docsector-reader/quasar-factory` | `createQuasarConfig()` | Config factory for consumer projects |
| `@docsector/docsector-reader/quasar-factory` | `configure()` | No-op wrapper (avoids needing `quasar` dep) |
| `@docsector/docsector-reader/i18n` | `buildMessages()` | Build i18n messages from globs + pages |
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
