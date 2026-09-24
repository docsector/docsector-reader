import { describe, expect, it } from 'vitest'

import { createDocsector } from '../src/index.js'

describe('createDocsector — sponsors and ads', () => {
  it('leaves both sections off when they are not configured', () => {
    const config = createDocsector({})

    expect(config.sponsors).toBeNull()
    expect(config.ads).toBeNull()
    expect(config.links.sponsor).toBeNull()
  })

  it('passes both sections through as written, with no defaults merged in', () => {
    const sponsors = { enabled: true, tiers: [{ id: 'gold', layout: 'square' }], items: [] }
    const ads = { enabled: true, items: [] }
    const config = createDocsector({ sponsors, ads })

    expect(config.sponsors).toBe(sponsors)
    expect(config.ads).toBe(ads)
  })
})
