## Overview

The AI Assistant adds an optional documentation chat panel to Docsector pages. It is designed for semantic RAG workflows on Cloudflare while keeping the browser integration simple: users open a drawer from the global header, and the Cloudflare Pages Function talks to the configured AI provider.

The first provider is Cloudflare AI Search. It can crawl Docsector's generated Markdown sitemap, retrieve relevant chunks with hybrid search, and stream an answer with source chunks that the panel can show as citations.

## What It Adds

- A right-side assistant drawer on desktop.
- A fullscreen assistant dialog on mobile.
- Suggested prompts, opt-in current-page context, streaming responses, and source links.
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
      instanceNameEnv: 'AI_SEARCH_INSTANCE_NAME',
      accountIdEnv: 'CLOUDFLARE_ACCOUNT_ID',
      apiTokenEnv: 'CLOUDFLARE_API_TOKEN',
      retrievalType: 'hybrid',
      maxResults: 6,
      stream: true
    }
  }
}
```

Set `AI_SEARCH_INSTANCE_NAME` in Cloudflare Pages environment variables for deployed environments, or in `.dev.vars` when running `wrangler pages dev` locally.

## Page Context

The composer has a **Page context** chip. When it is on, the full Markdown of the page the reader is looking at is attached to the prompt, so the assistant can answer "summarize this page" or "what does this mean?" verbatim.

It is **off by default**. Most questions are not about the current page, and attaching it anyway spends the model's context window on text nobody asked about. The reader turns it on when they want it, and the choice is remembered in `localStorage` under `docsector.assistant.context.v1`.

Off does **not** mean the assistant is blind to the page. Retrieval still runs over your whole indexed documentation, and the current page is part of that index — the chip only controls the *guaranteed, verbatim* copy. The page title and route are always sent, and so is any text the reader has selected.

When the chip is off, the endpoint skips the asset fetch entirely, so the request is cheaper and faster, not just shorter.

### Page-dependent prompts

A suggested prompt that only makes sense with the page attached can say so. Clicking it turns the chip on, so the reader sees why:

```javascript
suggestedPrompts: [
  'How do I get started?',
  { text: 'Summarize this page.', pageContext: true },
  'Where is the related API reference?'
]
```

Both forms work in the same list: a plain string is a prompt that does not need the page. The object form requires Docsector Reader 4.17.0 or newer — older versions ignore object entries.

There is no configuration key for the default. To reword the chip, override `assistant.pageContext.label`, `assistant.pageContext.on` and `assistant.pageContext.off` in your language files.

## Cloudflare AI Search

Create an AI Search instance and configure a Website data source. Docsector always publishes `/sitemap.xml` during build and advertises it from `robots.txt`, so Cloudflare's crawler can discover the site automatically.

For cleaner retrieval, point the specific sitemap setting to:

```text
https://docs.example.com/ai-search-sitemap.xml
```

The AI Search sitemap points to Markdown URLs, which are cleaner for retrieval than rendered SPA HTML. Docsector keeps it available for explicit Cloudflare configuration, but does not auto-advertise it from `robots.txt` to avoid duplicate indexing alongside `/sitemap.xml`. The manifest at `/.well-known/ai-search/manifest.json` lists titles, routes, locales, books, versions, and subpages for the same source set.

## Runtime Endpoint

The generated Pages Function accepts chat messages, current route metadata, locale, optional selected page text, and the page-context flag. It reads the current page's Markdown from your deployed assets only when that flag is set, then forwards the request to AI Search by binding when available, or by REST using encrypted Cloudflare environment variables. The endpoint is an internal API for the drawer, not a page users navigate to.

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
