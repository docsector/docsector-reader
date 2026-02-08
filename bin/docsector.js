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
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')

const args = process.argv.slice(2)
const command = args[0]

const VERSION = '0.3.1'

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
      '@docsector/docsector-reader': '^0.3.1',
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
        _translations: null,
        _sections: null
      }
    }
  }
}
`

const TEMPLATE_BOOT_PAGE = `\
<template>
<q-page-container>
  <q-page class="boot-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-icon-container">
          <q-icon name="auto_stories" size="64px" color="white" />
        </div>
        <h1 class="hero-title">{{ projectName }}</h1>
        <p class="hero-subtitle">{{ $t('_.home.texts[0]') }}{{ projectName }}</p>
        <p class="hero-description">{{ $t('_.home.texts[2]') }}</p>
        <div class="hero-actions">
          <q-btn
            unelevated
            color="white"
            text-color="primary"
            label="Get Started"
            icon="rocket_launch"
            to="/guide/getting-started/overview"
            class="hero-btn"
            size="lg"
            no-caps
          />
          <q-btn
            v-if="projectUrl !== '#'"
            outline
            color="white"
            label="GitHub"
            icon="fab fa-github"
            @click="openURL(projectUrl)"
            class="hero-btn"
            size="lg"
            no-caps
          />
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="features-section">
      <div class="features-grid">
        <div class="feature-card">
          <q-icon name="edit_note" size="40px" color="primary" />
          <h3>Markdown Powered</h3>
          <p>Write your documentation in Markdown. Pages are automatically converted into beautiful, navigable content.</p>
        </div>
        <div class="feature-card">
          <q-icon name="translate" size="40px" color="primary" />
          <h3>Multi-language</h3>
          <p>Built-in i18n support. Add translations by creating locale files — no extra configuration needed.</p>
        </div>
        <div class="feature-card">
          <q-icon name="palette" size="40px" color="primary" />
          <h3>Beautiful UI</h3>
          <p>Powered by Quasar Framework. Responsive, accessible, and production-ready out of the box.</p>
        </div>
        <div class="feature-card">
          <q-icon name="bolt" size="40px" color="primary" />
          <h3>Lightning Fast</h3>
          <p>Vite-powered dev server with hot-reload. See your changes instantly as you write.</p>
        </div>
        <div class="feature-card">
          <q-icon name="search" size="40px" color="primary" />
          <h3>Full-text Search</h3>
          <p>Instant client-side search across all your documentation pages and translations.</p>
        </div>
        <div class="feature-card">
          <q-icon name="settings" size="40px" color="primary" />
          <h3>Easy Configuration</h3>
          <p>One config file for branding, links, languages, and GitHub integration.</p>
        </div>
      </div>
    </div>

    <!-- Quick Start Section -->
    <div class="quickstart-section">
      <h2 class="section-title">Quick Links</h2>
      <div class="quickstart-grid">
        <q-card flat bordered class="quickstart-card" clickable @click="$router.push('/guide/getting-started/overview')">
          <q-card-section horizontal>
            <q-card-section class="flex flex-center" style="width: 60px;">
              <q-icon name="flag" size="28px" color="primary" />
            </q-card-section>
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">Getting Started</div>
              <div class="text-caption text-grey-7">Installation, setup, and your first page</div>
            </q-card-section>
            <q-space />
            <q-card-section class="flex flex-center">
              <q-icon name="chevron_right" color="grey-5" />
            </q-card-section>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Footer -->
    <div class="boot-footer">
      <p>{{ $t('_.home.texts[1]') }}
        <a :href="projectUrl" target="_blank" class="footer-link">Docsector Reader</a>
      </p>
    </div>
  </q-page>
</q-page-container>
</template>

<script setup>
import { openURL } from 'quasar'
import docsectorConfig from 'docsector.config.js'

defineOptions({ name: 'BootPage' })

const projectName = docsectorConfig.branding?.name || 'My Documentation'
const projectUrl = docsectorConfig.links?.github || '#'
</script>

<style lang="sass" scoped>
.boot-page
  padding: 0 !important

// Hero
.hero-section
  background: linear-gradient(135deg, #655529 0%, #8b7340 50%, #a08850 100%)
  color: white
  padding: 80px 24px 60px
  text-align: center
  position: relative
  overflow: hidden

  &::before
    content: ''
    position: absolute
    top: -50%
    left: -50%
    width: 200%
    height: 200%
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)
    animation: pulse 8s ease-in-out infinite

@keyframes pulse
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.1)

.hero-content
  position: relative
  z-index: 1
  max-width: 700px
  margin: 0 auto

