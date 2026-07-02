## Overview

Terminal blocks embed a live, runnable terminal inside Markdown pages.

The block renders an xterm.js terminal with a Run button, an optional command picker, a source panel, and a status indicator. What actually executes is provided by the project through a small **engine** module — Docsector ships the UI, the project ships the runtime (a PHP-WASM CLI, a JS simulator, anything that can stream text).

The block is authored with the custom Markdown element `<d-block-terminal>`.

## Engines

Place engine modules under `src/terminals/**/*.js` in the project using Docsector.

Docsector discovers those files at build time through Vite. The `engine` value is normalized to kebab-case, so this block:

```html
<d-block-terminal engine="demo-echo" title="Echo demo" />
```

resolves this file:

```text
src/terminals/demo-echo.js
```

An engine module default-exports an async factory and may export a `meta` object:

```js
export const meta = { label: 'My CLI (WASM)', language: 'php' }

export default async function createEngine ({ onOutput, onError, onStatus }) {
  return {
    async run (command, { columns = 80, rows = 24 } = {}) {
      onOutput('streamed chunk…') // write to the terminal as data arrives
      return 0                    // resolve when the command finishes
    },
    async source (command) {      // optional: powers the source panel
      return { text: '…', language: 'php', url: 'https://github.com/…' }
    },
    input (data) {},              // optional: receives keyboard/mouse data typed into the terminal
    async stop () {},             // optional: interrupt the current run (shows a Stop button)
    async dispose () {}           // optional: teardown on unmount
  }
}
```

The factory itself must be cheap: it runs at page mount so the source panel and the Stop wiring are available before the first run. Heavy work — downloading a runtime, booting a VM — belongs inside `run()`.

`onStatus(phase, detail)` accepts the phases `downloading`, `extracting`, `booting` and `running` — the block maps them to user-facing status copy while the engine prepares heavy runtimes.

## Interactivity

When the engine implements `input(data)`, the terminal becomes interactive: the block enables the xterm.js stdin and forwards everything the reader types to the engine, byte-for-byte (arrow keys arrive as ANSI escape sequences such as `\x1b[A`, Enter arrives as `\r`). Mouse events are forwarded the same way once the guest application enables terminal mouse tracking (SGR sequences).

Keyboard capture is **click-to-focus**: the terminal only steals keys after the reader clicks inside it, and releases them on blur (Tab or a click outside). While an interactive run has no focus, the block overlays a "Click to interact" hint.

`Ctrl+C` inside a focused terminal is not delivered to the engine: when the engine also implements `stop()`, the block maps it to the same interrupt as the Stop button.

## Lazy Loading

Nothing heavy loads at page render: xterm.js and the engine module are dynamically imported only when the reader clicks Run (or when the block becomes visible, with `autorun="true"`). Engines should follow the same rule and fetch their runtime (for example a multi-megabyte `.wasm`) inside the first `run()` call, reporting progress via `onStatus`.

## Attributes

| Attribute | Purpose |
|-----------|---------|
| `engine` | Engine id under `src/terminals/**/*.js` (required) |
| `title` | Toolbar title; falls back to the engine `meta.label` |
| `command` | Single command passed to the engine `run()` |
| `commands` | Command picker: pipe-separated `Label:command` pairs |
| `autorun` | Runs on first visibility when set to `true` |
| `height` | Terminal viewport height, such as `360` or `420px` |
| `run-label` | Custom label for the Run button |

The element content (between the opening and closing tags) becomes a caption rendered as inline Markdown below the terminal.

## Command Picker

`commands` renders a tab strip right below the toolbar. Each entry is `Label:command`, separated by `|`:

```html
<d-block-terminal
  engine="demo-echo"
  commands="Hello:echo Hello!|Docs:echo Docs are alive"
/>
```

Before the first run, picking a tab only selects it — the reader stays in control of when the runtime downloads. After the first run the runtime is warm, so switching tabs runs the selected command directly.

Tabs are deep-linkable: selecting a non-default tab records it in the page URL as a `?t<index>` query parameter (one per block). Reloading — or sharing the link — restores that tab and scrolls the block into view.

## Source Panel and GitHub Link

When the engine implements `source(command)`, the block shows a source toggle that renders the returned text with the standard Docsector code block renderer. If the returned object carries a `url`, the GitHub action opens it.
