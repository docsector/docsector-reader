## Overview

Code example blocks render project Vue SFCs as live previews inside Markdown pages.

They are useful when documentation needs to show the real behavior of a component and still let readers inspect the exact source behind the preview.

The block is authored with the custom Markdown element `<d-block-code-example>`.

## Example Files

Place example components under `src/examples/**/*.vue` in the project using Docsector.

Docsector discovers those files at build time through Vite. The `src` value is normalized to kebab-case, so this block:

```html
<d-block-code-example src="manual/code-examples/basic-counter" title="Basic counter" />
```

resolves this file:

```text
src/examples/manual/code-examples/BasicCounter.vue
```

You can also use `file` instead of `src` when migrating examples from Quasar Docs patterns.

## Attributes

| Attribute | Purpose |
|-----------|---------|
| `src` | Example id under `src/examples/**/*.vue` |
| `file` | Alias for `src` |
| `title` | Header title shown above the preview |
| `expanded` | Opens the source panel by default when set to `true` |
| `codepen` | Shows the CodePen action unless set to `false` |
| `scrollable` | Gives the preview a fixed scrollable height |
| `overflow` | Allows both horizontal and vertical overflow in the preview |
| `height` | Sets a custom preview height, such as `360` or `420px` |

## Source Panel

The source button opens the Vue SFC split into Template, Script, Style, and All tabs when those sections are present.

The source panel reuses the standard Docsector code block renderer, so readers get syntax highlighting, copy support, and the same dark/light treatment as regular code blocks.

## GitHub Source Link

The GitHub button opens the example SFC in the project repository when Docsector can derive a repository URL from `github.editBaseUrl` or `links.github` in `docsector.config.js`.

## CodePen Export

The CodePen button is available when the source can be transformed safely for a browser-only demo.

The first implementation supports plain Vue SFCs with a template, optional style, and an Options API `export default` script. Named imports from `vue` and `quasar` are converted to browser globals. Examples that use `<script setup>`, TypeScript scripts, or local imports still render in Docsector, but the CodePen action is disabled.

Set `codepen="false"` when an example is intentionally not meant to be exported.