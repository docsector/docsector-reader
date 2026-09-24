// : Arrow-key navigation for the header link menus (role="menu" rows with
//   role="menuitem"): ArrowDown/ArrowUp move to the next/previous row
//   (wrapping), Home/End to the first/last. Bound to the list's keydown —
//   Tab, Esc and Enter keep their QMenu behaviour.
const STEPS = { ArrowDown: 1, ArrowUp: -1 }

export function move (event) {
  const { key } = event
  // ?
  if (!(key in STEPS) && key !== 'Home' && key !== 'End') {
    return
  }

  const items = [...(event.currentTarget?.querySelectorAll('[role="menuitem"]') || [])]
  if (items.length === 0) {
    return
  }

  const index = items.indexOf(document.activeElement)
  let next
  if (key === 'Home') {
    next = 0
  } else if (key === 'End') {
    next = items.length - 1
  } else if (index === -1) {
    next = STEPS[key] > 0 ? 0 : items.length - 1
  } else {
    next = (index + STEPS[key] + items.length) % items.length
  }

  // @
  event.preventDefault()
  items[next].focus()
}
