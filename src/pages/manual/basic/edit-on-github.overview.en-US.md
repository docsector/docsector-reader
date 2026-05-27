## Overview

Edit on GitHub gives readers a direct path from the current page to its Markdown source file.

This makes small documentation improvements faster, especially when the reader is already on the page that needs a change.

## What It Uses

The link is built from:

- `github.editBaseUrl` in `docsector.config.js`
- The current page path
- The current locale

## Status-Aware Labels

The button label adapts to page status:

- `done` or `new` → edit the page
- `draft` → complete the page
- `empty` → start the page

## Notes

- The target file follows the book, path, subpage, and locale naming convention.
- This action appears in the page footer area.