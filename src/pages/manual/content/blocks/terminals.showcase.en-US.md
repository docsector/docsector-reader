## Showcase

### Single Command

This terminal runs the built-in `demo-echo` engine shipped with Docsector Reader.

<d-block-terminal engine="demo-echo" title="Echo demo" command="echo Hello, Docsector!">
Click Run — the engine streams ANSI-colored output into the terminal, character by character.
</d-block-terminal>

### Command Picker

Use `commands` to offer several commands in a single terminal.

<d-block-terminal
  engine="demo-echo"
  title="Echo demo — picker"
  commands="Hello:echo Hello, Docsector!|Terminals:echo Terminals are alive|Streaming:echo Streaming ANSI output"
  height="300"
>
Pick a command in the tab strip, then Run. The source button shows what the engine exposes for the selected command.
</d-block-terminal>

## Authoring Syntax

```html
<d-block-terminal engine="demo-echo" title="Echo demo" command="echo Hello, Docsector!">
Optional caption rendered as inline Markdown.
</d-block-terminal>

<d-block-terminal
  engine="demo-echo"
  title="Echo demo — picker"
  commands="Hello:echo Hello, Docsector!|Terminals:echo Terminals are alive"
  height="300"
/>
```

## Features Visible Above

- **Lazy loading** — xterm.js and the engine load on the first Run, not at page render
- **Streaming output** — chunks are written to the terminal as the engine emits them
- **ANSI support** — colors, `\r` overwrites and cursor sequences render natively
- **Command picker** with pipe-separated `Label:command` pairs
- **Source panel** backed by the engine's `source()` hook
- **Inline Markdown caption** below the terminal
