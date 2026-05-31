#!/usr/bin/env node

/**
 * Docsector Reader CLI
 *
 * Usage:
 *   docsector init [name]  — Scaffold a new documentation project
 *   docsector dev          — Start development server with hot-reload
 *   docsector build        — Build optimized SPA for production
 *   docsector serve        — Serve the production build locally
 *   docsector install-skill — Install the built-in authoring skill into a project
 *   docsector help         — Show help information
 */

import { spawn } from 'child_process'
import { existsSync, mkdirSync, writeFileSync, copyFileSync, cpSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')

const args = process.argv.slice(2)
const command = args[0]

const VERSION = '4.5.0'
const AUTHORING_SKILL_NAME = 'docsector-documentation-authoring'
const AUTHORING_SKILL_DESCRIPTION = 'Author Docsector documentation with Markdown, custom blocks, MCP, and WebMCP.'
const AUTHORING_SKILL_PUBLIC_PATH = `/.well-known/agent-skills/${AUTHORING_SKILL_NAME}/SKILL.md`
const AUTHORING_SKILL_SOURCE_DIR = resolve(packageRoot, 'public', '.well-known', 'agent-skills', AUTHORING_SKILL_NAME)
const AUTHORING_SKILL_CONFIG_SNIPPET = `\
agentSkills: {
  enabled: true,
  path: '/.well-known/agent-skills/index.json',
  schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills: [
    {
      name: '${AUTHORING_SKILL_NAME}',
      type: 'skill-md',
      description: '${AUTHORING_SKILL_DESCRIPTION}',
      url: '${AUTHORING_SKILL_PUBLIC_PATH}'
    }
  ]
}`

const HELP = `
  Docsector Reader v${VERSION}
  A documentation rendering engine built with Vue 3, Quasar v2 and Vite.

  Usage:
    docsector <command> [options]

  Commands:
    init [name]  Scaffold a new documentation project
    dev          Start development server with hot-reload (port 8181)
    build        Build optimized SPA for production (output: dist/spa/)
    serve        Serve the production build locally
    install-skill
                 Copy the built-in Docsector authoring skill into this project
    version      Show version number
    help         Show this help message

  Options:
    --port <number>   Override dev server port (default: 8181)
    --force           Overwrite an existing installed authoring skill

  Examples:
    docsector init my-docs
    docsector dev
    docsector dev --port 3000
    docsector build
    docsector serve
    docsector install-skill
    docsector install-skill --force

  Documentation:
    https://github.com/docsector/docsector-reader
`

// =============================================================================
// Scaffold templates
// =============================================================================

function getTemplatePackageJson (name) {
  return JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    description: `${name} — Documentation powered by Docsector Reader`,
    scripts: {
      dev: 'docsector dev',
      build: 'docsector build',
      serve: 'docsector serve'
    },
    dependencies: {
      '@docsector/docsector-reader': `^${VERSION}`,
      '@quasar/extras': '^1.16.12',
      'quasar': '^2.16.6',
      'vue': '^3.5.13',
      'vue-i18n': '^9.0.0',
      'vue-router': '^4.0.0',
      'vuex': '^4.0.1'
    }
  }, null, 2)
}

const TEMPLATE_QUASAR_CONFIG = `\
import { configure } from 'quasar/wrappers'
import { createQuasarConfig } from '@docsector/docsector-reader/quasar-factory'

export default configure(() => {
  return createQuasarConfig({
    projectRoot: import.meta.dirname
  })
})
`

