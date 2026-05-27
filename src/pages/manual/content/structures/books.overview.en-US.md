## Overview

Books define the top-level documentation sections that appear as primary tabs, such as Manual and Guide.

A book is configured in a `*.book.js` file. It is not a Vue component and it does not render page content by itself.

## Example

```javascript
import { defineBook } from '../index.js'

export default defineBook({
  id: 'manual',
  label: 'Manual',
  icon: 'menu_book',
  order: 1,
  color: {
    active: 'white',
    inactive: 'white'
  }
})
```

## What a Book Controls

- The tab label shown in the main navigation
- The icon used for that tab
- The order of the top-level sections
- Active and inactive tab colors
- The stable id referenced by page registries

## Notes

- Use one `*.book.js` file per top-level section.
- Page registries such as `manual.index.js` and `guide.index.js` attach entries to a book with the `book` field.
- A book groups pages under a common tab and route prefix.