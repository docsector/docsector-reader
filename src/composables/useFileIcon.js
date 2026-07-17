import { shallowRef } from 'vue'

const BASE_URL = import.meta.env.BASE_URL || '/'

// ! The filename → icon map (~130 KB) loads on demand: it only serves the
//   decorative file-type icons of code blocks. Callers run inside computeds,
//   so reading this ref re-resolves the icons once the map lands.
const materialIconsMap = shallowRef(null)
let iconMapPromise = null

const loadIconMap = () => {
  if (iconMapPromise === null) {
    iconMapPromise = import('../icon-themes/material-icons.json')
      .then((module) => {
        materialIconsMap.value = module.default ?? module
      })
      .catch((error) => {
        iconMapPromise = null
        console.warn('[docsector] Failed to load the file-icon map', error)
      })
  }

  return iconMapPromise
}

const normalizeLookupValue = (value = '') => {
  return String(value)
    .trim()
    .split(/[\\/]/)
    .filter(Boolean)
    .pop()
    ?.replace(/^['"]|['"]$/g, '')
    .toLowerCase() || ''
}

const extensionCandidates = (fileName) => {
  const parts = fileName.split('.').filter(Boolean)

  if (parts.length === 0) {
    return []
  }

  if (parts.length === 1 && fileName.startsWith('.')) {
    return [parts[0]]
  }

  return parts
    .slice(1)
    .map((_, index) => parts.slice(index + 1).join('.'))
    .filter(Boolean)
}

const iconUrl = (fileName) => {
  return `${BASE_URL.replace(/\/$/, '')}/material-icons/icons/${fileName}`
}

const resolveFromMaps = (fileName, maps) => {
  const fromName = maps.fileNames?.[fileName]

  if (fromName) {
    return fromName
  }

  const fromFullExtension = maps.fileExtensions?.[fileName]

  if (fromFullExtension) {
    return fromFullExtension
  }

  for (const extension of extensionCandidates(fileName)) {
    const fromExtension = maps.fileExtensions?.[extension]

    if (fromExtension) {
      return fromExtension
    }
  }

  return ''
}

export const looksLikeFileName = (value = '') => {
  const fileName = normalizeLookupValue(value)

  if (!fileName) {
    return false
  }

  if (/\.[^.\s]+$/.test(fileName)) {
    return true
  }

  const materialIcons = materialIconsMap.value
  if (materialIcons === null) {
    loadIconMap()
    return false
  }

  return Boolean(materialIcons.fileNames?.[fileName])
}

export const resolveFileIconUrl = (value = '', options = {}) => {
  const fileName = normalizeLookupValue(value)

  if (!fileName) {
    return ''
  }

  // ? Map not loaded yet: no icon now — computed callers re-run on load
  const materialIcons = materialIconsMap.value
  if (materialIcons === null) {
    loadIconMap()
    return ''
  }

  const preferLight = Boolean(options.preferLight)
  const fallback = options.fallback !== false
  const primaryMaps = preferLight ? materialIcons.light : materialIcons
  const secondaryMaps = preferLight ? materialIcons : materialIcons.light
  const resolved = resolveFromMaps(fileName, primaryMaps || {}) || resolveFromMaps(fileName, secondaryMaps || {})

  if (resolved) {
    return iconUrl(resolved)
  }

  return fallback && looksLikeFileName(fileName)
    ? iconUrl(materialIcons.defaultIcon || 'file.svg')
    : ''
}

// ? Test-only: await the lazy icon map
export const ensureFileIconMap = () => loadIconMap()