const TEMPLATE_DOCSECTOR_CONFIG = `\
/**
 * Docsector Reader Configuration
 *
 * Customize how your documentation looks and behaves.
 * Replace the values below with your project's branding and links.
 */
export default {
  // @ Branding
  branding: {
    logo: '/images/logo.png',
    name: 'My Documentation',
    version: 'v0.1.0',
    versions: [
      { id: 'v0.1.0', current: true, released: false }
    ]
  },

  // @ Links
  links: {
    github: 'https://github.com/your-org/your-repo',
    discussions: null,
    chat: null,
    email: null,
    changelog: null,
    roadmap: null,
    sponsor: null,
    explore: null
  },

  // @ GitHub
  github: {
    editBaseUrl: 'https://github.com/your-org/your-repo/edit/main/src/pages'
  },

  // @ Site URL (optional)
  // Set this for absolute URLs in sitemap.xml, llms.txt, and AI metadata.
  // sitemap.xml is still generated with root-relative URLs when omitted.
  // siteUrl: 'https://docs.example.com',

  // @ MCP (Model Context Protocol)
  // Uncomment to enable an MCP server at /mcp for AI assistant integration.
  // Requires Cloudflare Pages Functions (or compatible serverless platform).
  // mcp: {
  //   serverName: 'my-docs',
  //   toolSuffix: 'my_docs'
  // },

  // @ MCP Server Card discovery (optional)
  // Publishes /.well-known/mcp/server-card.json for pre-connection discovery.
  // mcpServerCard: {
  //   enabled: true,
  //   path: '/.well-known/mcp/server-card.json',
  //   transportEndpoint: '/mcp',
  //   transportType: 'streamable-http',
  //   protocolVersion: '2025-03-26',
  //   capabilities: {
  //     tools: { supported: true },
  //     resources: { supported: false },
  //     prompts: { supported: false }
  //   }
  // },

  // @ WebMCP browser tools (optional)
  // Registers tools in browser contexts that expose navigator.modelContext.
  // Uses registerTool when available, with optional provideContext fallback.
  // webMcp: {
  //   enabled: true,
  //   apiMode: 'dual', // 'registerTool' | 'dual'
  //   toolPrefix: 'docs',
  //   bridgeEndpoint: '/mcp',
  //   bridgeToMcp: true,
  //   tools: {
  //     searchDocs: true,
  //     getPage: true,
  //     navigateTo: true,
  //     copyCurrentPage: true
  //   }
  // },

  // @ Home page source (optional)
  // Use a remote README.md as homepage content at build-time.
  // Falls back to local src/pages/Homepage.{lang}.md on fetch failure by default.
  // homePage: {
  //   source: 'remote-readme', // 'local' | 'remote-readme'
  //   remoteReadmeUrl: 'https://raw.githubusercontent.com/your-org/your-repo/main/README.md',
  //   timeoutMs: 8000,
  //   fallbackToLocal: true
  // },

  // @ Homepage Link headers for agent discovery (optional)
  // linkHeaders: {
  //   enabled: true,
  //   apiCatalog: '/.well-known/api-catalog',
  //   serviceDoc: '/',
  //   serviceDesc: '/mcp',
  //   describedBy: '/llms.txt'
  // },

  // @ API catalog artifact (RFC 9727) (optional)
  // apiCatalog: {
  //   enabled: true,
  //   path: '/.well-known/api-catalog',
  //   items: ['/mcp']
  // },

  // @ Markdown negotiation for agents (optional)
  // markdownNegotiation: {
  //   enabled: true,
  //   agentFallback: true
  // },

  // @ Web Bot Auth (optional)
  // Publishes a signed JWKS directory at
  // /.well-known/http-message-signatures-directory
  // using runtime environment variables.
  // webBotAuth: {
  //   enabled: true,
  //   directoryPath: '/.well-known/http-message-signatures-directory',
  //   jwksEnv: 'WEB_BOT_AUTH_JWKS',
  //   privateJwkEnv: 'WEB_BOT_AUTH_PRIVATE_JWK',
  //   keyIdEnv: 'WEB_BOT_AUTH_KEY_ID',
  //   keyId: null,
  //   signatureMaxAge: 300,
  //   signatureLabel: 'sig1'
  // },

  // @ Content Signals (optional)
  // Declares AI usage preferences in robots.txt.
  // contentSignals: {
  //   enabled: true,
  //   aiTrain: 'yes',
  //   search: 'yes',
  //   aiInput: 'yes',
  //   userAgent: '*',
  //   applyToAllBlocks: false
  // },

  // @ Agent Skills discovery index (optional)
  // Publishes /.well-known/agent-skills/index.json (RFC v0.2.0)
  // and computes sha256 digests from local artifacts.
  // agentSkills: {
  //   enabled: true,
  //   path: '/.well-known/agent-skills/index.json',
  //   schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  //   skills: [
  //     {
  //       name: '${AUTHORING_SKILL_NAME}',
  //       type: 'skill-md',
  //       description: '${AUTHORING_SKILL_DESCRIPTION}',
  //       url: '${AUTHORING_SKILL_PUBLIC_PATH}'
  //     }
  //   ]
  // },

  // @ Languages
  languages: [
    {
      image: '/images/flags/united-states-of-america.png',
      label: 'English (US)',
      value: 'en-US'
    }
  ],

  // @ Default language
  defaultLanguage: 'en-US'
}
`

