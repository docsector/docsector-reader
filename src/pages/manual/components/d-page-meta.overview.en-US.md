## Overview

`DPageMeta` is the **page footer** component that displays GitHub integration, translation progress, and prev/next navigation links.

## Sections

### Edit on GitHub

A button that links to the Markdown source file on GitHub. The URL is composed of:

- `docsector.config.js` → `github.editBaseUrl`
- Current route path (transformed to match the file naming convention)
- Current locale

The button label changes based on page status:

| Status | Label | Color |
|--------|-------|-------|
| `done` | "Edit this page" | White |
| `draft` | "Complete this page" | Warning (orange) |
| `empty` | "Start this page" | Red |

### Translation Progress

Two chips are displayed:

- **Language progress** — Shows the translation completion percentage for the current locale based on `_sections.done / _sections.count` metadata
- **Available translations** — Shows how many locales have translations compared to total available locales

### Previous/Next Navigation

Links to the previous and next pages in the route sequence. The page title is loaded from i18n. Links are only shown when adjacent pages exist.

## Store Integration

- `page/base` — Current page for finding prev/next routes
- `i18n/absolute` — Path for loading translation metadata

## Configuration

The "Edit on GitHub" URL is built from `docsector.config.js`:

```javascript
github: &#123;
  editBaseUrl: 'https://github.com/org/docs/edit/main/src/pages'
&#125;
```

## Disabling

DPageMeta is automatically excluded when `DPage` has `disableNav` prop set to `true`.
