export function buildSourceCodeLineAnchorId(anchorPrefix, line) {
  return `${anchorPrefix}${line}`
}

export function resolveSourceCodeLineHref(router, routePath, routeQuery, anchorId) {
  return router.resolve({
    path: routePath,
    query: routeQuery,
    hash: `#${anchorId}`
  }).href
}

export function shouldHandleSourceCodeLineActivation(event) {
  return !(event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
}