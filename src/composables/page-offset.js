// ? The header's height follows from config alone (it grows by the book tabs
//   when there are books), so the server can lay a page out below it exactly
//   as the client later measures it. DefaultLayout hints it to QLayout and
//   provides it; DPage derives its first min-height from it.
export const HEADER_HEIGHT_KEY = Symbol('docsector.headerHeight')

export const HEADER_HEIGHT = 53
export const HEADER_HEIGHT_WITH_BOOKS = 111

// ? A page rendered without DefaultLayout keeps the historical offset
export const FALLBACK_PAGE_OFFSET = 86

export function resolveHeaderHeight (bookCount) {
  return bookCount > 0 ? HEADER_HEIGHT_WITH_BOOKS : HEADER_HEIGHT
}

// : The page's first min-height: the viewport below the header, and below the
//   submenu when the page shows one. The submenu's height is CSS
//   (`--d-submenu-min-height`, taller on small screens), so the server needs
//   no viewport to match what the client measures.
export function resolvePageMinHeight (headerHeight, showSubmenu) {
  if (!Number.isFinite(headerHeight)) {
    return `calc(100vh - ${FALLBACK_PAGE_OFFSET}px)`
  }

  return showSubmenu
    ? `calc(100vh - ${headerHeight}px - var(--d-submenu-min-height, 36px))`
    : `calc(100vh - ${headerHeight}px)`
}
