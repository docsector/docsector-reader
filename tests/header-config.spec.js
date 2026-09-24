import { describe, expect, it, vi } from 'vitest'

import { estimate, normalize } from '../src/header/config.js'

// : normalize with a warning collector
const run = (header) => {
  const warnings = []
  const result = normalize({ header }, { onWarning: message => warnings.push(message) })
  return { ...result, warnings }
}

describe('HeaderConfig.normalize', () => {
  it('is off, silently, when the section or its links are absent or empty', () => {
    for (const header of [undefined, null, {}, { links: null }, { links: [] }]) {
      expect(run(header)).toEqual({ links: [], warnings: [] })
    }
    expect(normalize()).toEqual({ links: [] })
  })

  it('normalizes leaves and dropdowns, trimming values and keeping labels raw', () => {
    const map = { 'en-US': 'Ecosystem', 'pt-BR': 'Ecossistema' }
    const { links, warnings } = run({
      links: [
        { label: 'Sponsors', icon: ' favorite ', href: ' /sponsors/ ' },
        { label: map, icon: 'hub', children: [
          { label: 'Benchmarks', icon: 'speed', href: 'https://example.com/b' },
          { label: 'Start', href: '/guide/getting-started/' }
        ] },
        { label: 'GitHub', href: 'https://github.com/org/repo' }
      ]
    })

    expect(warnings).toEqual([])
    expect(links).toEqual([
      { label: 'Sponsors', icon: 'favorite', href: '/sponsors/', children: [] },
      { label: map, icon: 'hub', href: null, children: [
        { label: 'Benchmarks', icon: 'speed', href: 'https://example.com/b', children: [] },
        { label: 'Start', icon: null, href: '/guide/getting-started/', children: [] }
      ] },
      { label: 'GitHub', icon: null, href: 'https://github.com/org/repo', children: [] }
    ])
    expect(links[1].label).toBe(map)
  })

  it('warns about a section or a list of the wrong type', () => {
    expect(run('links')).toEqual({ links: [], warnings: ['header must be an object — no header links'] })
    expect(run([])).toEqual({ links: [], warnings: ['header must be an object — no header links'] })
    expect(run({ links: {} })).toEqual({ links: [], warnings: ['header.links must be an array — no header links'] })
  })

  it('skips items that cannot render, one indexed warning each', () => {
    const { links, warnings } = run({
      links: [
        'Docs',
        { href: '/x/' },
        { label: '   ', href: '/x/' },
        { label: { 'en-US': '' }, href: '/x/' },
        { label: 'Docs', url: '/guide/' },
        { label: 'Blank', href: '  ' },
        { label: 'Ok', href: '/ok/' }
      ]
    })

    expect(links.map(link => link.label)).toEqual(['Ok'])
    expect(warnings).toEqual([
      'header.links[0] must be an object — ignored',
      'header.links[1] needs a label (a string or a locale map) — ignored',
      'header.links[2] needs a label (a string or a locale map) — ignored',
      'header.links[3] needs a label (a string or a locale map) — ignored',
      'header.links[4] (Docs) needs an href or children (write href, not url) — ignored',
      'header.links[5] (Blank) needs an href or children — ignored'
    ])
  })

  it('drops an invalid icon and keeps the link', () => {
    const { links, warnings } = run({ links: [{ label: 'Docs', icon: 7, href: '/docs/' }, { label: 'Blank', icon: ' ', href: '/b/' }] })

    expect(links.map(link => link.icon)).toEqual([null, null])
    expect(warnings).toEqual([
      'header.links[0] (Docs) has an invalid icon 7 — shown without one',
      'header.links[1] (Blank) has an invalid icon " " — shown without one'
    ])
  })

  it('treats children that are not a list as absent, and an empty list silently', () => {
    const { links, warnings } = run({
      links: [
        { label: 'A', href: '/a/', children: 'b' },
        { label: 'C', href: '/c/', children: [] }
      ]
    })

    expect(links.map(link => [link.label, link.href, link.children.length])).toEqual([['A', '/a/', 0], ['C', '/c/', 0]])
    expect(warnings).toEqual(['header.links[0] (A) children must be an array — ignored'])
  })

  it('ignores the href of a dropdown, and grandchildren', () => {
    const { links, warnings } = run({
      links: [{
        label: 'Menu',
        href: '/menu/',
        children: [{ label: 'Deep', href: '/deep/', children: [{ label: 'Deeper', href: '/deeper/' }] }]
      }]
    })

    expect(links).toEqual([{ label: 'Menu', icon: null, href: null, children: [{ label: 'Deep', icon: null, href: '/deep/', children: [] }] }])
    expect(warnings).toEqual([
      'header.links[0] (Menu) has children — its href is ignored',
      'header.links[0].children[0] (Deep) has children — only one level of sublinks is shown'
    ])
  })

  it('treats an empty children list of a sublink as none, and one without an href as unusable', () => {
    const { links, warnings } = run({
      links: [{
        label: 'Menu',
        children: [
          { label: 'Empty', href: '/e/', children: [] },
          { label: 'Deep', children: [{ label: 'X', href: '/x/' }] }
        ]
      }]
    })

    expect(links[0].children.map(child => child.label)).toEqual(['Empty'])
    expect(warnings).toEqual([
      'header.links[0].children[1] (Deep) has children — only one level of sublinks is shown, and it has no href of its own — ignored'
    ])
  })

  it('accepts a null icon silently and warns about links that are not a list', () => {
    expect(run({ links: [{ label: 'A', icon: null, href: '/a/' }] })).toEqual({ links: [{ label: 'A', icon: null, href: '/a/', children: [] }], warnings: [] })
    expect(run({ links: false }).warnings).toEqual(['header.links must be an array — no header links'])
  })

  it('skips invalid sublinks, and a dropdown left with none', () => {
    const { links, warnings } = run({
      links: [
        { label: 'Menu', children: [null, { href: '/x/' }, { label: 'Ok', href: '/ok/' }] },
        { label: 'Empty', children: [{ label: 'Nope' }] }
      ]
    })

    expect(links).toEqual([{ label: 'Menu', icon: null, href: null, children: [{ label: 'Ok', icon: null, href: '/ok/', children: [] }] }])
    expect(warnings).toEqual([
      'header.links[0].children[0] must be an object — ignored',
      'header.links[0].children[1] needs a label (a string or a locale map) — ignored',
      'header.links[1].children[0] (Nope) needs an href or children — ignored',
      'header.links[1] (Empty) has no valid sublinks — ignored'
    ])
  })

  it('never throws on values JSON cannot describe, and is silent without onWarning', () => {
    const circular = {}
    circular.self = circular

    expect(() => normalize({ header: { links: [{ label: 'A', icon: 10n, href: '/a/' }, { label: 'B', icon: circular, href: '/b/' }] } })).not.toThrow()
    expect(run({ links: [{ label: 'A', icon: 10n, href: '/a/' }] }).warnings).toEqual(['header.links[0] (A) has an invalid icon bigint — shown without one'])
    expect(run({ links: [{ label: 'B', icon: circular, href: '/b/' }] }).warnings).toEqual(['header.links[0] (B) has an invalid icon object — shown without one'])
  })

  it('does not change its input', () => {
    const header = Object.freeze({ links: Object.freeze([Object.freeze({ label: 'A', href: ' /a/ ', children: Object.freeze([]) })]) })
    const spy = vi.fn()

    expect(() => normalize({ header }, { onWarning: spy })).not.toThrow()
    expect(header.links[0].href).toBe(' /a/ ')
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('HeaderConfig.estimate', () => {
  const link = (extra = {}) => ({ label: 'Docs', icon: null, href: '/docs/', children: [], ...extra })

  it('grows with labels, icons, dropdown arrows and new-tab icons', () => {
    const base = estimate([link()])

    expect(base).toBeGreaterThan(0)
    expect(estimate([link({ label: 'Documentation' })])).toBeGreaterThan(base)
    expect(estimate([link({ icon: 'book' })])).toBeGreaterThan(base)
    expect(estimate([link({ href: 'https://example.com' })])).toBeGreaterThan(base)
    expect(estimate([link({ href: null, children: [link()] })])).toBeGreaterThan(base)
    expect(estimate([link(), link()])).toBeGreaterThan(base)
    expect(estimate([])).toBe(0)
  })

  it('ignores the spaces around a label, which never render', () => {
    expect(estimate([link({ label: '   Docs   ' })])).toBe(estimate([link()]))
    expect(estimate([link({ label: { 'en-US': '  Docs  ' } })])).toBe(estimate([link()]))
  })

  it('uses the longest label over every locale, so the estimate never depends on the language', () => {
    expect(estimate([link({ label: { 'en-US': 'Ecosystem', 'pt-BR': 'Ecossistema' } })])).toBe(estimate([link({ label: 'Ecossistema' })]))
  })

  it('adds 10% to the metrics of each part', () => {
    // (padding 32 + 4 × 8.4) × 1.1, rounded up
    expect(estimate([link()])).toBe(73)
    // (32 + 4 × 8.4 + icon 36 + dropdown arrow 32) × 1.1
    expect(estimate([link({ icon: 'hub', href: null, children: [link()] })])).toBe(147)
    // (32 + 6 × 8.4 + new-tab icon 22) × 1.1
    expect(estimate([link({ label: 'GitHub', href: 'https://github.com' })])).toBe(115)
  })

  it('stays generous: at least 8px per character plus the padding of each link', () => {
    const links = [link({ label: 'Getting started', icon: 'school' }), link({ label: 'GitHub', icon: 'code', href: 'https://github.com/org/repo' })]
    const floor = (15 + 6) * 8 + 2 * 32 + 2 * 36 + 22

    expect(estimate(links)).toBeGreaterThanOrEqual(floor)
  })
})
