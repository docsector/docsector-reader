import { describe, expect, it } from 'vitest'

import { matchesBookSearchTerm } from '../src/search/book-search.js'

describe('matchesBookSearchTerm', () => {
  const tags = {
    'en-US': {
      '/guide/getting-started': 'install setup start',
      '/guide/configuration': 'config branding links'
    },
    'pt-BR': {
      '/guide/getting-started': 'instalar configurar iniciar'
    }
  }

  it('matches term in the active locale', () => {
    expect(matchesBookSearchTerm(tags, 'pt-BR', '/guide/getting-started', 'configurar')).toBe(true)
  })

  it('falls back to en-US when locale entry is missing', () => {
    expect(matchesBookSearchTerm(tags, 'pt-BR', '/guide/configuration', 'branding')).toBe(true)
  })

  it('returns false when no tag entry matches', () => {
    expect(matchesBookSearchTerm(tags, 'pt-BR', '/guide/configuration', 'inexistente')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(matchesBookSearchTerm(tags, 'en-US', '/guide/getting-started', 'SETUP')).toBe(true)
  })
})