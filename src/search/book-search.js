export function matchesBookSearchTerm (bookTags = {}, locale, path, term, fallbackLocale = 'en-US') {
  const normalizedTerm = String(term || '').trim().toLowerCase()
  if (!normalizedTerm) return false

  const normalizedPath = String(path || '').trim()
  if (!normalizedPath) return false

  const localeTags = bookTags?.[locale]
  const localeTagText = localeTags?.[normalizedPath]

  if (typeof localeTagText === 'string' && localeTagText.toLowerCase().includes(normalizedTerm)) {
    return true
  }

  if (locale !== fallbackLocale) {
    const fallbackTags = bookTags?.[fallbackLocale]
    const fallbackTagText = fallbackTags?.[normalizedPath]

    if (typeof fallbackTagText === 'string' && fallbackTagText.toLowerCase().includes(normalizedTerm)) {
      return true
    }
  }

  return false
}