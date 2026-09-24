import { describe, expect, it, vi } from 'vitest'

import {
  SPONSOR_LAYOUTS,
  isSectionEnabled,
  normalizeSponsorsConfig,
  resolveFallbackLinkAttrs,
  resolveSponsorFallbackUrl
} from '../src/sponsors/config.js'

const TIERS = [{ id: 'platinum', layout: 'wide' }, { id: 'gold', layout: 'square' }]

const sponsor = (overrides = {}) => ({
  name: 'Acme',
  tier: 'platinum',
  href: 'https://acme.example',
  logo: '/images/sponsors/acme.svg',
  ...overrides
})

const normalize = (sponsors, { links, base } = {}) => {
  const warnings = []
  const result = normalizeSponsorsConfig({ sponsors, links }, { base, onWarning: message => warnings.push(message) })
  return { result, warnings }
}

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

describe('sponsors — enabling', () => {
  it('is disabled and silent by default', () => {
    for (const config of [{}, undefined, { sponsors: null }, { sponsors: { enabled: false } }]) {
      const warnings = []
      expect(normalizeSponsorsConfig(config, { onWarning: message => warnings.push(message) }))
        .toEqual({ enabled: false, visible: false, fallback: null, tiers: [] })
      expect(warnings).toEqual([])
    }
  })

  it('enables only on the boolean true and warns about other values', () => {
    for (const enabled of ['true', 1, 'yes']) {
      const { result, warnings } = normalize({ enabled, tiers: TIERS, items: [sponsor()] })

      expect(result.enabled).toBe(false)
      expect(warnings).toEqual(['sponsors.enabled must be the boolean true — the section stays disabled'])
    }
  })

  it('warns when the section is not an object', () => {
    const warnings = []
    expect(isSectionEnabled(true, 'sponsors', { onWarning: message => warnings.push(message) })).toBe(false)
    expect(isSectionEnabled(['x'], 'sponsors', { onWarning: message => warnings.push(message) })).toBe(false)
    expect(warnings).toHaveLength(2)
  })

  it('never validates a disabled section', () => {
    const { warnings } = normalize({ enabled: false, tiers: 'broken', items: [{ nonsense: true }] })

    expect(warnings).toEqual([])
  })
})

describe('sponsors — tiers', () => {
  it('keeps the declaration order and maps each layout to its preset', () => {
    const { result, warnings } = normalize({ enabled: true, tiers: TIERS, items: [sponsor(), sponsor({ name: 'Globex', tier: 'gold' })] })

    expect(warnings).toEqual([])
    expect(result.tiers.map(tier => [tier.id, tier.layout, tier.columns, tier.ratio, tier.width, tier.height])).toEqual([
      ['platinum', 'wide', 1, '3 / 1', 300, 100],
      ['gold', 'square', 2, '1 / 1', 150, 150]
    ])
  })

  it('falls back to square for an unknown or inherited layout name', () => {
    for (const layout of [undefined, 'grid', 'toString', 42]) {
      const { result, warnings } = normalize({ enabled: true, tiers: [{ id: 'gold', layout }], items: [sponsor({ tier: 'gold' })] })

      expect(result.tiers[0].layout).toBe('square')
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('valid: wide, square')
    }
  })

  it('skips tiers without an id or with a repeated one', () => {
    const { result, warnings } = normalize({
      enabled: true,
      tiers: [{ layout: 'wide' }, { id: '', layout: 'wide' }, { id: 7 }, { id: 'gold', layout: 'square' }, { id: 'gold', layout: 'wide' }],
      items: [sponsor({ tier: 'gold' })]
    })

    expect(result.tiers.map(tier => tier.id)).toEqual(['gold'])
    expect(result.tiers[0].layout).toBe('square')
    expect(warnings).toHaveLength(4)
    expect(warnings.at(-1)).toContain('repeats the id "gold"')
  })

  it('warns when no tier is declared', () => {
    for (const tiers of [undefined, [], 'platinum']) {
      const { warnings } = normalize({ enabled: true, tiers, items: [] }, { links: { sponsor: 'https://x.example/sponsor' } })

      expect(warnings).toContain('sponsors.tiers must list at least one { id, layout } tier')
    }
  })
})

