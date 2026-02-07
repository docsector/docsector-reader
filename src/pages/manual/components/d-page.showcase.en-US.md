## Showcase

Here is an example of how DPage is used inside DSubpage:

```html
<template>
  <d-page>
    <header>
      <d-h1 :id="0" />
    </header>
    <main>
      <d-page-section :id="id" />
    </main>
  </d-page>
</template>
```

The submenu toolbar automatically adapts to the page configuration. If only Overview is configured, the toolbar shows a single tab. When Showcase or Vs tabs are enabled, the toolbar expands with labeled buttons.

## Mobile Behavior

On mobile devices (`$q.screen.lt.md`), the submenu button labels are hidden, showing only icons. The right-side anchor drawer becomes an overlay that can be toggled with the tree icon button.

## Custom Content Example

You can also use DPage with `disableNav` to create standalone pages without the bottom navigation:

```html
<d-page :disable-nav="true">
  <div class="text-center q-pa-lg">
    <h2>Custom Page Content</h2>
    <p>No bottom nav, no prev/next links.</p>
  </div>
</d-page>
```
