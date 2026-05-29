## Showcase

### Basic Counter

This example is rendered from a real Vue SFC under `src/examples/manual/code-examples/BasicCounter.vue`.

<d-block-code-example src="manual/code-examples/basic-counter" title="Basic counter">
Use the source button to inspect the SFC sections, or open the compatible demo in CodePen.
</d-block-code-example>

### Expanded Source by Default

Use `expanded="true"` when the source code is part of the lesson and should be visible as soon as the reader reaches the example.

<d-block-code-example src="manual/code-examples/inline-notice" title="Expanded source example" expanded="true">
This example intentionally starts with the source panel open.
</d-block-code-example>

## Authoring Syntax

```html
<d-block-code-example src="manual/code-examples/basic-counter" title="Basic counter">
Optional caption rendered as inline Markdown.
</d-block-code-example>

<d-block-code-example src="manual/code-examples/inline-notice" title="Expanded source example" expanded="true">
The source panel starts open.
</d-block-code-example>
```

## Features Visible Above

- **Live preview** rendered from the bundled Vue component
- **Source toggle** with Template, Script, Style, and All tabs
- **CodePen action** for compatible examples
- **GitHub action** pointing to the example SFC
- **Expanded source state** with `expanded="true"`
- **Inline Markdown caption** below the preview