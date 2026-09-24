import { describe, expect, it, vi } from 'vitest'

import { normalizeAdPath, normalizeAdsConfig, resolveAdLinkAttrs, resolvePageAd } from '../src/ads/config.js'
import { hashString } from '../src/hash.js'
import manualPages from '../src/pages/manual.index.js'

const creative = (overrides = {}) => ({
  href: 'https://example.com/course',
  title: { 'en-US': 'Official course', 'pt-BR': 'Curso oficial' },
  ...overrides
})

const normalize = (ads, { links, sponsors, base } = {}) => {
  const warnings = []
  const result = normalizeAdsConfig({ ads, links, sponsors }, { base, onWarning: message => warnings.push(message) })
  return { result, warnings }
}

const pageRoute = (path) => ({ path, meta: { book: 'manual' } })

describe('ads — enabling', () => {
  it('is disabled and silent by default', () => {
    for (const config of [{}, undefined, { ads: null }, { ads: { enabled: false, items: 'broken' } }]) {
      const warnings = []
      expect(normalizeAdsConfig(config, { onWarning: message => warnings.push(message) })).toEqual({ enabled: false, items: [], fallback: null })
      expect(warnings).toEqual([])
    }
  })

  it('enables only on the boolean true', () => {
    const { result, warnings } = normalize({ enabled: 'true', items: [creative()] })

    expect(result.enabled).toBe(false)
    expect(warnings).toEqual(['ads.enabled must be the boolean true — the section stays disabled'])
  })
})

describe('ads — creatives', () => {
  it('keeps valid creatives with their raw locale maps', () => {
    const { result, warnings } = normalize({
      enabled: true,
      items: [creative({ text: { 'en-US': 'Learn it.' }, image: '/images/promo/course.png' }), creative({ title: 'Plain title' })]
    })

    expect(warnings).toEqual([])
    expect(result.items).toEqual([
      { href: 'https://example.com/course', title: { 'en-US': 'Official course', 'pt-BR': 'Curso oficial' }, text: { 'en-US': 'Learn it.' }, image: '/images/promo/course.png' },
      { href: 'https://example.com/course', title: 'Plain title', text: null, image: null }
    ])
    expect(result.fallback).toBeNull()
  })

  it('drops creatives without a safe href or a title', () => {
    const cases = [
      [creative({ href: 'javascript:alert(1)' }), 'absolute http(s) href'],
      [creative({ href: '/course' }), 'absolute http(s) href'],
      [creative({ href: '//example.com' }), 'absolute http(s) href'],
      [creative({ href: '#course' }), 'absolute http(s) href'],
      [creative({ href: 'mailto:a@b.c' }), 'absolute http(s) href'],
      [creative({ title: '' }), 'needs a title'],
      [creative({ title: { 'en-US': '' } }), 'needs a title'],
      [creative({ title: ['x'] }), 'needs a title'],
      [42, 'must be an object']
    ]

    for (const [item, message] of cases) {
      const { result, warnings } = normalize({ enabled: true, items: [item] }, { links: { sponsor: '/sponsor' } })

      expect(result.items).toEqual([])
      expect(warnings[0]).toContain('ads.items[0]')
      expect(warnings[0]).toContain(message)
    }
  })

  it('drops only an invalid text or image', () => {
    const { result, warnings } = normalize({ enabled: true, items: [creative({ text: 7, image: '' })] })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ text: null, image: null })
    expect(warnings).toEqual(['ads.items[0] has an invalid text — ignored', 'ads.items[0] has an invalid image — ignored'])
  })

  it('resolves images against the base path', () => {
    const { result } = normalize({ enabled: true, items: [creative({ image: 'images/promo.png' })] }, { base: '/docs/' })

    expect(result.items[0].image).toBe('/docs/images/promo.png')
  })
})

describe('ads — example ad', () => {
  it('falls back to the sponsors link when there is no creative', () => {
    const { result, warnings } = normalize({ enabled: true, items: [] }, { sponsors: { fallbackUrl: '/sponsors' }, links: { sponsor: 'https://github.com/sponsors/x' } })

    expect(warnings).toEqual([])
    expect(result).toEqual({ enabled: true, items: [], fallback: '/sponsors' })
    expect(resolvePageAd(result, pageRoute('/manual/basic/theme/overview'))).toEqual({ example: true, href: '/sponsors' })
  })

  it('uses links.sponsor when the sponsors section sets no fallback', () => {
    const { result } = normalize({ enabled: true }, { links: { sponsor: 'https://github.com/sponsors/x' } })

    expect(result.fallback).toBe('https://github.com/sponsors/x')
  })

  it('warns and shows nothing without a creative or a fallback link', () => {
    const { result, warnings } = normalize({ enabled: true, items: [] })

    expect(resolvePageAd(result, pageRoute('/manual/basic/theme/overview'))).toBeNull()
    expect(warnings).toEqual(['ads is enabled but has no valid creative and no sponsors fallback URL — nothing to show'])
  })

  it('does not resolve the fallback link while creatives exist', () => {
    const { warnings } = normalize({ enabled: true, items: [creative()] }, { links: { sponsor: 'javascript:alert(1)' } })

    expect(warnings).toEqual([])
  })
})