describe('sponsors — items', () => {
  it('keeps the config order inside each tier and keys every sponsor', () => {
    const { result } = normalize({
      enabled: true,
      tiers: TIERS,
      items: [sponsor({ name: 'A', tier: 'gold' }), sponsor({ name: 'B' }), sponsor({ name: 'C', tier: 'gold' })]
    })

    expect(result.tiers[0].items.map(item => [item.key, item.name])).toEqual([['platinum:0', 'B']])
    expect(result.tiers[1].items.map(item => [item.key, item.name])).toEqual([['gold:0', 'A'], ['gold:1', 'C']])
  })

  it('skips invalid sponsors with one indexed warning each', () => {
    const cases = [
      [sponsor({ tier: 'silver' }), 'undeclared tier "silver" (declared: platinum, gold)'],
      [sponsor({ name: '' }), 'needs a name'],
      [sponsor({ logo: '' }), 'needs a logo'],
      [sponsor({ href: 'javascript:alert(1)' }), 'absolute http(s) href'],
      [sponsor({ href: 'mailto:a@b.c' }), 'absolute http(s) href'],
      [sponsor({ href: 'data:text/html,x' }), 'absolute http(s) href'],
      [sponsor({ href: '//acme.example' }), 'absolute http(s) href'],
      [sponsor({ href: '/acme' }), 'absolute http(s) href'],
      [sponsor({ href: '#acme' }), 'absolute http(s) href'],
      [sponsor({ href: 'acme.example' }), 'absolute http(s) href'],
      ['Acme', 'must be an object']
    ]

    for (const [item, message] of cases) {
      const { result, warnings } = normalize({ enabled: true, tiers: TIERS, items: [item] }, { links: { sponsor: 'https://x.example/s' } })

      expect(result.tiers.every(tier => tier.items.length === 0)).toBe(true)
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('sponsors.items[0]')
      expect(warnings[0]).toContain(message)
    }
  })

  it('drops an invalid logoDark but keeps the sponsor', () => {
    const { result, warnings } = normalize({ enabled: true, tiers: TIERS, items: [sponsor({ logoDark: 42 })] })

    expect(result.tiers[0].items[0].logoDark).toBeNull()
    expect(warnings).toEqual(['sponsors.items[0] ("Acme") has an invalid logoDark — ignored, the light logo is used'])
  })

  it('resolves logos against the base path and leaves absolute ones alone', () => {
    const { result } = normalize({
      enabled: true,
      tiers: TIERS,
      items: [sponsor({ logoDark: 'images/acme-dark.svg' }), sponsor({ name: 'Globex', tier: 'gold', logo: 'https://cdn.example/globex.png' })]
    }, { base: '/docs/' })

    expect(result.tiers[0].items[0]).toMatchObject({ logo: '/docs/images/sponsors/acme.svg', logoDark: '/docs/images/acme-dark.svg' })
    expect(result.tiers[1].items[0]).toMatchObject({ logo: 'https://cdn.example/globex.png', logoDark: null })
  })

  it('trims names and hrefs', () => {
    const { result } = normalize({ enabled: true, tiers: TIERS, items: [sponsor({ name: '  Acme  ', href: ' https://acme.example ' })] })

    expect(result.tiers[0].items[0]).toMatchObject({ name: 'Acme', href: 'https://acme.example' })
  })
})

