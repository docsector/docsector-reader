import { describe, expect, it } from 'vitest'

import {
  menuSeparatorClass,
  normalizeMenuSeparators
} from '../src/components/menu-separators.js'

describe('menu separators normalization', () => {
  it('normalizes the explicit separators form', () => {
    expect(normalizeMenuSeparators({ separators: { lineBottom: true } })).toEqual({
      lineTop: null,
      lineBottom: true
    })

    expect(normalizeMenuSeparators({ separators: { lineTop: true, lineBottom: 'page' } })).toEqual({
      lineTop: true,
      lineBottom: 'page'
    })
  })

  it('keeps the legacy `separator: true` working as a line below the item', () => {
    expect(normalizeMenuSeparators({ separator: true })).toEqual({
      lineTop: null,
      lineBottom: true
    })
  })

  it('normalizes legacy class-suffix strings into trimmed variants', () => {
    expect(normalizeMenuSeparators({ separator: ' page' })).toEqual({
      lineTop: null,
      lineBottom: 'page'
    })

    expect(normalizeMenuSeparators({ separator: ' list' })).toEqual({
      lineTop: null,
      lineBottom: 'list'
    })
  })

  it('lets the explicit form win over the legacy key', () => {
    expect(normalizeMenuSeparators({
      separator: true,
      separators: { lineTop: true }
    })).toEqual({
      lineTop: true,
      lineBottom: null
    })
  })

  it('returns no lines for absent or invalid config', () => {
    const none = { lineTop: null, lineBottom: null }

    expect(normalizeMenuSeparators()).toEqual(none)
    expect(normalizeMenuSeparators({})).toEqual(none)
    expect(normalizeMenuSeparators({ separator: false })).toEqual(none)
    expect(normalizeMenuSeparators({ separator: '   ' })).toEqual(none)
    expect(normalizeMenuSeparators({ separators: { lineBottom: false } })).toEqual(none)
  })

  it('builds the same CSS classes the legacy form produced', () => {
    expect(menuSeparatorClass(true)).toBe('separator')
    expect(menuSeparatorClass('page')).toBe('separator page')
    expect(menuSeparatorClass('list')).toBe('separator list')
  })
})
