## Overview

Docsector Reader uses **Vuex 4** for state management with 5 namespaced modules. Because `@quasar/app-vite` v2 dropped built-in Vuex support, the store is manually registered via `src/boot/store.js`.

## Modules

### App (`src/store/App.js`)

Handles route-to-i18n path mapping.

**Actions:**

| Action | Description |
|--------|-------------|
| `configureLanguage(routeMatched)` | Converts route paths to i18n paths and commits to page/i18n modules |

### I18n (`src/store/I18n.js`)

Tracks the current i18n namespace paths.

**State:**

| Property | Type | Description |
|----------|------|-------------|
| `base` | `String` | Base i18n path (e.g., `'guide.getting-started'`) |
| `relative` | `String` | Relative i18n path (e.g., `'overview'`) |
| `absolute` | `String` | Full i18n path (e.g., `'guide.getting-started.overview'`) |

### Page (`src/store/Page.js`)

Manages page navigation state, anchors, and ToC tree.

**Key State:**

| Property | Type | Description |
|----------|------|-------------|
| `base` | `String` | Route base path |
| `relative` | `String` | Subpage relative path |
| `anchor` | `Number` | Currently selected anchor ID |
| `anchors` | `Array` | Registered anchor IDs |
| `scrolling` | `Boolean` | Whether scroll tracking is active |

**Key Getters:**

| Getter | Description |
|--------|-------------|
| `nodes` | ToC tree structure for DPageAnchor |
| `nodesExpanded` | Array of expanded node IDs |

### Layout (`src/store/Layout.js`)

Controls layout visibility states.

**Key State:**

| Property | Type | Description |
|----------|------|-------------|
| `meta` | `Boolean` | Right drawer (anchor panel) visibility |
| `metaToggle` | `Boolean` | Whether meta toggle button is active |
| Grid positions | `Object` | Position state for layout grid elements |

### Settings (`src/store/Settings.js`)

Manages the settings dialog state.

**State:**

| Property | Type | Description |
|----------|------|-------------|
| `dialog` | `Boolean` | Settings dialog open/close state |

**Getter/Mutation:**

| Name | Description |
|------|-------------|
| `dialog` (getter) | Returns dialog state |
| `dialog` (mutation) | Sets dialog state |

## Boot File

The store is registered in `src/boot/store.js`:

```javascript
import &#123; boot &#125; from 'quasar/wrappers'
import store from '../store'

export default boot(async (&#123; app &#125;) => &#123;
  app.use(store)
&#125;)
```

This boot file **must** be listed first in `quasar.config.js`:

```javascript
boot: ['store', 'QZoom', 'i18n', 'axios']
```
