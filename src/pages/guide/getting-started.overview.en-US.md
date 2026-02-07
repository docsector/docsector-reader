## What is Docsector Reader?

Docsector Reader is a **documentation rendering engine** built with Vue 3, Quasar v2, and Vite. It transforms Markdown content into a beautiful, navigable documentation site — complete with i18n, syntax highlighting, dark mode, and anchor navigation.

## Requirements

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn** 1.22+
- A terminal emulator

## Installation

Scaffold a new documentation project with the CLI:

```bash
npx @docsector/docsector-reader init my-docs
cd my-docs
npm install
```

This creates a ready-to-use project with all necessary configuration files, a sample page registry, and i18n setup.

## Development Server

Start the dev server with hot-reload:

```bash
npx docsector dev
```

The documentation site will be available at **http://localhost:8181**.

You can also specify a custom port:

```bash
npx docsector dev --port 3000
```

## Production Build

Build an optimized SPA for deployment:

```bash
npx docsector build
```

The output is placed in `dist/spa/` — ready to deploy to any static hosting.

To preview the production build locally:

```bash
npx docsector serve
```

## Project Structure

After `init`, your project will have this structure:

- `docsector.config.js` — Branding, links, languages, GitHub config
- `quasar.config.js` — Thin wrapper using `createQuasarConfig()` from the package
- `index.html` — HTML entry point with title and meta tags
- `src/pages/index.js` — Page registry (routes and metadata)
- `src/pages/guide/` — Guide-type pages (Markdown files)
- `src/pages/manual/` — Manual-type pages (Markdown files)
- `src/i18n/index.js` — i18n loader using `buildMessages()` from the package
- `src/i18n/tags.hjson` — Search keywords per route and locale
- `public/` — Static assets (logo, favicon, images)

The rendering engine (components, layouts, router, store, composables) lives inside the `@docsector/docsector-reader` package — you only maintain your content and configuration.

## Next Steps

- Configure your project branding in **docsector.config.js**
- Define your pages in **src/pages/index.js**
- Write your documentation in **Markdown**
- Add search keywords in **src/i18n/tags.hjson**
- Customize themes and appearance
