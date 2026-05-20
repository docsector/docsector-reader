## Overview

`DPageSourceCode` renders **fenced code blocks** with syntax highlighting, line numbers, copy-to-clipboard functionality, optional filename display, tabs, and breadcrumbs. It uses **Prism.js** for highlighting.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `index` | `Number` | Yes | — | Unique index for anchor generation |
| `language` | `String` | No | `'html'` | Programming language for highlighting |
| `text` | `String` | No | `''` | Raw code text to display in simple mode |
| `filename` | `String` | No | `''` | Optional filename shown in the info bar |
| `breadcrumbs` | `Array` | No | `[]` | Breadcrumb segments shown above the code block |
| `tabs` | `Array` | No | `[]` | Tab items with label, language, text, and breadcrumbs |

## Supported Languages

Out of the box, DPageSourceCode supports:

- **PHP** — via `prismjs/components/prism-php`
- **Bash** — via `prismjs/components/prism-bash`
- **HTML** — built-in Prism support
- **JavaScript** — built-in Prism support

To add more languages, import additional Prism components in `DPageSourceCode.vue`.

## Features

### Syntax Highlighting

Code is highlighted at render time using `Prism.highlight()`. The highlighted HTML is injected via `v-html` into a `<code>` element.

### Line Numbers

When the code block has more than 1 line, line numbers are displayed on the left side. Each line number is a clickable anchor link.

### Copy to Clipboard

A copy button appears in the info bar. When clicked, it selects the current code content and copies it to the clipboard using `document.execCommand('copy')`.

### Tabs

Consecutive fenced code blocks with the same `group` attribute are rendered as tabs. Each block can define its visible tab label with `tab`; use that label as the filename when the group should look like editor tabs.

### Breadcrumbs

When a `breadcrumb` attribute is provided, it is rendered above the code block. Use `>` between segments, such as `src > components > DPageSourceCode.vue`.

### File Icons

Tab labels that look like filenames, such as `App.vue`, receive a Material Icon Theme file icon inline before the text. Breadcrumbs add the same file icon only to the final segment when that segment looks like a filename.

### Filename Display

When a `filename` prop is provided (extracted from the `:filename;` Markdown attribute), it appears in the info bar alongside the language identifier.

## Dark/Light Theme

DPageSourceCode has completely separate color schemes for:

- **Light mode** (`.white` class) — Traditional light syntax colors
- **Dark mode** (`.dark` class) — Dark background with vibrant token colors

The color scheme is automatically selected based on `$q.dark.isActive`.

## Anchor System

Each code block gets a letter-based anchor (A, B, C, ..., Z, AA, AB, ...) generated from its index. Line numbers within the code block are appended to this anchor (e.g., `#A1`, `#A2`).
