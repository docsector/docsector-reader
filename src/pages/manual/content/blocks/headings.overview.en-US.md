## Overview

Headings organize the reading flow and power the right-side table of contents.

In Docsector, each body heading becomes a navigable anchor automatically, so readers can jump through the page while the URL hash and ToC stay in sync.

## Markdown Levels

| Markdown | HTML | Typical use |
|----------|------|-------------|
| `#` | `<h1>` | Page title generated from the page metadata |
| `##` | `<h2>` | Main sections |
| `###` | `<h3>` | Sub-sections |
| `####` | `<h4>` | Detail sections |
| `#####` | `<h5>` | Minor sections |
| `######` | `<h6>` | Very small subdivisions |

## Authoring Notes

- In page content, the first heading you usually write is `##`, because the page title is already handled for you.
- Keep heading levels in order whenever possible. Skipping levels makes the ToC harder to scan.
- Use headings to break long pages into chunks that can be bookmarked and linked.

## What Docsector Handles

- Registers headings as anchors in the page ToC
- Keeps navigation hashes aligned with the selected heading
- Builds the section tree automatically from the Markdown structure

## Markdown Example

```markdown
## Installation

Short introduction.

### Environment variables

Extra setup details.

#### Optional flags

Notes for advanced readers.
```
