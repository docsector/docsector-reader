## Overview

`useNavigator` is the **core composable** that manages anchor navigation, heading registration, scroll tracking, and ToC tree construction. It is used by DH1–DH6, DPage, and DPageAnchor.

## Returned API

```javascript
const &#123;
  register,   // Register an anchor ID
  index,       // Add a node to the ToC tree
  select,      // Select an anchor
  anchor,      // Scroll to an anchor
  scrolling,   // Scroll event handler
  navigate,    // Navigate to an anchor (URL + scroll)
  selected     // Ref to currently selected anchor
&#125; = useNavigator()
```

## Functions

### register(id)

Registers an anchor ID in the `page/anchors` store array. Called by heading components on mount.

```javascript
onMounted(() => &#123;
  register(props.id)
&#125;)
```

### index(id, child)

Pushes a node into the `page/nodes` store to build the ToC tree. Called by DH2–DH6 after rendering.

### select(id)

Updates `page/anchor` state and expands the corresponding tree node.

### anchor(id, toSelect)

Scrolls the viewport to the DOM element with the given ID using Quasar's `scroll` utility. Optionally calls `select()` to highlight the node in the ToC tree.

### scrolling(scroll)

The scroll event handler attached to DPage's QScrollObserver. It iterates all registered anchors, finds the one closest to the current scroll position, and selects it. Only active when `page/scrolling` is `true`.

### navigate(value, toAnchor)

Full navigation function that:

1. Updates the URL hash via `router.push()`
2. Scrolls to the anchor element
3. Handles desktop vs mobile timing differences

## Usage Pattern

Heading components use register + index:

```javascript
const &#123; register, index, navigate, selected &#125; = useNavigator()

onMounted(() => &#123;
  register(props.id)
  selected.value = props.value
  index(props.id)
&#125;)
```

DPage uses scrolling:

```javascript
const &#123; scrolling, navigate &#125; = useNavigator()
// scrolling is passed to QScrollObserver
```

DPageAnchor uses navigate + anchor:

```javascript
const &#123; navigate, anchor, selected &#125; = useNavigator()
// navigate is triggered by QTree selection
```

## Store Dependencies

- `page/anchors` — Array of registered anchor IDs
- `page/nodes` — ToC tree structure
- `page/nodesExpanded` — Expanded tree nodes
- `page/anchor` — Currently selected anchor
- `page/scrolling` — Whether scroll tracking is active
