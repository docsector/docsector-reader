## Overview

Cards render a responsive grid of linked content blocks directly inside Markdown.

They are useful for landing sections, curated resource lists, and any place where a plain list of links feels too flat.

## Markdown Syntax

```html
<d-block-cards title="Explore more">
  <d-block-card
    title="Install"
    description="Set up the project"
    to="/guide/getting-started"
    image="/images/cards/getting-started-cover.svg"
  />
  <d-block-card
    title="GitHub"
    description="Open the repository"
    href="https://github.com/docsector/docsector-reader"
    icon="launch"
  />
</d-block-cards>
```

## Notes

- Use `to` for internal navigation and `href` for external URLs.
- Add `image` when the card should feel more like a landing-page tile.
- Add `icon` when the card has no image but still needs a stronger visual cue.
- Short descriptions scan better than paragraph-sized copy.
- Cover images look best in a wide format such as 16:9.