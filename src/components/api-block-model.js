import quasarApiExtends from './quasar-api-extends.json'

const defaultInnerTabName = '__default'
const fallbackCategoryName = 'general'

const isPlainObject = (value) => {
  return Object.prototype.toString.call(value) === '[object Object]'
}

const isSupportedTopLevelSection = (value) => {
  return typeof value === 'string' || isPlainObject(value)
}

const mergeEntries = (baseValue, overrideValue) => {
  if (!isPlainObject(baseValue) || !isPlainObject(overrideValue)) {
    return overrideValue === undefined ? baseValue : overrideValue
  }

  const acc = {
    ...baseValue
  }

  Object.entries(overrideValue).forEach(([key, value]) => {
    acc[key] = isPlainObject(value) && isPlainObject(baseValue[key])
      ? mergeEntries(baseValue[key], value)
      : value
  })

  return acc
}

const resolveExtendsSource = (extendName = '', preferredSection = '') => {
  const normalizedName = String(extendName || '').trim()

  if (normalizedName === '') {
    return undefined
  }

  if (isPlainObject(quasarApiExtends?.[preferredSection]?.[normalizedName])) {
    return quasarApiExtends[preferredSection][normalizedName]
  }

  return Object.values(quasarApiExtends || {}).find((sectionEntries) => {
    return isPlainObject(sectionEntries?.[normalizedName])
  })?.[normalizedName]
}

const resolveExtendedEntries = (value, preferredSection = '', seen = new Set()) => {
  if (Array.isArray(value)) {
    return value.map((entry) => resolveExtendedEntries(entry, preferredSection, seen))
  }

  if (!isPlainObject(value)) {
    return value
  }

  const extendName = typeof value.extends === 'string' ? value.extends.trim() : ''
  const seenKey = `${preferredSection}:${extendName}`
  const baseValue = extendName !== '' && !seen.has(seenKey)
    ? resolveExtendsSource(extendName, preferredSection)
    : undefined
  const nextSeen = new Set(seen)

  if (extendName !== '') {
    nextSeen.add(seenKey)
  }

  const currentValue = {}

  Object.entries(value).forEach(([key, entryValue]) => {
    if (key === 'extends') {
      return
    }

    currentValue[key] = resolveExtendedEntries(entryValue, preferredSection, nextSeen)
  })

  return mergeEntries(
    baseValue === undefined
      ? {}
      : resolveExtendedEntries(baseValue, preferredSection, nextSeen),
    currentValue
  )
}

const getEntryCategories = (entry = {}) => {
  const raw = String(entry?.category || '').trim()

  if (raw === '') {
    return [fallbackCategoryName]
  }

  const groups = raw
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean)

  return groups.length === 0 ? [fallbackCategoryName] : groups
}

const pruneInternalEntries = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => pruneInternalEntries(entry))
      .filter((entry) => entry !== undefined)
  }

  if (!isPlainObject(value)) {
    return value
  }

  if (value.internal === true) {
    return undefined
  }

  const acc = {}

  Object.entries(value).forEach(([key, entryValue]) => {
    if (key === 'internal') {
      return
    }

    const nextValue = pruneInternalEntries(entryValue)

    if (nextValue !== undefined) {
      acc[key] = nextValue
    }
  })

  return acc
}

const getApiSourceName = (sourceName = '') => {
  const normalized = String(sourceName || '')
    .split('?')[0]
    .split('#')[0]
    .replace(/\\/g, '/')
  const fileName = normalized.split('/').filter(Boolean).pop() || ''

  return fileName.replace(/\.json$/i, '') || 'API'
}

const isEmptySingleEntry = (value) => {
  if (value === undefined || value === null) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim() === ''
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (isPlainObject(value)) {
    return Object.keys(value).length === 0
  }

  return false
}

export const normalizeApiDocsLink = (value = '') => {
  const normalized = String(value || '').trim()

  if (normalized === '') {
    return ''
  }

  return normalized
    .replace(/^https:\/\/v[\d]+\.quasar\.dev/i, '')
    .replace(/^https:\/\/quasar\.dev/i, '')
}

export const getPropsCategories = (props = {}) => {
  const acc = new Set()

  Object.values(props || {}).forEach((value) => {
    if (value !== undefined && value !== null) {
      getEntryCategories(value).forEach((groupKey) => {
        acc.add(groupKey)
      })
    }
  })

  return acc.size === 1 ? [defaultInnerTabName] : [...acc].sort()
}

export const getInnerTabs = (api = {}, tabs = []) => {
  const acc = {}

  tabs.forEach((tab) => {
    acc[tab] = tab === 'props' && isPlainObject(api[tab])
      ? getPropsCategories(api[tab])
      : [defaultInnerTabName]
  })

  return acc
}