const TEMPLATE_CSS_STUB = `\
// Import Docsector Reader's base styles
@import '@docsector/docsector-reader/src/css/app.sass'

// Add your custom styles below
`

const TEMPLATE_I18N_INDEX = `\
// @ Import i18n message builder from Docsector Reader
import { buildMessages } from '@docsector/docsector-reader/i18n'
import homePageOverride from 'virtual:docsector-homepage-override'

// @ Import language HJSON files (Vite-compatible eager import)
const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
// @ Import markdown files (Vite-compatible eager import as raw strings)
const currentMdModules = import.meta.glob('../pages/**/*.md', { eager: true, query: '?raw', import: 'default' })
const oldMdModules = import.meta.glob('../pages/.old/**/*.md', { eager: true, query: '?raw', import: 'default' })
const mdModules = { ...currentMdModules, ...oldMdModules }

// @ Import pages
import boot from 'pages/boot'
import { books, pageEntries } from 'virtual:docsector-books'

export default buildMessages({ langModules, mdModules, books, pageEntries, boot, homePageOverride })
`

const TEMPLATE_I18N_HJSON = `\
{
  // @ Pages — dynamic content injected by buildMessages
  _: {
    home: {
      texts: [
        'The official documentation of ',
        'Built with ',
        'Start exploring the docs below!'
      ]
    }

    guide: {}
  }

  // @ Page actions
  page: {
    edit: {
      github: {
        start: 'Start this page'
        complete: 'Complete this page'
        edit: 'Edit this page'
      }
      progress: 'Translation Progress'
      translations: 'Available translations'
      anchor: 'Anchor navigation'
      of: 'of'
    }
    nav: {
      prev: 'Previous page'
      next: 'Next page'
    }
    newVersion: 'New in'
  }

  // @ Menu
  menu: {
    search: 'Search'

    home: 'Home'
    changelog: 'Changelog'
    roadmap: 'Roadmap'
    sponsor: 'Sponsor'
    explore: 'Explore GitHub Repositories'

    status: {
      empty: {
        _: 'empty'
        tooltip: 'This page is empty!'
      }
      draft: {
        _: 'draft'
        tooltip: 'This page is under construction.'
      }
      new: {
        _: 'new'
        tooltip: 'This page is new.'
        tooltipVersion: 'New in {version}'
      }
    }

    version: {
      status: {
        released: 'released'
        draft: 'draft'
        deprecated: 'deprecated'
      }
    }

    settings: 'Settings'

    _404: '404 Error - Not Found'
  }

  // @ Submenus (tabs)
  submenu: {
    guides: 'Guides'
    manuals: 'Manuals'
    references: 'References'

    overview: 'Overview'
    showcase: 'Showcase'
    versus: 'Vs'

    changelog: 'Changelog'
  }

  // @ System
  system: {
    documentation: 'Documentation'
    support: 'Sponsor this project'
    backToTop: 'Back to top'
  }

  // @ Settings
  settings: {
    general: {
      _: 'General Settings'
      language: {
        _: 'Language'
      }
    }
    appearance: {
      _: 'Appearance'
      background: {
        _: 'Background Color'
      }
    }
  }

  changelog: {}

  _a: ' and '
  _o: ' or '
  _f: ' files '
  _s: 'Source Code'
}
`

const TEMPLATE_PAGES_GUIDE_BOOK = `\
export default {
  id: 'guide',
  label: 'Guide',
  icon: 'school',
  order: 1,
  color: 'secondary'
}
`

