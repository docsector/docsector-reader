## Overview

`QZoom` is a **zoom overlay** component forked from `quasarframework/app-extension-qzoom` and ported from Vue 2 to Vue 3. It enables any content to be zoomed into a fullscreen overlay with optional scaling.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `String` | `'white'` | Background color of the overlay |
| `restoreOnScroll` | `Boolean` | `false` | Close zoom when user scrolls |
| `manual` | `Boolean` | `false` | Disable automatic click-to-zoom |
| `scale` | `Boolean` | `false` | Enable mouse wheel scaling |
| `initialScale` | `Number` | `1.0` | Initial scale (0.05–10) |
| `scaleText` | `Boolean` | `false` | Enable font-size scaling instead of transform |
| `initialScaleText` | `Number` | `100` | Initial font-size percentage (50–500) |
| `noCenter` | `Boolean` | `false` | Don't center content in overlay |
| `noWheelScale` | `Boolean` | `false` | Disable mouse wheel scaling |
| `noEscClose` | `Boolean` | `false` | Disable Escape key to close |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `before-zoom` | — | Emitted before zoom animation starts |
| `zoomed` | — | Emitted after zoom animation completes |
| `before-restore` | — | Emitted before restore animation starts |
| `restored` | — | Emitted after restore animation completes |
| `scale` | `Number` | Emitted when scale value changes |
| `scale-text` | `Number` | Emitted when text scale value changes |

## Slot

The default slot receives a `zoomed` Boolean indicating the current zoom state:

```html
<q-zoom>
  <template v-slot:default="&#123; zoomed &#125;">
    <img src="diagram.png" :class="zoomed ? 'zoomed' : ''" />
  </template>
</q-zoom>
```

## How It Works

1. By default, clicking toggles between normal and fullscreen
2. An overlay is created with a smooth transition (500ms zoom in, 400ms restore)
3. During zoom, body scroll is disabled (unless `restoreOnScroll` is true)
4. Press **Escape** to close (unless `noEscClose` is true)

## Scaling Modes

Two mutually exclusive scaling modes:

- **Transform scale** (`scale` prop) — Scales the entire content using CSS `transform: scale()`
- **Font-size scale** (`scaleText` prop) — Adjusts the content's `font-size` percentage

Mouse wheel scrolling adjusts the scale value when zoomed (unless `noWheelScale` is true).

## Boot Registration

QZoom is registered globally via `src/boot/QZoom.js`:

```javascript
app.component('QZoom', QZoom)
```

This makes `<q-zoom>` available in all templates without explicit imports.

## Dependencies

QZoom requires the `q-colorize-mixin` package for background color handling, and `QZoom.styl` for its CSS styles.