describe('ads — per-page pick', () => {
  const ads = normalizeAdsConfig({ ads: { enabled: true, items: [creative({ title: 'A' }), creative({ title: 'B' }), creative({ title: 'C' })] } })

  it('normalizes trailing slashes', () => {
    expect(normalizeAdPath('/a/overview')).toBe('/a/overview')
    expect(normalizeAdPath('/a/overview/')).toBe('/a/overview')
    expect(normalizeAdPath('/a/overview//')).toBe('/a/overview')
    expect(normalizeAdPath('')).toBe('/')
    expect(normalizeAdPath('/')).toBe('/')
    expect(normalizeAdPath(undefined)).toBe('/')
  })

  it('picks the same creative for the prerendered and the linked form of a page', () => {
    for (const path of ['/manual/basic/theme/overview', '/guide/getting-started/showcase', '/x/overview']) {
      const expected = ads.items[hashString(path) % ads.items.length]

      expect(resolvePageAd(ads, pageRoute(path))).toBe(expected)
      expect(resolvePageAd(ads, pageRoute(`${path}/`))).toBe(expected)
    }
  })

  it('spreads the creatives across the manual pages', () => {
    const seen = new Set()
    for (const key of Object.keys(manualPages)) {
      seen.add(resolvePageAd(ads, pageRoute(`/manual${key}/overview`)).title)
    }

    expect([...seen].sort()).toEqual(['A', 'B', 'C'])
  })

  it('never shows an ad on the home page or when disabled', () => {
    expect(resolvePageAd(ads, { path: '/', meta: { book: 'home' } })).toBeNull()
    expect(resolvePageAd(ads, { path: '/', meta: { type: 'home' } })).toBeNull()
    expect(resolvePageAd({ enabled: false, items: [], fallback: null }, pageRoute('/x/overview'))).toBeNull()
    expect(resolvePageAd(null, pageRoute('/x/overview'))).toBeNull()
  })

  it('always picks a single creative, stably, without randomness', () => {
    const single = normalizeAdsConfig({ ads: { enabled: true, items: [creative({ title: 'Only' })] } })
    const random = vi.spyOn(Math, 'random')

    try {
      const picks = new Set()
      for (let run = 0; run < 1000; run++) {
        picks.add(resolvePageAd(ads, pageRoute('/manual/basic/theme/overview')))
      }

      expect(picks.size).toBe(1)
      expect(resolvePageAd(single, pageRoute('/any/overview')).title).toBe('Only')
      expect(random).not.toHaveBeenCalled()
    } finally {
      random.mockRestore()
    }
  })
})

describe('resolveAdLinkAttrs', () => {
  it('marks creatives as sponsored and the example ad as a plain self link', () => {
    expect(resolveAdLinkAttrs({ href: 'https://example.com/course', title: 'A' })).toEqual({ target: '_blank', rel: 'sponsored noopener' })
    expect(resolveAdLinkAttrs({ example: true, href: 'https://github.com/sponsors/x' })).toEqual({ target: '_blank', rel: 'noopener' })
    expect(resolveAdLinkAttrs({ example: true, href: '/sponsors' })).toEqual({})
  })
})

describe('ads — documented examples', () => {
  // ! Copied from src/pages/manual/basic/page-ad.overview.en-US.md
  it.each([
    ['Enable it', { enabled: true, items: [{ href: 'https://example.com/course', image: '/images/promo/course.png', title: 'Official course', text: 'Learn it in a weekend, with hands-on projects.' }] }, 1],
    ['Several creatives', { enabled: true, items: [{ href: 'https://example.com/course', title: 'Official course' }, { href: 'https://example.com/book', title: 'The book', image: '/images/promo/book.png' }] }, 2],
    ['Localized copy', { enabled: true, items: [{ href: 'https://example.com/course', title: { 'en-US': 'Official course', 'pt-BR': 'Curso oficial' }, text: { 'en-US': 'Learn it in a weekend.', 'pt-BR': 'Aprenda em um fim de semana.' } }] }, 1]
  ])('normalizes the "%s" example with no warnings', (_, ads, count) => {
    const { result, warnings } = normalize(ads)

    expect(warnings).toEqual([])
    expect(result.items).toHaveLength(count)
  })
})

describe('ads — review hardening', () => {
  it('treats null text and image as "not set", without warnings', () => {
    const { result, warnings } = normalize({ enabled: true, items: [creative({ text: null, image: null })] })

    expect(warnings).toEqual([])
    expect(result.items[0]).toMatchObject({ text: null, image: null })
  })

  it('treats a null section switch as off, silently', () => {
    const { result, warnings } = normalize({ enabled: null, items: [creative()] })

    expect(result.enabled).toBe(false)
    expect(warnings).toEqual([])
  })
})
