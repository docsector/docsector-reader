## Overview

The AI Assistant adds an optional documentation chat panel to Docsector pages. It is designed for semantic RAG workflows on Cloudflare while keeping the browser integration simple: users open a drawer from the global header, and the Cloudflare Pages Function talks to the configured AI provider.

The first provider is Cloudflare AI Search. It can crawl Docsector's generated Markdown sitemap, retrieve relevant chunks with hybrid search, and stream an answer with source chunks that the panel can show as citations.

## What It Adds

- A right-side assistant drawer on desktop.
- A fullscreen assistant dialog on mobile.
- Suggested prompts, current-page context, streaming responses, and source links.
- Build-time AI Search artifacts when `siteUrl` is configured.
- A same-origin internal endpoint so credentials stay server-side.

## Enable It

```javascript
export default {
  siteUrl: 'https://docs.example.com',

  aiAssistant: {
    enabled: true,
    provider: 'aiSearch',
    endpoint: '/assistant',
    aiSearch: {
      binding: 'AI_SEARCH',
      instanceName: 'docs-search',
      accountIdEnv: 'CLOUDFLARE_ACCOUNT_ID',
      apiTokenEnv: 'CLOUDFLARE_API_TOKEN',
      retrievalType: 'hybrid',
      maxResults: 6,
      stream: true
    }
  }
}
```

## Cloudflare AI Search

Create an AI Search instance and configure a Website data source. Docsector always publishes `/sitemap.xml` during build and advertises it from `robots.txt`, so Cloudflare's crawler can discover the site automatically.

For cleaner retrieval, point the specific sitemap setting to:

```text
https://docs.example.com/ai-search-sitemap.xml
```

The AI Search sitemap points to Markdown URLs, which are cleaner for retrieval than rendered SPA HTML. The manifest at `/.well-known/ai-search/manifest.json` lists titles, routes, locales, books, versions, and subpages for the same source set.

## Runtime Endpoint

The generated Pages Function accepts chat messages, current route metadata, locale, and optional selected page text. It forwards the request to AI Search by binding when available, or by REST using encrypted Cloudflare environment variables. The endpoint is an internal API for the drawer, not a page users navigate to.

The browser never needs a Cloudflare API token.

## Validate

```bash
npx docsector build
cat dist/spa/sitemap.xml
cat dist/spa/robots.txt
cat dist/spa/ai-search-sitemap.xml
cat dist/spa/.well-known/ai-search/manifest.json
npx wrangler pages dev dist/spa
```

Remote AI Search and Workers AI bindings can incur Cloudflare usage during local development.
