## Dark Mode & Light Mode

Docsector Reader supports automatic dark/light theme switching through the **Quasar Dark Plugin**. Users can toggle between modes in the Settings dialog.

## Quasar Variables

Theme colors are defined in `src/css/quasar.variables.scss`:

```css
$primary: #027BE3;
$secondary: #26A69A;
$accent: #9C27B0;
$dark: #1D1D1D;
$dark-page: #121212;
$positive: #21BA45;
$negative: #C10015;
$info: #31CCEC;
$warning: #F2C037;
```

Override these variables to customize the entire color scheme.

## Global Styles

Global styles live in `src/css/app.sass`. This file is loaded automatically by Quasar and applies to all pages.

## Component-Level Styles

Each Docsector component has its own scoped `style` block using SASS. Dark/light mode variants use the CSS selector pattern:

```css
body.body--dark
  .my-element
    color: white

body.body--light
  .my-element
    color: black
```

## CSS Variables

Components use CSS custom properties for theme-aware styling:

- `--d-menu-subheader-txt-color` — Menu subheader text color
- `--d-menu-expansion-bg-color` — Menu expansion panel background
- `--d-menu-item-opacity` — Menu item hover opacity

## Customizing Code Block Colors

The `DPageSourceCode` component has separate color schemes for light and dark modes, using Prism.js token classes. Override `token.*` classes in the `.source-code` SASS block to customize syntax highlighting colors.

## Font Families

Code blocks use `"Fira Code Nerd Font"` with `"Consolas"` as fallback. To use a different monospace font, override the `.source-code` font-family declarations.
