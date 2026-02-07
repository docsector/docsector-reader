# Docsector Reader

> A documentation rendering engine built with Vue 3, Quasar v2 and Vite.

Transform Markdown content into beautiful, navigable documentation sites — with i18n, syntax highlighting, dark/light mode, and anchor navigation.

## Features

- **Markdown Rendering** — Write docs in Markdown, rendered with syntax highlighting (Prism.js)
- **Internationalization (i18n)** — Multi-language support with HJSON locale files and per-page translations
- **Dark/Light Mode** — Automatic theme switching with Quasar Dark Plugin
- **Anchor Navigation** — Right-side Table of Contents tree with scroll tracking
- **Search** — Menu search across all documentation content and tags
- **Responsive** — Mobile-friendly with collapsible sidebar and drawers
- **Status Badges** — Mark pages as `done`, `draft`, or `empty` with visual indicators
- **Edit on GitHub** — Direct links to edit pages on your repository
- **Translation Progress** — Automatic translation percentage based on header coverage
- **Single Config File** — Customize branding, links, and languages via `docsector.config.js`

## Quick Start

### Install from NPM

```bash
npm install @docsector/docsector-reader
```

### Scaffold a new project

```bash
npx degit docsector/docsector-reader my-docs
cd my-docs
npm install
```

### Development

```bash
npx docsector dev
# or
npx quasar dev
```

The documentation site will be available at **http://localhost:8181**.

### Production Build

```bash
npx docsector build
# or
npx quasar build
```

Output is placed in `dist/spa/` — ready to deploy to any static hosting.

## Configuration

Edit `docsector.config.js` at the project root:

```javascript
export default {
  branding: {
    logo: '/images/logo.png',
    name: 'My Project',
    version: 'v1.0.0'
  },

  links: {
    github: 'https://github.com/org/repo',
    discussions: 'https://github.com/org/repo/discussions',
    chat: 'https://discord.gg/invite',
    changelog: '/changelog'
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

## Project Structure

```
├── docsector.config.js      # Branding, links, languages
├── src/
│   ├── pages/
│   │   ├── index.js         # Page registry (routes + metadata)
│   │   ├── guide/           # Guide pages (.md files)
│   │   └── manual/          # Manual pages (.md files)
│   ├── components/          # Docsector Vue components
│   ├── composables/         # Vue composables (useNavigator)
│   ├── store/               # Vuex 4 modules
│   ├── i18n/                # Language files (.hjson) + loader
│   ├── layouts/             # DefaultLayout + SystemLayout
│   └── boot/                # Boot files (store, i18n, QZoom, axios)
└── public/                  # Static assets (logo, flags, icons)
```

## Adding Pages

1. Register in `src/pages/index.js`:

```javascript
export default {
  '/my-page': {
    config: {
      icon: 'description',
      status: 'done',        // 'done' | 'draft' | 'empty'
      type: 'guide',         // 'guide' | 'manual'
      menu: {},
      subpages: { showcase: false }
    },
    data: {
      'en-US': { title: 'My Page' },
      'pt-BR': { title: 'Minha Página' }
    }
  }
}
```

2. Create Markdown files:

```
src/pages/guide/my-page.overview.en-US.md
src/pages/guide/my-page.overview.pt-BR.md
```

## CLI Commands

```bash
docsector dev              # Start dev server (port 8181)
docsector dev --port 3000  # Custom port
docsector build            # Build for production
docsector serve            # Serve production build
docsector help             # Show help
```

## Programmatic API

```javascript
import { createDocsector, definePage } from '@docsector/docsector-reader'

const config = createDocsector({
  branding: { name: 'My Docs', version: 'v2.0.0' },
  links: { github: 'https://github.com/org/repo' }
})
```

## Tech Stack

- **Vue 3** (Composition API + `<script setup>`)
- **Quasar v2** (UI framework)
- **Vite** (Build tool)
- **Vuex 4** (State management)
- **vue-i18n 9** (Internationalization)
- **markdown-it** (Markdown parsing)
- **Prism.js** (Syntax highlighting)
- **HJSON** (Human-friendly JSON for locale files)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

Copyright (c) 2018-Present — Rodrigo de Araujo Vieira

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
