## Overview

Files render a download card directly inside Markdown so a page or subpage can publish attachments without leaving the normal authoring flow.

They are useful for checklists, sample bundles, PDFs, release notes, and any other file that should be linked from the reading flow.

## Markdown Syntax

```html
<d-file src="/files/manual/release-checklist.txt" title="Release checklist" size="1 KB">
Download the example attachment used in this manual.
</d-file>
```

You can also omit the caption body when the file name already provides enough context:

```html
<d-file src="/files/manual/release-checklist.txt" size="1 KB" />
```

## Notes

- Store small repo-tracked attachments under `public/files/` and prefer absolute paths such as `/files/...`.
- `src` is required. `title` and `size` are optional.
- When `title` is omitted, the rendered card falls back to the file name from `src`.
- The block body is rendered as an inline Markdown caption.
- External URLs also work, so the same syntax can point to a future R2 bucket or another CDN.