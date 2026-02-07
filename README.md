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

## ✨ Features

- 📝 **Markdown Rendering** — Write docs in Markdown, rendered with syntax highlighting (Prism.js)
- 🌍 **Internationalization (i18n)** — Multi-language support with HJSON locale files and per-page translations
- 🌗 **Dark/Light Mode** — Automatic theme switching with Quasar Dark Plugin
- 🔗 **Anchor Navigation** — Right-side Table of Contents tree with scroll tracking
- 🔎 **Search** — Menu search across all documentation content and tags
- 📱 **Responsive** — Mobile-friendly with collapsible sidebar and drawers
- 🏷️ **Status Badges** — Mark pages as `done`, `draft`, or `empty` with visual indicators
- ✏️ **Edit on GitHub** — Direct links to edit pages on your repository
- 📊 **Translation Progress** — Automatic translation percentage based on header coverage
- ⚙️ **Single Config File** — Customize branding, links, and languages via `docsector.config.js`

---

## 🚀 Quick Start

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

  languages: [
    { image: '/images/flags/united-states-of-america.png', label: 'English (US)', value: 'en-US' },
    { image: '/images/flags/brazil.png', label: 'Português (BR)', value: 'pt-BR' }
  ],

  defaultLanguage: 'en-US'
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