export const parseApi = (api = {}, tabs = [], innerTabs = {}) => {
  const acc = {}

  tabs.forEach((tab) => {
    const apiValue = api[tab]

    if (innerTabs[tab]?.length > 1 && isPlainObject(apiValue)) {
      const inner = {}

      innerTabs[tab].forEach((subTab) => {
        inner[subTab] = {}
      })

      Object.entries(apiValue).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return
        }

        getEntryCategories(value).forEach((groupKey) => {
          if (inner[groupKey] !== undefined) {
            inner[groupKey][key] = value
          }
        })
      })

      acc[tab] = inner
      return
    }

    acc[tab] = {
      [defaultInnerTabName]: apiValue ?? {}
    }
  })

  return acc
}

const passesFilter = (filter, name, desc) => {
  const normalizedFilter = String(filter || '').trim().toLowerCase()

  if (normalizedFilter === '') {
    return true
  }

  return (
    String(name || '').toLowerCase().includes(normalizedFilter) ||
    String(desc || '').toLowerCase().includes(normalizedFilter)
  )
}

export const getFilteredApi = (parsedApi = {}, filter = '', tabs = [], innerTabs = {}) => {
  const normalizedFilter = String(filter || '').trim().toLowerCase()

  if (normalizedFilter === '') {
    return parsedApi
  }

  const acc = {}

  tabs.forEach((tab) => {
    if (tab === 'injection') {
      const name = parsedApi?.[tab]?.[defaultInnerTabName]

      acc[tab] = {
        [defaultInnerTabName]: passesFilter(normalizedFilter, name, '') ? name : {}
      }
      return
    }

    if (tab === 'quasarConfOptions') {
      const api = parsedApi?.[tab]?.[defaultInnerTabName] || {}
      const result = {
        ...api,
        definition: {}
      }

      Object.entries(api.definition || {}).forEach(([name, entry]) => {
        if (passesFilter(normalizedFilter, name, entry?.desc)) {
          result.definition[name] = entry
        }
      })

      acc[tab] = {
        [defaultInnerTabName]: Object.keys(result.definition).length === 0 && !passesFilter(normalizedFilter, api.propName, '')
          ? {}
          : result
      }
      return
    }

    const tabApi = parsedApi?.[tab] || {}
    const tabCategories = innerTabs[tab] || [defaultInnerTabName]

    acc[tab] = {}

    tabCategories.forEach((category) => {
      const subTabs = {}
      const categoryEntries = tabApi[category] || {}

      Object.entries(categoryEntries).forEach(([name, entry]) => {
        if (passesFilter(normalizedFilter, name, entry?.desc)) {
          subTabs[name] = entry
        }
      })

      acc[tab][category] = subTabs
    })
  })

  return acc
}

export const getApiCount = (parsedApi = {}, tabs = [], innerTabs = {}) => {
  const acc = {}

  tabs.forEach((tab) => {
    const tabApi = parsedApi?.[tab] || {}
    const tabCategories = innerTabs[tab] || [defaultInnerTabName]

    if (['value', 'arg', 'injection'].includes(tab)) {
      const value = tabApi[tabCategories[0]]

      acc[tab] = {
        overall: isEmptySingleEntry(value) ? 0 : 1
      }
      return
    }

    if (tab === 'quasarConfOptions') {
      const api = tabApi[tabCategories[0]] || {}

      acc[tab] = {
        overall: Object.keys(api).length === 0
          ? 0
          : api.definition === undefined
            ? 1
            : Object.keys(api.definition || {}).length
      }
      return
    }

    const nextValue = {
      overall: 0,
      category: {}
    }

    tabCategories.forEach((category) => {
      const count = Object.keys(tabApi[category] || {}).length

      nextValue.category[category] = count
      nextValue.overall += count
    })

    acc[tab] = nextValue
  })

  return acc
}

export const createApiBlockModel = (sourceName = '', apiDocument = {}) => {
  const rawDocument = isPlainObject(apiDocument) ? apiDocument : {}
  const {
    type: _type,
    behavior: _behavior,
    meta,
    addedIn: _addedIn,
    internal: _internalSection,
    ...apiSectionsRaw
  } = rawDocument
  const apiSections = {}

  Object.entries(apiSectionsRaw).forEach(([sectionName, sectionValue]) => {
    const sanitizedValue = pruneInternalEntries(
      resolveExtendedEntries(sectionValue, sectionName)
    )

    if (sanitizedValue !== undefined && isSupportedTopLevelSection(sanitizedValue)) {
      apiSections[sectionName] = sanitizedValue
    }
  })

  const tabs = Object.keys(apiSections)
  const innerTabs = getInnerTabs(apiSections, tabs)
  const api = parseApi(apiSections, tabs, innerTabs)
  const sourceLabel = getApiSourceName(sourceName)
  const docsUrl = String(meta?.docsUrl || '').trim()

  return {
    sourceLabel,
    title: `${sourceLabel} API`,
    docsUrl,
    docsLink: normalizeApiDocsLink(docsUrl),
    tabs,
    innerTabs,
    api,
    nothingToShow: tabs.length === 0
  }
}

export {
  defaultInnerTabName
}