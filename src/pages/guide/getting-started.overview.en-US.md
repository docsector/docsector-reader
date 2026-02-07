## What is Docsector Reader?

Docsector Reader is a **documentation rendering engine** built with Vue 3, Quasar v2, and Vite. It transforms Markdown content into a beautiful, navigable documentation site — complete with i18n, syntax highlighting, dark mode, and anchor navigation.

## Requirements

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn** 1.22+
- A terminal emulator

## Installation

```bash
npx degit docsector/docsector-reader my-docs
cd my-docs
npm install
```

## Development Server

Start the dev server with hot-reload:

```bash
npx quasar dev
```

The documentation site will be available at **http://localhost:8181**.

## Production Build

Build an optimized SPA for deployment:

```bash
npx quasar build
```

The output is placed in `dist/spa/` — ready to deploy to any static hosting.

## Project Structure

The project follows a standard Quasar v2 layout with documentation-specific conventions:

- `docsector.config.js` — Branding, links, languages
- `src/pages/index.js` — Page registry (routes and metadata)
- `src/pages/guide/` — Guide-type pages (Markdown files)
- `src/pages/manual/` — Manual-type pages (Markdown files)
- `src/components/` — Docsector Vue components
- `src/composables/` — Vue composables (useNavigator)
- `src/store/` — Vuex 4 modules
- `src/i18n/` — Language files (.hjson) and loader
- `src/layouts/` — DefaultLayout and SystemLayout
- `src/boot/` — Boot files (store, i18n, QZoom, axios)

## Next Steps

- Configure your project branding in **docsector.config.js**
- Define your pages in **src/pages/index.js**
- Write your documentation in **Markdown**
- Customize themes and appearance
