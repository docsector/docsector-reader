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

## What Readers Get

- Language-aware syntax highlighting
- Line numbers on multi-line snippets
- Copy button in the metadata bar
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
