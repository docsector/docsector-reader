import { describe, expect, it } from 'vitest'

import { hashString } from '../src/hash.js'

// ! Reference copy of the loop DSubpage used before hashString existed — the
//   code-line anchor ids depend on these exact values
const legacyHash = (path) => {
  let hash = 5381
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 33) ^ path.charCodeAt(i)
  }
  return hash >>> 0
}

describe('hashString', () => {
  it('keeps the values DSubpage produced', () => {
    for (const path of ['/', '/home', '/manual/basic/theme/overview', '/manual/basic/theme/overview/', '/guia/instalação', `/${'a'.repeat(300)}`]) {
      expect(hashString(path)).toBe(legacyHash(path))
    }
  })

  it('pins literal values', () => {
    expect(hashString('/')).toBe(177546)
    expect(hashString('/manual/basic/theme/overview')).toBe(3184088023)
    expect(hashString('/manual/basic/theme/overview/')).toBe(1995689624)
  })

  it('returns an unsigned 32-bit integer, also for non-strings', () => {
    for (const value of ['', 'x', `${'z'.repeat(1000)}`, null, undefined, 42]) {
      const hash = hashString(value)
      expect(Number.isInteger(hash)).toBe(true)
      expect(hash).toBeGreaterThanOrEqual(0)
      expect(hash).toBeLessThan(2 ** 32)
    }
    expect(hashString(null)).toBe(hashString(''))
  })
})
