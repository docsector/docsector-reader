const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function escapeSegment (segment) {
  return String(segment)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
}

function normalizeSegments (segmentsInput, accumulator = []) {
  for (const segment of segmentsInput) {
    if (Array.isArray(segment)) {
      normalizeSegments(segment, accumulator)
      continue
    }

    if (segment === undefined || segment === null) {
      continue
    }

    const normalized = String(segment).trim()
    if (normalized.length === 0) {
      continue
    }

    accumulator.push(normalized)
  }

  return accumulator
}

export function buildI18nPath (...segmentsInput) {
  const segments = normalizeSegments(segmentsInput)
  if (segments.length === 0) {
    return ''
  }

  let path = ''

  for (const [index, segment] of segments.entries()) {
    if (index === 0) {
      path += IDENTIFIER_PATTERN.test(segment)
        ? segment
        : `['${escapeSegment(segment)}']`
      continue
    }

    path += IDENTIFIER_PATTERN.test(segment)
      ? `.${segment}`
      : `['${escapeSegment(segment)}']`
  }

  return path
}

export function splitRoutePathSegments (routePath) {
  const normalized = String(routePath || '')
    .replace(/\/+$/, '')
    .replace(/^\//, '')

  if (normalized.length === 0) {
    return []
  }

  return normalized.split('/').filter(Boolean)
}

export function splitDotPathSegments (dotPath) {
  const normalized = String(dotPath || '').trim()
  if (normalized.length === 0) {
    return []
  }

  return normalized.split('.').filter(Boolean)
}

export function routeTitleI18nPath (routePath) {
  return buildI18nPath('_', ...splitRoutePathSegments(routePath), '_')
}

export function routeSubpageSourceI18nPath (routePath, subpage = 'overview') {
  return buildI18nPath('_', ...splitRoutePathSegments(routePath), subpage, 'source')
}

export function pageTitleI18nPath (basePath) {
  return buildI18nPath('_', ...splitDotPathSegments(basePath), '_')
}

export function pageValueI18nPath (absolutePath, key = 'source') {
  return buildI18nPath('_', ...splitDotPathSegments(absolutePath), key)
}

export function namespacedLabelI18nPath (book, nodePath) {
  const normalizedNodePath = String(nodePath || '').replace(/^\./, '')

  return buildI18nPath(
    '_',
    String(book || 'manual'),
    ...splitDotPathSegments(normalizedNodePath),
    '_'
  )
}
