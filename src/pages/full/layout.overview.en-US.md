## Overview

The Full book is a working example of a book-level layout opt-in. It uses `layout: 'fullwidth'` in `src/pages/full.book.js`, so every page registered in `src/pages/full.index.js` inherits the fullwidth page chrome.

This page should render with the global header and book tabs, but without the left sidebar, subpage toolbar, Table of Contents toggle, or Table of Contents rail.

## Book Configuration

```javascript
import { defineBook } from '../index.js'

export default defineBook({
  id: 'full',
  label: 'Full',
  icon: 'fullscreen',
  order: 3,
  layout: 'fullwidth'
})
```

The `layout` field accepts two values:

- `default` keeps the standard documentation chrome.
- `fullwidth` keeps the global header and book tabs, then removes the book sidebar, subpage toolbar, and Table of Contents for pages in that book.

## When to Use It

Use a fullwidth book when a section needs more freedom than a reference page, such as:

- Product overview pages
- Landing-style documentation sections
- Rich Vue-driven pages
- Visual guides with wide screenshots or diagrams
- Documentation experiences that should not be constrained by a sidebar and Table of Contents

## Homepage Comparison

Homepage fullwidth is configured separately in `docsector.config.js`:

```javascript
export default {
  homePage: {
    source: 'local',
    layout: 'fullwidth'
  }
}
```

That setting is opt-in for the homepage only. A book-level `layout: 'fullwidth'` is opt-in for every page in that book.