const TEMPLATE_PAGES_INDEX = `\
/**
 * Guide Pages Registry
 *
 * Define guide pages here. Each key is a URL path,
 * and each value configures the page's book, icon, status, and titles.
 *
 * config.book: top-level route prefix — 'guide', 'manual', etc.
 * config.status: 'done' | 'draft' | 'empty' | 'new'
 * config.version: optional version where this page was introduced (e.g. 'v2.1.0')
 * config.meta.description: string or localized object for SEO/social description
 * config.icon: Material Design icon name
 * config.menu: menu display options (header, subheader, separator)
 * config.subpages: { showcase: bool, vs: bool }
 * data: per-language titles (used for navigation and <title> tag)
 *
 * Set config to null for category nodes (non-navigable groupings).
 */
export default {
  '/getting-started': {
    config: {
      icon: 'flag',
      status: 'new',
      version: 'v0.1.0',
      meta: {
        description: {
          'en-US': 'Get started quickly with setup and project structure.'
        }
      },
      book: 'guide',
      menu: {
        header: {
          icon: 'school',
          label: 'Guides'
        }
      },
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Getting Started' }
    }
  }
}
`

const TEMPLATE_PAGES_BOOT = `\
export default {
  meta: {
    'en-US': {
      overview: {
        _translations: null,
        _sections: null
      }
    }
  }
}
`

const TEMPLATE_HOMEPAGE_MD = `\
# Welcome to Docsector Reader

Docsector Reader is a markdown-first documentation engine.

## Quick Links

- [Getting Started](/guide/getting-started/overview/)
- [Configuration](/guide/configuration/overview/)
- [Pages and Routing](/guide/pages-and-routing/overview/)

## About

- Repository: [docsector/docsector-reader](https://github.com/docsector/docsector-reader)
`

const TEMPLATE_404_PAGE = `\
<template>
<q-page-container>
  <q-page class="flex flex-center column q-pa-xl">
    <q-icon name="search_off" size="80px" color="grey-5" class="q-mb-lg" />
    <h1 class="text-h3 text-weight-bold q-mb-sm" style="color: #333;">404</h1>
    <p class="text-subtitle1 text-grey-6 q-mb-lg">
      The page you're looking for doesn't exist.
    </p>
    <q-btn
      unelevated
      color="primary"
      label="Back to Home"
      icon="home"
      to="/"
      no-caps
      style="border-radius: 8px;"
    />
  </q-page>
</q-page-container>
</template>

<script setup>
defineOptions({ name: 'NotFoundPage' })
</script>
`

const TEMPLATE_INDEX_HTML = `\
<!DOCTYPE html>
<html>
  <head>
    <title><%= productName %></title>

    <meta charset="utf-8">
    <meta name="description" content="<%= productDescription %>">
    <meta name="format-detection" content="telephone=no">
    <meta name="msapplication-tap-highlight" content="no">
    <meta name="viewport" content="user-scalable=yes, initial-scale=1, maximum-scale=5, minimum-scale=1, width=device-width">

    <!-- Open Graph -->
    <meta property="og:title" content="<%= productName %>">
    <meta property="og:description" content="<%= productDescription %>">
    <meta property="og:type" content="website">
    <meta property="og:image" content="/images/logo.png">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<%= productName %>">
    <meta name="twitter:description" content="<%= productDescription %>">
    <meta name="twitter:image" content="/images/logo.png">

    <link rel="icon" type="image/png" sizes="128x128" href="images/icons/favicon-128.png">
    <link rel="icon" type="image/png" sizes="32x32" href="images/icons/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="images/icons/favicon-16.png">
    <link rel="icon" type="image/ico" href="favicon.ico">
  </head>
  <body>
    <!-- quasar:entry-point -->
  </body>
</html>
`

const TEMPLATE_POSTCSS = `\
module.exports = {
  plugins: [
    require('autoprefixer')
  ]
}
`

const TEMPLATE_GITIGNORE = `\
node_modules
.quasar
dist
functions
.env
.dev.vars
npm-debug.log*
.DS_Store
.thumbs.db
`

const TEMPLATE_ENV_EXAMPLE = `\
# -----------------------------------------------------------------------------
# Docsector Reader / Cloudflare environment example
# -----------------------------------------------------------------------------
# Copy to .env (or .dev.vars for wrangler pages dev) and fill with real values.
#
# AI Assistant (Cloudflare AI Search REST fallback)
AI_SEARCH_INSTANCE_NAME=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Optional: AI Search instance binding name (defaults to AI_SEARCH in config)
# AI_SEARCH=

# Optional: Web Bot Auth runtime variables
# WEB_BOT_AUTH_JWKS=
# WEB_BOT_AUTH_PRIVATE_JWK=
# WEB_BOT_AUTH_KEY_ID=
`

