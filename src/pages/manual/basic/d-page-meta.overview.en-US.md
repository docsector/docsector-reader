## Overview

Page Footer is the **bottom information area** that shows GitHub actions, page feedback, and previous/next navigation.

Under the hood, this page describes `DPageMeta`.

## Focused Pages in Basic

- [Edit on GitHub](/manual/basic/edit-on-github/overview/)
- [Page Feedback](/manual/basic/page-feedback/overview/)
- [Previous & Next](/manual/basic/previous-and-next/overview/)

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
| `new` | "Edit this page" | White |
| `draft` | "Complete this page" | Warning (orange) |
| `empty` | "Start this page" | Red |

### Page Feedback

When `feedback.enabled` is `true`, a **"Was this helpful?"** prompt with three faces sits on the right of the GitHub button. Each vote is recorded by a generated Cloudflare Pages Function. See [Page Feedback](/manual/basic/page-feedback/overview/) for the setup.

### Previous/Next Navigation

Links to the previous and next pages in the route sequence. The page title is loaded from i18n. Links are only shown when adjacent pages exist.

## Store Integration

- `page/base` — Current page for finding prev/next routes
- `page/relative` — Current subpage, used to build the "Edit on GitHub" URL

## Configuration

The "Edit on GitHub" URL is built from `docsector.config.js`:

```javascript
github: &#123;
  editBaseUrl: 'https://github.com/org/docs/edit/main/src/pages'
&#125;
```

## Disabling

The footer is automatically excluded when `DPage` has `disableNav` prop set to `true`.
