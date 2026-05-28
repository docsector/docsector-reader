## Overview

Quick Links render a card-like list of internal or external destinations directly inside Markdown.

They are useful for homepages, landing sections, and any page that should offer clear next steps without writing a long list of prose links.

## Markdown Syntax

```html
<d-block-quick-links title="Get started">
  <d-block-quick-link
    title="Install"
    description="Set up the project"
    to="/guide/getting-started"
  />
  <d-block-quick-link
    title="GitHub"
    description="Open the repository"
    href="https://github.com/docsector/docsector-reader"
  />
</d-block-quick-links>
```

## Notes

- Use `to` for internal navigation and `href` for external URLs.
- Add short descriptions so the cards explain why the destination matters.
- Use a small set of links per group to keep scanning easy.