.hero-icon-container
  margin-bottom: 24px
  .q-icon
    opacity: 0.9

.hero-title
  font-size: 2.8rem
  font-weight: 700
  margin: 0 0 12px
  line-height: 1.2
  letter-spacing: -0.02em

.hero-subtitle
  font-size: 1.2rem
  opacity: 0.9
  margin: 0 0 8px
  font-weight: 400

.hero-description
  font-size: 1rem
  opacity: 0.7
  margin: 0 0 32px

.hero-actions
  display: flex
  gap: 16px
  justify-content: center
  flex-wrap: wrap

.hero-btn
  border-radius: 8px
  padding: 8px 28px
  font-weight: 600

// Features
.features-section
  padding: 60px 24px
  max-width: 1100px
  margin: 0 auto

.features-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))
  gap: 24px

.feature-card
  padding: 28px 24px
  border-radius: 12px
  border: 1px solid #e8e8e8
  transition: transform 0.2s, box-shadow 0.2s
  text-align: center

  &:hover
    transform: translateY(-4px)
    box-shadow: 0 8px 25px rgba(0,0,0,0.08)

  h3
    font-size: 1.1rem
    font-weight: 600
    margin: 16px 0 8px
    color: #333

  p
    font-size: 0.9rem
    color: #666
    line-height: 1.5
    margin: 0

// Quick Start
.quickstart-section
  padding: 40px 24px 60px
  max-width: 700px
  margin: 0 auto

.section-title
  font-size: 1.6rem
  font-weight: 700
  text-align: center
  margin: 0 0 24px
  color: #333

.quickstart-grid
  display: flex
  flex-direction: column
  gap: 12px

.quickstart-card
  border-radius: 10px
  transition: box-shadow 0.2s
  cursor: pointer

  &:hover
    box-shadow: 0 4px 15px rgba(0,0,0,0.1)

// Footer
.boot-footer
  text-align: center
  padding: 24px
  border-top: 1px solid #e8e8e8
  color: #999
  font-size: 0.85rem

  .footer-link
    color: #655529
    text-decoration: none
    font-weight: 500

    &:hover
      text-decoration: underline

// Dark mode
body.body--dark
  .feature-card
    border-color: #333
    h3
      color: #e0e0e0
    p
      color: #aaa

  .section-title
    color: #e0e0e0

  .boot-footer
    border-color: #333
    .footer-link
      color: #c4a856
</style>
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
## Installation

Create a new Docsector documentation project:

\\\`\\\`\\\`bash
npx @docsector/docsector-reader init my-docs
cd my-docs
npm install
\\\`\\\`\\\`

## Development Server

Start the development server with hot-reload:

\\\`\\\`\\\`bash
npm run dev
\\\`\\\`\\\`

Open **http://localhost:8181** in your browser.

## Project Structure

Here's an overview of the project files:

| File / Folder | Description |
| --- | --- |
| \\\`docsector.config.js\\\` | Branding, links, languages, and GitHub config |
| \\\`quasar.config.js\\\` | Quasar/Vite build configuration (via factory) |
| \\\`src/pages/index.js\\\` | Page registry — defines all documentation pages |
| \\\`src/pages/boot.js\\\` | Boot metadata for the home page |
| \\\`src/pages/@/\\\` | Special pages (Home, 404) |
| \\\`src/pages/guide/\\\` | Guide pages (Markdown files) |
| \\\`src/i18n/languages/\\\` | Translation files (HJSON format) |
| \\\`src/css/app.sass\\\` | Custom styles |
| \\\`public/images/\\\` | Static assets (logo, flags, icons) |

## Adding a Page

1. Register the page in \\\`src/pages/index.js\\\`
2. Create the Markdown file at \\\`src/pages/{type}/{path}.overview.{lang}.md\\\`
3. The page will automatically appear in the sidebar navigation

## Customization

Edit \\\`docsector.config.js\\\` to change:

- **Branding** — logo, name, version
- **Links** — GitHub, changelog, sponsor
- **Languages** — add or remove supported locales
- **GitHub** — edit page base URL

## Building for Production

\\\`\\\`\\\`bash
npm run build
\\\`\\\`\\\`

The optimized SPA output will be in \\\`dist/spa/\\\`.
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
  console.log('    ├── package.json')
  console.log('    ├── index.html')
  console.log('    ├── postcss.config.cjs')
  console.log('    ├── .gitignore')
  console.log('    ├── public/')
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
  console.log('            ├── index.js')
  console.log('            ├── boot.js')
  console.log('            ├── @/')
  console.log('            │   ├── BootPage.vue')
  console.log('            │   └── 404Page.vue')
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