describe('sponsors — fallback link, example slots and visibility', () => {
  it('prefers sponsors.fallbackUrl, then links.sponsor, then nothing', () => {
    expect(resolveSponsorFallbackUrl({ sponsors: { fallbackUrl: 'https://a.example/sponsors' }, links: { sponsor: 'https://b.example' } })).toBe('https://a.example/sponsors')
    expect(resolveSponsorFallbackUrl({ sponsors: {}, links: { sponsor: ' https://b.example ' } })).toBe('https://b.example')
    expect(resolveSponsorFallbackUrl({ sponsors: { fallbackUrl: '/sponsors' } })).toBe('/sponsors')
    expect(resolveSponsorFallbackUrl({})).toBeNull()
  })

  it('treats null and blank as not set, silently', () => {
    const warnings = []
    expect(resolveSponsorFallbackUrl({ sponsors: { fallbackUrl: '  ' }, links: { sponsor: null } }, { onWarning: message => warnings.push(message) })).toBeNull()
    expect(warnings).toEqual([])
  })

  it('warns about an invalid fallback and falls back to links.sponsor', () => {
    for (const fallbackUrl of ['javascript:alert(1)', '//evil.example', 42, 'sponsors']) {
      const warnings = []
      const url = resolveSponsorFallbackUrl({ sponsors: { fallbackUrl }, links: { sponsor: 'https://b.example' } }, { onWarning: message => warnings.push(message) })

      expect(url).toBe('https://b.example')
      expect(warnings).toEqual(['sponsors.fallbackUrl must be an http(s) URL or a root-relative path — ignored'])
    }
  })

  it('turns an empty tier into an example slot when there is a fallback link', () => {
    const { result, warnings } = normalize({ enabled: true, tiers: TIERS, items: [sponsor({ tier: 'gold' })] }, { links: { sponsor: 'https://x.example/sponsor' } })

    expect(warnings).toEqual([])
    expect(result.fallback).toBe('https://x.example/sponsor')
    expect(result.tiers.map(tier => [tier.id, tier.example, tier.items.length])).toEqual([['platinum', true, 0], ['gold', false, 1]])
  })

  it('drops an empty tier when there is no fallback link', () => {
    const { result } = normalize({ enabled: true, tiers: TIERS, items: [sponsor({ tier: 'gold' })] })

    expect(result.fallback).toBeNull()
    expect(result.tiers.map(tier => tier.id)).toEqual(['gold'])
  })

  it('shows only example slots and the button while there is no sponsor yet', () => {
    const { result } = normalize({ enabled: true, fallbackUrl: '/sponsors', tiers: TIERS, items: [] })

    expect(result.visible).toBe(true)
    expect(result.tiers.every(tier => tier.example)).toBe(true)
  })

  it('stays visible with sponsors but no fallback link', () => {
    const { result } = normalize({ enabled: true, tiers: TIERS, items: [sponsor()] })

    expect(result.visible).toBe(true)
    expect(result.tiers).toHaveLength(1)
  })

  it('warns once when there is nothing to show', () => {
    const { result, warnings } = normalize({ enabled: true, tiers: TIERS, items: [] })

    expect(result.visible).toBe(false)
    expect(warnings).toEqual(['sponsors is enabled but has nothing to show — add a sponsor, or set sponsors.fallbackUrl or links.sponsor'])
  })
})

describe('sponsors — purity and presets', () => {
  it('never mutates its input and is repeatable', () => {
    const config = deepFreeze({ sponsors: { enabled: true, tiers: TIERS.map(tier => ({ ...tier })), items: [sponsor(), sponsor({ tier: 'gold' })] }, links: { sponsor: '/s' } })

    expect(() => normalizeSponsorsConfig(config)).not.toThrow()
    expect(normalizeSponsorsConfig(config)).toEqual(normalizeSponsorsConfig(config))
  })

  it('is silent without onWarning and uses no clock or randomness', () => {
    const warn = vi.spyOn(console, 'warn')
    const random = vi.spyOn(Math, 'random')
    const now = vi.spyOn(Date, 'now')

    try {
      normalizeSponsorsConfig({ sponsors: { enabled: 'yes' } })
      normalizeSponsorsConfig({ sponsors: { enabled: true, tiers: [{ id: 'x', layout: 'nope' }], items: [{ name: 'A' }] } })

      expect(warn).not.toHaveBeenCalled()
      expect(random).not.toHaveBeenCalled()
      expect(now).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
      random.mockRestore()
      now.mockRestore()
    }
  })

  it('freezes the layout presets and keeps them well-formed', () => {
    expect(Object.isFrozen(SPONSOR_LAYOUTS)).toBe(true)
    expect(Object.keys(SPONSOR_LAYOUTS)).toEqual(['wide', 'square'])

    for (const preset of Object.values(SPONSOR_LAYOUTS)) {
      expect(Object.isFrozen(preset)).toBe(true)
      expect(Number.isInteger(preset.columns)).toBe(true)
      expect(Number.isInteger(preset.width)).toBe(true)
      expect(Number.isInteger(preset.height)).toBe(true)
      expect(preset.ratio).toMatch(/^\d+ \/ \d+$/)
    }
  })
})

describe('resolveFallbackLinkAttrs', () => {
  it('opens another site in a new tab and keeps a site path in the same tab', () => {
    expect(resolveFallbackLinkAttrs('https://github.com/sponsors/x')).toEqual({ target: '_blank', rel: 'noopener' })
    expect(resolveFallbackLinkAttrs('/sponsors')).toEqual({})
    expect(resolveFallbackLinkAttrs(null)).toEqual({})
  })
})

