## Overview

Raw HTML can be used inside Markdown when the native Markdown syntax is not expressive enough.

This is useful for custom wrappers, inline labels, keyboard shortcut keycaps, embedded elements, and Docsector-specific custom elements such as expandable blocks and quick links.

## Markdown Example

```html
<div data-kind="secondary-note">
  This block uses raw HTML inside the page source.
</div>

Press <kbd>⌘</kbd> + <kbd>B</kbd> to toggle bold text.
```

## Notes

- Prefer plain Markdown first when it already solves the problem.
- Use raw HTML when you need structure or attributes that Markdown does not provide.
- Author GitBook-style keyboard shortcuts with `<kbd>...</kbd>` when you want keycaps inside normal prose.
- Keep the markup readable, because documentation content still needs to be maintained by humans.