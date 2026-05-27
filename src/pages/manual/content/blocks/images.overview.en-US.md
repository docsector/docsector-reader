## Overview

Use standard Markdown images to place screenshots, illustrations, diagrams, and product UI directly inside the reading flow.

When an image appears on its own line, Docsector renders it as a block figure with click-to-zoom behavior.
For plain Markdown images, the label is used as both the visible caption and the alt text, matching GitBook's block image model.

## Markdown Syntax

```markdown
![Dashboard overview](/images/example-dashboard.png)
```

## Separate Alt Text And Caption

Use raw HTML when the accessibility text and the visible caption should be different, or when you need `<picture>` / `<source>` for light and dark mode variants.

```html
<figure>
	<picture>
		<source srcset="/images/logo-dark.png" media="(prefers-color-scheme: dark)">
		<img src="/images/logo-light.png" alt="Docsector Reader logo">
	</picture>
	<figcaption><p>Docsector Reader brand mark</p></figcaption>
</figure>
```

## Good Practices

- Write labels that still make sense without the visual, because plain Markdown uses the same text for caption and alt.
- Use `<figure>` with `<figcaption>` when the visible caption should differ from the accessibility text.
- Prefer absolute site paths such as `/images/...` for assets stored in `public/images/`.
- Use screenshots to support the text, not replace the explanation.
- Click standalone block images to zoom; inline images that stay inside a paragraph remain on the inline path.