const TEMPLATE_MARKDOWNLINT = `\
{
  "MD013": false,
  "MD033": {
    "allowed_elements": [
      "d-quick-links",
      "d-quick-link"
    ]
  }
}
`

const TEMPLATE_ROBOTS_TXT = `\
User-agent: *
Allow: /
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Sitemap: /sitemap.xml

# Explicitly allow AI crawlers
# OpenAI
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

# Anthropic
User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: anthropic-ai
Allow: /

# Google
User-agent: Google-Extended
Allow: /

User-agent: Gemini-Deep-Research
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# ByteDance
User-agent: Bytespider
Allow: /

# Common Crawl
User-agent: CCBot
Allow: /

# Meta
User-agent: Meta-ExternalAgent
Allow: /

User-agent: FacebookBot
Allow: /

# Amazon
User-agent: Amazonbot
Allow: /

# Apple
User-agent: Applebot-Extended
Allow: /

# Cohere
User-agent: cohere-ai
Allow: /

# DuckDuckGo
User-agent: DuckAssistBot
Allow: /

# Cloudflare
User-agent: Cloudflare-AI-Search
Allow: /

# xAI
User-agent: GrokBot
Allow: /

# Allen AI
User-agent: AI2Bot
Allow: /

# You.com
User-agent: YouBot
Allow: /

# Huawei
User-agent: PetalBot
Allow: /
`

const TEMPLATE_GETTING_STARTED_MD = `\
## Installation

Create a new Docsector documentation project:

\`\`\`bash
npx @docsector/docsector-reader init my-docs
cd my-docs
npm install
\`\`\`

## Development Server

Start the development server with hot-reload:

\`\`\`bash
npm run dev
\`\`\`

Open **http://localhost:8181** in your browser.

## Project Structure

Here's an overview of the project files:

| File / Folder | Description |
| --- | --- |
| \`docsector.config.js\` | Branding, links, languages, and GitHub config |
| \`quasar.config.js\` | Quasar/Vite build configuration (via factory) |
| \`.markdownlint.json\` | Markdown lint rules (allows Docsector custom tags) |
| \`src/pages/guide.book.js\` | Guide book definition (tab metadata) |
| \`src/pages/guide.index.js\` | Guide page registry (routes + metadata) |
| \`src/pages/boot.js\` | Boot metadata for the home page |
| \`src/pages/Homepage.en-US.md\` | Home page content in Markdown |
| \`src/pages/404Page.vue\` | Not found page |
| \`src/pages/guide/\` | Guide pages (Markdown files) |
| \`src/i18n/languages/\` | Translation files (HJSON format) |
| \`src/css/app.sass\` | Custom styles |
| \`public/images/\` | Static assets (logo, flags, icons) |

## Adding a Page

1. Register the page in \`src/pages/guide.index.js\`
2. Set \`config.book\` (for example: \`'guide'\`)
3. Create the Markdown file at \`src/pages/{book}/{path}.overview.{lang}.md\`
3. The page will automatically appear in the sidebar navigation

## Customization

Edit \`docsector.config.js\` to change:

- **Branding** — logo, name, version
- **Links** — GitHub, changelog, sponsor
- **Languages** — add or remove supported locales
- **GitHub** — edit page base URL

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The optimized SPA output will be in \`dist/spa/\`.
Docsector also generates \`dist/spa/sitemap.xml\` and keeps \`robots.txt\` discoverable with \`Sitemap: /sitemap.xml\`. Set \`siteUrl\` in \`docsector.config.js\` when you want absolute sitemap URLs.
`

// =============================================================================
// Commands
// =============================================================================

function findQuasarBin () {
  // Try local @quasar/app-vite first (user's project or hoisted)
  const localAppVite = resolve(process.cwd(), 'node_modules', '@quasar', 'app-vite', 'bin', 'quasar.js')
  if (existsSync(localAppVite)) return localAppVite

  // Try package's own node_modules (nested dependency)
  const pkgAppVite = resolve(packageRoot, 'node_modules', '@quasar', 'app-vite', 'bin', 'quasar.js')
  if (existsSync(pkgAppVite)) return pkgAppVite

  // Fallback: try generic quasar bin in local node_modules
  const localBin = resolve(process.cwd(), 'node_modules', '.bin', 'quasar')
  if (existsSync(localBin)) return localBin

  // Fall back to npx
  return 'npx quasar'
}

