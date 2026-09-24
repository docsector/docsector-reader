/**
 * Locale maps — a config value written either as a plain string or as a map of
 * locale → string, e.g. `{ 'en-US': 'License', 'pt-BR': 'Licença' }`.
 */

const pick = (value) => (typeof value === 'string' && value.trim() !== '' ? value : '')

// : whether a config value can render as text — a non-blank string, or a
//   locale map with at least one non-blank string
export function isText (value) {
  if (typeof value === 'string') return value.trim() !== ''
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  return Object.values(value).some((entry) => pick(entry) !== '')
}

// : the text for `locale` — a string as is; a map by locale, then '*', then
//   'en-US', then its first non-empty string; anything else '' (a map value
//   that is blank or not a string never renders)
export function resolveLocaleMap (value, locale) {
  if (typeof value === 'string') return value

  if (value && typeof value === 'object') {
    return pick(value[locale]) || pick(value['*']) || pick(value['en-US']) || Object.values(value).map(pick).find(Boolean) || ''
  }

  return ''
}
