#!/usr/bin/env node

/**
 * Docsector Reader CLI
 *
 * Usage:
 *   docsector init [name]  — Scaffold a new documentation project
 *   docsector dev          — Start development server with hot-reload
 *   docsector build        — Build optimized SPA for production
 *   docsector serve        — Serve the production build locally
 *   docsector help         — Show help information
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')

const args = process.argv.slice(2)
const command = args[0]

const VERSION = '0.2.3'

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
    version      Show version number
    help         Show this help message

  Options:
    --port <number>   Override dev server port (default: 8181)

  Examples:
    docsector init my-docs
    docsector dev
    docsector dev --port 3000
    docsector build
    docsector serve

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
      '@docsector/docsector-reader': '^0.2.3',
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
    version: 'v0.1.0'
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

// @ Import language HJSON files (Vite-compatible eager import)
const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
// @ Import markdown files (Vite-compatible eager import as raw strings)
const mdModules = import.meta.glob('../pages/**/*.md', { eager: true, query: '?raw', import: 'default' })

// @ Import pages
import boot from 'pages/boot'
import pages from 'pages'

export default buildMessages({ langModules, mdModules, pages, boot })
`

const TEMPLATE_I18N_HJSON = `\
{
  // Main navigation and UI labels for your documentation
  nav: {
    overview: Overview
  }

  // Page-specific translations (auto-loaded from pages/*.md)
  pages: {}
}
`

const TEMPLATE_PAGES_INDEX = `\
/**
 * Pages Registry
 *
 * Define your documentation pages here. Each key is a URL path,
 * and each value configures the page's type, icon, status, and titles.
 *
 * config.type: top-level route prefix — 'manual', 'guide', etc.
 * config.status: 'done' | 'draft' | 'empty'
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
      status: 'done',
      type: 'guide',
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
        _translations: null
      }
    }
  }
}
`

const TEMPLATE_BOOT_PAGE = `\
<template>
  <q-page class="flex flex-center column q-pa-xl">
    <h1 class="text-h3 text-weight-bold q-mb-md">
      Welcome to your Documentation
    </h1>
    <p class="text-subtitle1 text-grey-7">
      Edit <code>src/pages/@/BootPage.vue</code> to customize this page.
    </p>
    <q-btn
      color="primary"
      label="Getting Started"
      to="/en-US/guide/getting-started/overview"
      class="q-mt-lg"
    />
  </q-page>
</template>

<script setup>
defineOptions({ name: 'BootPage' })
</script>
`

const TEMPLATE_404_PAGE = `\
<template>
  <q-page class="flex flex-center column q-pa-xl">
    <h1 class="text-h3 text-weight-bold q-mb-md">404</h1>
    <p class="text-subtitle1 text-grey-7">
      Page not found.
    </p>
    <q-btn
      flat
      color="primary"
      label="Go Home"
      to="/"
    />
  </q-page>
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
npm-debug.log*
.DS_Store
.thumbs.db
`

const TEMPLATE_GETTING_STARTED_MD = `\
# Getting Started

Welcome to your documentation project!

## Installation

\\\`\\\`\\\`bash
npm install
\\\`\\\`\\\`

## Development

\\\`\\\`\\\`bash
npm run dev
\\\`\\\`\\\`

Your documentation will be available at **http://localhost:8181**.

## Next Steps

- Edit pages in \\\`src/pages/\\\`
- Add languages in \\\`src/i18n/languages/\\\`
- Customize branding in \\\`docsector.config.js\\\`
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
    'src/pages/@',
    'src/pages/getting-started',
    'src/pages/getting-started/en-US',
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
    ['index.html', TEMPLATE_INDEX_HTML],
    ['postcss.config.cjs', TEMPLATE_POSTCSS],
    ['.gitignore', TEMPLATE_GITIGNORE],
    ['src/css/app.sass', TEMPLATE_CSS_STUB],
    ['src/i18n/index.js', TEMPLATE_I18N_INDEX],
    ['src/i18n/languages/en-US.hjson', TEMPLATE_I18N_HJSON],
    ['src/pages/index.js', TEMPLATE_PAGES_INDEX],
    ['src/pages/boot.js', TEMPLATE_PAGES_BOOT],
    ['src/pages/@/BootPage.vue', TEMPLATE_BOOT_PAGE],
    ['src/pages/@/404Page.vue', TEMPLATE_404_PAGE],
    ['src/pages/getting-started/en-US/overview.md', TEMPLATE_GETTING_STARTED_MD]
  ]

  for (const [filePath, content] of files) {
    writeFileSync(resolve(projectDir, filePath), content, 'utf-8')
  }

  console.log('  Project structure:')
  console.log(`    ${name}/`)
  console.log('    ├── docsector.config.js')
  console.log('    ├── quasar.config.js')
  console.log('    ├── package.json')
  console.log('    ├── index.html')
  console.log('    ├── postcss.config.cjs')
  console.log('    ├── .gitignore')
  console.log('    ├── public/')
  console.log('    │   └── images/')
  console.log('    └── src/')
  console.log('        ├── css/')
  console.log('        │   └── app.sass')
  console.log('        ├── i18n/')
  console.log('        │   ├── index.js')
  console.log('        │   └── languages/')
  console.log('        │       └── en-US.hjson')
  console.log('        └── pages/')
  console.log('            ├── index.js')
  console.log('            ├── boot.js')
  console.log('            ├── @/')
  console.log('            │   ├── BootPage.vue')
  console.log('            │   └── 404Page.vue')
  console.log('            └── getting-started/')
  console.log('                └── en-US/')
  console.log('                    └── overview.md')

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