function run (cmd, cmdArgs = []) {
  const quasar = findQuasarBin()
  const isNpx = quasar.startsWith('npx')

  const spawnCmd = isNpx ? 'npx' : quasar
  const spawnArgs = isNpx ? ['quasar', cmd, ...cmdArgs] : [cmd, ...cmdArgs]

  const child = spawn(spawnCmd, spawnArgs, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DOCSECTOR_ROOT: packageRoot
    }
  })

  child.on('close', (code) => {
    process.exit(code)
  })

  child.on('error', (err) => {
    console.error(`Error running docsector ${cmd}:`, err.message)
    process.exit(1)
  })
}

function copyAuthoringSkillTarget (targetDir, { force = false } = {}) {
  if (!existsSync(AUTHORING_SKILL_SOURCE_DIR)) {
    throw new Error(`Built-in authoring skill not found at ${AUTHORING_SKILL_SOURCE_DIR}`)
  }

  if (targetDir === AUTHORING_SKILL_SOURCE_DIR) {
    return 'already-source'
  }

  if (existsSync(targetDir) && !force) {
    return 'skipped'
  }

  mkdirSync(dirname(targetDir), { recursive: true })
  cpSync(AUTHORING_SKILL_SOURCE_DIR, targetDir, {
    recursive: true,
    force: true
  })

  return existsSync(targetDir) ? 'installed' : 'failed'
}

function installAuthoringSkill ({ projectRoot = process.cwd(), force = false } = {}) {
  const targets = [
    {
      label: 'Repository-local skill',
      dir: resolve(projectRoot, '.github', 'skills', AUTHORING_SKILL_NAME)
    },
    {
      label: 'Public skill artifact',
      dir: resolve(projectRoot, 'public', '.well-known', 'agent-skills', AUTHORING_SKILL_NAME)
    }
  ]

  console.log(`\n  Installing ${AUTHORING_SKILL_NAME} into ${projectRoot}...\n`)

  try {
    for (const target of targets) {
      const result = copyAuthoringSkillTarget(target.dir, { force })
      if (result === 'installed') {
        console.log(`  created ${target.label}: ${target.dir}`)
      } else if (result === 'already-source') {
        console.log(`  using package ${target.label}: ${target.dir}`)
      } else if (result === 'skipped') {
        console.log(`  skipped ${target.label}: ${target.dir}`)
      } else {
        throw new Error(`Unable to install ${target.label} at ${target.dir}`)
      }
    }
  } catch (err) {
    console.error(`\n  Error: ${err.message}\n`)
    process.exit(1)
  }

  if (!force) {
    console.log('\n  Existing skill folders are left untouched. Use --force to refresh them.')
  }

  console.log('\n  To publish the skill discovery index, add this to docsector.config.js:\n')
  console.log(
    AUTHORING_SKILL_CONFIG_SNIPPET.split('\n')
      .map(line => `  ${line}`)
      .join('\n')
  )
  console.log('\n  Then run:')
  console.log('    npx docsector build')
  console.log('')
}

/**
 * Scaffold a new Docsector documentation project.
 */
