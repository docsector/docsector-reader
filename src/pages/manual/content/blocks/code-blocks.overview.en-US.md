## Overview

Code blocks are authored with standard fenced Markdown and rendered with syntax highlighting, line numbers, copy-to-clipboard, and optional metadata such as filenames, tabs, and breadcrumbs.

Docsector uses Prism.js for highlighting and automatically adapts the visual style to light and dark themes.

## Basic Syntax

````markdown
```bash
npm install
npm run dev
```
````

## Supported Languages

The built-in documentation currently ships with support for:

- `php`
- `bash`
- `html`
- `javascript`

Additional Prism languages can be added when the project needs them.

## Useful Attributes

Code fences support extra metadata with `:attr;` syntax:

| Attribute | Purpose |
|-----------|---------|
| `filename` | Shows a filename in the metadata bar |
| `group` | Joins consecutive blocks into tabs |
| `tab` | Sets the visible tab label |
| `breadcrumb` | Shows a path-like breadcrumb above the active block |
| `toolbar` | Forces the metadata bar on (`"true"`) or off (`"false"`) |

## The Metadata Bar

The metadata bar is the strip above the code that carries the language label and the copy button.

By default it appears only when the block has something worth acting on — a multi-line snippet, tabs, or a breadcrumb. A **single-line** block renders bare, so short one-liners stay visually quiet inside prose.

Use `toolbar` when that default is wrong for a given block:

````markdown
```bash :toolbar="true";
curl -fsSL https://example.com/install | bash
```
````

A single-line install command is the usual case: it is short, but it is the one line every reader wants to copy.

The override works both ways — `:toolbar="false";` strips the bar from a block that would otherwise get one, which suits long output dumps and ASCII trees nobody copies:

````markdown
```text :toolbar="false";
project/
├── src/
└── README.md
```
````

Line numbers are not affected by `toolbar`; they follow the line count on their own.

## What Readers Get

- Language-aware syntax highlighting
- Line numbers on multi-line snippets
- Copy button in the metadata bar, on any block that shows one
- Tabs for grouped examples
- Breadcrumbs and file icons when metadata is provided

## Example With Tabs

````markdown
```php :group="example"; :tab="example.php"; :breadcrumb="src > example.php";
echo "Hello";
```
```bash :group="example"; :tab="example.sh"; :breadcrumb="scripts > example.sh";
echo "Hello"
```
````
