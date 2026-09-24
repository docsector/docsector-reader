import { describe, expect, it } from 'vitest'

import { isText, resolveLocaleMap } from '../src/i18n/locale-map.js'

// ! Reference copies of the two resolvers this module replaced (DFooter's
//   resolveLabel and DefaultLayout's resolveLocalizedValue)
const footerResolveLabel = (label, locale) => {
  if (label && typeof label === 'object') {
    return label[locale] || label['*'] || label['en-US'] || Object.values(label)[0] || ''
  }
  return typeof label === 'string' ? label : ''
}

const layoutResolveLocalizedValue = (source, locale) => {
  if (!source) return ''
  if (typeof source === 'string') return source
  if (typeof source === 'object') {
    return source[locale] || source['*'] || source['en-US'] || Object.values(source)[0] || ''
  }
  return ''
}

describe('resolveLocaleMap', () => {
  it('returns strings as they are', () => {
    expect(resolveLocaleMap('License', 'pt-BR')).toBe('License')
    expect(resolveLocaleMap('', 'pt-BR')).toBe('')
  })

  it('resolves a map by locale, then *, then en-US, then its first value', () => {
    expect(resolveLocaleMap({ 'en-US': 'License', 'pt-BR': 'Licença' }, 'pt-BR')).toBe('Licença')
    expect(resolveLocaleMap({ '*': 'Any', 'en-US': 'License' }, 'fr-FR')).toBe('Any')
    expect(resolveLocaleMap({ 'en-US': 'License', 'pt-BR': 'Licença' }, 'fr-FR')).toBe('License')
    expect(resolveLocaleMap({ 'de-DE': 'Lizenz' }, 'fr-FR')).toBe('Lizenz')
  })

  it('never renders a blank or non-string map value — the first non-empty string wins', () => {
    expect(resolveLocaleMap({ 'en-US': '', 'pt-BR': 'Curso oficial' }, 'en-US')).toBe('Curso oficial')
    expect(resolveLocaleMap({ 'en-US': 42, 'pt-BR': 'Aprenda' }, 'en-US')).toBe('Aprenda')
    expect(resolveLocaleMap({ 'pt-BR': '   ', '*': { nested: true }, 'de-DE': 'Lizenz' }, 'pt-BR')).toBe('Lizenz')
    expect(resolveLocaleMap({ 'en-US': 42 }, 'en-US')).toBe('')
  })

  it('returns an empty string for anything else', () => {
    for (const value of [null, undefined, 0, 42, true, false, {}]) {
      expect(resolveLocaleMap(value, 'en-US')).toBe('')
    }
  })

  it('matches both resolvers it replaced over every input kind', () => {
    const inputs = ['', 'Plain', null, undefined, 0, 7, true, false, {}, [], ['a'],
      { 'en-US': 'E' }, { 'pt-BR': 'P', 'en-US': 'E' }, { '*': 'S' }, { 'x-Y': 'X' }, { 'en-US': '' }]

    for (const input of inputs) {
      for (const locale of ['en-US', 'pt-BR', 'fr-FR']) {
        expect(resolveLocaleMap(input, locale)).toBe(footerResolveLabel(input, locale))
        expect(resolveLocaleMap(input, locale)).toBe(layoutResolveLocalizedValue(input, locale))
      }
    }
  })
})

describe('isText', () => {
  it('accepts a non-blank string or a locale map with one', () => {
    expect(isText('Docs')).toBe(true)
    expect(isText({ 'en-US': 'Docs' })).toBe(true)
    expect(isText({ 'en-US': '', 'pt-BR': 'Documentação' })).toBe(true)
  })

  it('rejects blanks, empty maps, arrays and other values', () => {
    for (const value of ['', '   ', {}, { 'en-US': '' }, { 'en-US': '  ', 'pt-BR': 7 }, ['Docs'], 7, null, undefined, true]) {
      expect(isText(value), JSON.stringify(value)).toBe(false)
    }
  })
})