function initProject (name) {
  if (!name) {
    name = 'my-docs'
    console.log(`  No project name specified, using "${name}"`)
  }

  const projectDir = resolve(process.cwd(), name)

  if (existsSync(projectDir)) {
    console.error(`\n  Error: Directory "${name}" already exists.\n`)
    process.exit(1)
  }

  console.log(`\n  Creating Docsector project in ${projectDir}...\n`)

  // Create directory structure
  const dirs = [
    '',
    'src',
    'src/css',
    'src/i18n',
    'src/i18n/languages',
    'src/pages',
    'src/pages/guide',
    'public',
    'public/images',
    'public/images/icons',
    'public/images/flags'
  ]

  for (const dir of dirs) {
    mkdirSync(resolve(projectDir, dir), { recursive: true })
  }

  // Create files
  const files = [
    ['package.json', getTemplatePackageJson(name)],
    ['quasar.config.js', TEMPLATE_QUASAR_CONFIG],
    ['docsector.config.js', TEMPLATE_DOCSECTOR_CONFIG],
    ['.env.example', TEMPLATE_ENV_EXAMPLE],
    ['.markdownlint.json', TEMPLATE_MARKDOWNLINT],
    ['index.html', TEMPLATE_INDEX_HTML],
    ['postcss.config.cjs', TEMPLATE_POSTCSS],
    ['.gitignore', TEMPLATE_GITIGNORE],
    ['public/robots.txt', TEMPLATE_ROBOTS_TXT],
    ['src/css/app.sass', TEMPLATE_CSS_STUB],
    ['src/i18n/index.js', TEMPLATE_I18N_INDEX],
    ['src/i18n/languages/en-US.hjson', TEMPLATE_I18N_HJSON],
    ['src/pages/guide.book.js', TEMPLATE_PAGES_GUIDE_BOOK],
    ['src/pages/guide.index.js', TEMPLATE_PAGES_INDEX],
    ['src/pages/boot.js', TEMPLATE_PAGES_BOOT],
    ['src/pages/Homepage.en-US.md', TEMPLATE_HOMEPAGE_MD],
    ['src/pages/404Page.vue', TEMPLATE_404_PAGE],
    ['src/pages/guide/getting-started.overview.en-US.md', TEMPLATE_GETTING_STARTED_MD]
  ]

  for (const [filePath, content] of files) {
    writeFileSync(resolve(projectDir, filePath), content, 'utf-8')
  }

  // Copy logo from package
  const packageLogo = resolve(packageRoot, 'public/images/logo.png')
  if (existsSync(packageLogo)) {
    copyFileSync(packageLogo, resolve(projectDir, 'public/images/logo.png'))
  }

  console.log('  Project structure:')
  console.log(`    ${name}/`)
  console.log('    ├── docsector.config.js')
  console.log('    ├── quasar.config.js')
  console.log('    ├── .env.example')
  console.log('    ├── .markdownlint.json')
  console.log('    ├── package.json')
  console.log('    ├── index.html')
  console.log('    ├── postcss.config.cjs')
  console.log('    ├── .gitignore')
  console.log('    ├── public/')
  console.log('    │   ├── robots.txt')
  console.log('    │   └── images/')
  console.log('    │       └── logo.png')
  console.log('    └── src/')
  console.log('        ├── css/')
  console.log('        │   └── app.sass')
  console.log('        ├── i18n/')
  console.log('        │   ├── index.js')
  console.log('        │   └── languages/')
  console.log('        │       └── en-US.hjson')
  console.log('        └── pages/')
  console.log('            ├── guide.book.js')
  console.log('            ├── guide.index.js')
  console.log('            ├── boot.js')
  console.log('            ├── Homepage.en-US.md')
  console.log('            ├── 404Page.vue')
  console.log('            └── guide/')
  console.log('                └── getting-started.overview.en-US.md')

  console.log('\n  Next steps:\n')
  console.log(`    cd ${name}`)
  console.log('    npm install')
  console.log('    npx docsector dev')
  console.log('')
  console.log('  Then open http://localhost:8181 in your browser.')
  console.log('')
}

// =============================================================================
// Command dispatcher
// =============================================================================

switch (command) {
  case 'init':
    initProject(args[1])
    break

  case 'dev': {
    const portIdx = args.indexOf('--port')
    const extraArgs = []
    if (portIdx !== -1 && args[portIdx + 1]) {
      extraArgs.push('--port', args[portIdx + 1])
    }
    run('dev', extraArgs)
    break
  }

  case 'build':
    run('build', args.slice(1))
    break

  case 'serve':
    run('serve', ['dist/spa', '--history', ...args.slice(1)])
    break

  case 'install-skill':
    installAuthoringSkill({ force: args.includes('--force') })
    break

  case 'version':
  case '-v':
  case '--version':
    console.log(`docsector v${VERSION}`)
    break

  case 'help':
  case '-h':
  case '--help':
  case undefined:
    console.log(HELP)
    break

  default:
    console.error(`Unknown command: "${command}"`)
    console.log(HELP)
    process.exit(1)
}
