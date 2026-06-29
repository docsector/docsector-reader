export const PAGE_TEMPLATE_FREESTYLE = 'freestyle'
export const PAGE_TEMPLATE_VS = 'vs'

/**
 * Subpage template presets.
 *
 * A template defines the fixed structure a subpage must follow. `freestyle`
 * (the default) imposes no structure — the markdown renders exactly as written.
 * Structured templates declare an ordered `sections` list; the renderer slots
 * the markdown bodies into that fixed structure (canonical order, template-owned
 * localized titles, graceful omission of absent sections).
 */
const PAGE_TEMPLATE_PRESETS = Object.freeze({
  [PAGE_TEMPLATE_FREESTYLE]: Object.freeze({
    name: PAGE_TEMPLATE_FREESTYLE,
    sections: null
  }),
  [PAGE_TEMPLATE_VS]: Object.freeze({
    name: PAGE_TEMPLATE_VS,
    sections: Object.freeze([
      Object.freeze({
        key: 'features',
        icon: 'checklist',
        title: Object.freeze({ 'en-US': 'Features', 'pt-BR': 'Recursos' })
      }),
      Object.freeze({
        key: 'performance',
        icon: 'speed',
        title: Object.freeze({ 'en-US': 'Performance', 'pt-BR': 'Desempenho' })
      }),
      Object.freeze({
        key: 'security',
        icon: 'security',
        title: Object.freeze({ 'en-US': 'Security', 'pt-BR': 'Segurança' })
      })
    ])
  })
})

const normalizeTemplateName = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')

  if (normalized && Object.prototype.hasOwnProperty.call(PAGE_TEMPLATE_PRESETS, normalized)) {
    return normalized
  }

  return PAGE_TEMPLATE_FREESTYLE
}

const firstDefined = (source, keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined) {
      return source[key]
    }
  }

  return undefined
}

const toTemplateName = (source) => {
  if (source === undefined || source === null) {
    return undefined
  }

  if (typeof source === 'boolean') {
    return source ? PAGE_TEMPLATE_FREESTYLE : undefined
  }

  if (typeof source === 'string') {
    return normalizeTemplateName(source)
  }

  if (typeof source === 'object' && !Array.isArray(source)) {
    const name = firstDefined(source, ['template', 'name', 'type', 'preset'])
    return name === undefined ? undefined : normalizeTemplateName(name)
  }

  return undefined
}

/**
 * Whether a subpage config value enables that subpage.
 *
 * Accepts the boolean shorthand (`true`) or the object form (`{ template }`).
 */
export function isSubpageEnabled (value) {
  return value === true || (typeof value === 'object' && value !== null && !Array.isArray(value))
}

/**
 * Resolve a subpage template from one or more config sources.
 *
 * Sources may be a template name string, the subpage config value
 * (`true` | `{ template }`), or undefined. Later sources win; the default is
 * `freestyle`. Returns the resolved template preset object.
 */
export function resolveSubpageTemplate (...sources) {
  let name = PAGE_TEMPLATE_FREESTYLE

  for (const source of sources) {
    const resolved = toTemplateName(source)
    if (resolved !== undefined) {
      name = resolved
    }
  }

  return PAGE_TEMPLATE_PRESETS[name] || PAGE_TEMPLATE_PRESETS[PAGE_TEMPLATE_FREESTYLE]
}

/**
 * Get a template preset object by name, falling back to `freestyle`.
 */
export function getTemplate (name) {
  return PAGE_TEMPLATE_PRESETS[normalizeTemplateName(name)] || PAGE_TEMPLATE_PRESETS[PAGE_TEMPLATE_FREESTYLE]
}