describe('sponsors — documented examples', () => {
  // ! Copied from src/pages/manual/basic/sponsors.overview.en-US.md — an example
  //   that drifts from the normalizer fails here
  it('normalizes the "Enable it" example with no warnings', () => {
    const { result, warnings } = normalize({
      enabled: true,
      tiers: [
        { id: 'platinum', layout: 'wide' },
        { id: 'gold', layout: 'square' }
      ],
      items: [
        { name: 'Acme', tier: 'platinum', href: 'https://acme.example', logo: '/images/sponsors/acme.svg' },
        { name: 'Globex', tier: 'gold', href: 'https://globex.example', logo: '/images/sponsors/globex.png' }
      ]
    }, { links: { sponsor: 'https://github.com/sponsors/your-org' } })

    expect(warnings).toEqual([])
    expect(result.visible).toBe(true)
    expect(result.fallback).toBe('https://github.com/sponsors/your-org')
    expect(result.tiers.map(tier => [tier.id, tier.items.length, tier.example])).toEqual([['platinum', 1, false], ['gold', 1, false]])
  })

  it('normalizes the dark-logo example with no warnings', () => {
    const { result, warnings } = normalize({
      enabled: true,
      tiers: [{ id: 'platinum', layout: 'wide' }],
      items: [{ name: 'Acme', tier: 'platinum', href: 'https://acme.example', logo: '/images/sponsors/acme.svg', logoDark: '/images/sponsors/acme-dark.svg' }]
    })

    expect(warnings).toEqual([])
    expect(result.tiers[0].items[0].logoDark).toBe('/images/sponsors/acme-dark.svg')
  })

  it('normalizes the fallback example into example slots with no warnings', () => {
    const { result, warnings } = normalize({
      enabled: true,
      fallbackUrl: '/guide/sponsoring/overview/',
      tiers: [{ id: 'platinum', layout: 'wide' }, { id: 'gold', layout: 'square' }],
      items: []
    })

    expect(warnings).toEqual([])
    expect(result.fallback).toBe('/guide/sponsoring/overview/')
    expect(result.tiers.map(tier => tier.example)).toEqual([true, true])
  })
})

describe('sponsors — review hardening', () => {
  it('never throws while describing odd values in warnings', () => {
    const circular = {}
    circular.self = circular

    expect(() => normalizeSponsorsConfig({ sponsors: { enabled: true, tiers: [{ id: 'a', layout: 10n }], items: [] } })).not.toThrow()
    expect(() => normalizeSponsorsConfig({ sponsors: { enabled: true, tiers: [{ id: 'a', layout: 'wide' }], items: [sponsor({ tier: circular })] } })).not.toThrow()

    const { warnings } = normalize({ enabled: true, tiers: [{ id: 'a', layout: 10n }], items: [sponsor({ tier: Symbol('x') })] }, { links: { sponsor: '/s' } })
    expect(warnings[0]).toContain('unknown layout bigint')
    expect(warnings[1]).toContain('undeclared tier Symbol(x)')
  })

  it('says what happens to an invalid links.sponsor', () => {
    const warnings = []
    resolveSponsorFallbackUrl({ links: { sponsor: 'javascript:alert(1)' } }, { onWarning: message => warnings.push(message) })

    expect(warnings).toEqual(['links.sponsor must be an http(s) URL or a root-relative path — not used as the sponsors fallback'])
  })

  it('shows only the button, silently otherwise, when no tier is declared but a fallback exists', () => {
    const { result, warnings } = normalize({ enabled: true, tiers: [], items: [] }, { links: { sponsor: 'https://x.example/sponsor' } })

    expect(result.visible).toBe(true)
    expect(result.tiers).toEqual([])
    expect(warnings).toEqual(['sponsors.tiers must list at least one { id, layout } tier'])
  })

  it('treats null as "not set", without warnings', () => {
    const { result, warnings } = normalize({ enabled: null, tiers: TIERS, items: [sponsor()] })
    expect(result.enabled).toBe(false)
    expect(warnings).toEqual([])

    const enabled = normalize({ enabled: true, tiers: TIERS, items: [sponsor({ logoDark: null })] })
    expect(enabled.warnings).toEqual([])
    expect(enabled.result.tiers[0].items[0].logoDark).toBeNull()
  })

  it('rejects a blank logo and accepts an uppercase scheme', () => {
    const blank = normalize({ enabled: true, tiers: TIERS, items: [sponsor({ logo: '   ' })] }, { links: { sponsor: '/s' } })
    expect(blank.warnings).toEqual(['sponsors.items[0] ("Acme") needs a logo — ignored'])

    const upper = normalize({ enabled: true, tiers: TIERS, items: [sponsor({ href: 'HTTPS://ACME.EXAMPLE' })] })
    expect(upper.warnings).toEqual([])
    expect(upper.result.tiers[0].items[0].href).toBe('HTTPS://ACME.EXAMPLE')
  })
})
