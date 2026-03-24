## Overview

`DMermaidDiagram` is an internal component responsible for rendering **Mermaid** diagrams. It intercepts code blocks fenced with the `mermaid` language indicator and renders them as SVG visuals instead of formatted text.

The component uses lazy-loading — the `mermaid` library is only fetched when a diagram is present on the page, keeping the initial bundle size small.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `content` | `String` | Yes | — | The raw Mermaid definition syntax |

## Features

### Direct Rendering

Diagrams are parsed and rendered directly into SVGs via the official `mermaid.render()` API. The SVGs are fully responsive.

### Dark/Light Mode Aware

The diagrams inherit their theme dynamically. When `$q.dark.isActive` toggles, `DMermaidDiagram` detects the change, re-initializes Mermaid with the new theme context, and entirely redraws the instance to match Docsector's overall appearance.

### Error Handling

If the provided syntax is invalid, the component gracefully catches the parsing error and displays a structured error block along with the raw source code.

This guarantees the page will not break and aids during development.

### HTML Entity Decoding

Curly braces `&#123;` and `&#125;` are properly decoded before rendering, ensuring compatibility with Vue's i18n interpolation requirements while allowing Mermaid logic to function intact.