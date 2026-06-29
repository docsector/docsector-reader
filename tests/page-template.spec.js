import { describe, expect, it, vi } from 'vitest'

import {
  PAGE_TEMPLATE_FREESTYLE,
  PAGE_TEMPLATE_VS,
  getTemplate,
  isSubpageEnabled,
  resolveSubpageTemplate
} from '../src/page-template.js'
import { applyTemplateSections } from '../src/components/page-template-sections.js'
import { tokenizePageSectionSource } from '../src/components/page-section-tokens.js'

const h2 = (anchorId, content) => ({ tag: 'h2', anchorId, content: content ?? anchorId })
const p = (content) => ({ tag: 'p', content })

describe('subpage template resolution', () => {
  it('defaults to freestyle', () => {
    expect(resolveSubpageTemplate().name).toBe(PAGE_TEMPLATE_FREESTYLE)
    expect(resolveSubpageTemplate(true).name).toBe(PAGE_TEMPLATE_FREESTYLE)
    expect(resolveSubpageTemplate(false).name).toBe(PAGE_TEMPLATE_FREESTYLE)
    expect(resolveSubpageTemplate(undefined).name).toBe(PAGE_TEMPLATE_FREESTYLE)
  })

  it('resolves the vs template from a string or object', () => {
    expect(resolveSubpageTemplate('vs').name).toBe(PAGE_TEMPLATE_VS)
    expect(resolveSubpageTemplate({ template: 'vs' }).name).toBe(PAGE_TEMPLATE_VS)
    expect(resolveSubpageTemplate('Vs').name).toBe(PAGE_TEMPLATE_VS)
  })

  it('falls back to freestyle for unknown names', () => {
    expect(resolveSubpageTemplate('nope').name).toBe(PAGE_TEMPLATE_FREESTYLE)
    expect(resolveSubpageTemplate({ template: 'nope' }).name).toBe(PAGE_TEMPLATE_FREESTYLE)
  })

  it('lets the last defined source win', () => {
    expect(resolveSubpageTemplate('vs', undefined).name).toBe(PAGE_TEMPLATE_VS)
    expect(resolveSubpageTemplate('vs', 'freestyle').name).toBe(PAGE_TEMPLATE_FREESTYLE)
  })

  it('exposes the vs sections in canonical order', () => {
    const sections = getTemplate('vs').sections
    expect(sections.map(section => section.key)).toEqual(['features', 'performance', 'security'])
    expect(getTemplate('freestyle').sections).toBeNull()
    expect(getTemplate('nope').name).toBe(PAGE_TEMPLATE_FREESTYLE)
  })

  it('detects enabled subpages from boolean or object form', () => {
    expect(isSubpageEnabled(true)).toBe(true)
    expect(isSubpageEnabled({})).toBe(true)
    expect(isSubpageEnabled({ template: 'vs' })).toBe(true)
    expect(isSubpageEnabled(false)).toBe(false)
    expect(isSubpageEnabled(undefined)).toBe(false)
    expect(isSubpageEnabled(null)).toBe(false)
    expect(isSubpageEnabled([])).toBe(false)
  })
})

describe('applyTemplateSections', () => {
  it('returns tokens unchanged for the freestyle template', () => {
    const tokens = [p('x'), h2('y', 'Y')]
    expect(applyTemplateSections(tokens, getTemplate('freestyle'))).toBe(tokens)
  })

  it('handles empty or missing token input', () => {
    expect(applyTemplateSections([], getTemplate('vs'))).toEqual([])
    expect(applyTemplateSections(undefined, getTemplate('vs'))).toEqual([])
  })

  it('reorders sections into canonical template order', () => {
    const out = applyTemplateSections(
      [h2('security', 'Security'), p('sec'), h2('features', 'Features'), p('feat')],
      getTemplate('vs')
    )

    expect(out.map(token => token.tag)).toEqual(['h2', 'p', 'h2', 'p'])
    expect(out.filter(token => token.tag === 'h2').map(token => token.anchorId)).toEqual(['features', 'security'])
    expect(out[1].content).toBe('feat')
    expect(out[3].content).toBe('sec')
  })

  it('omits sections absent from the markdown', () => {
    const out = applyTemplateSections([h2('features', 'Features'), p('a')], getTemplate('vs'))
    expect(out.filter(token => token.tag === 'h2').map(token => token.anchorId)).toEqual(['features'])
  })

  it('overrides headings with the localized template title', () => {
    const en = applyTemplateSections([h2('features', 'Features')], getTemplate('vs'), 'en-US')
    expect(en[0]).toMatchObject({ tag: 'h2', anchorId: 'features', content: 'Features' })

    const pt = applyTemplateSections([h2('features', 'Features')], getTemplate('vs'), 'pt-BR')
    expect(pt[0]).toMatchObject({ tag: 'h2', anchorId: 'features', content: 'Recursos' })
  })

  it('matches localized (accented) headings and content-only headings', () => {
    const accented = applyTemplateSections([h2('seguranca', 'Segurança'), p('x')], getTemplate('vs'))
    expect(accented[0].anchorId).toBe('security')

    const contentOnly = applyTemplateSections([{ tag: 'h2', content: 'Performance' }, p('y')], getTemplate('vs'))
    expect(contentOnly[0].anchorId).toBe('performance')
  })

  it('keeps content before the first heading as an intro', () => {
    const out = applyTemplateSections([p('intro'), h2('features', 'Features'), p('a')], getTemplate('vs'))
    expect(out[0]).toEqual(p('intro'))
    expect(out[1].anchorId).toBe('features')
  })

  it('warns about unknown sections and appends them last', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const out = applyTemplateSections(
      [h2('features', 'Features'), p('a'), h2('extras', 'Extras'), p('b')],
      getTemplate('vs')
    )

    expect(out.filter(token => token.tag === 'h2').map(token => token.anchorId)).toEqual(['features', 'extras'])
    expect(out[out.length - 1].content).toBe('b')
    expect(warn).toHaveBeenCalledTimes(1)

    warn.mockRestore()
  })

  it('colorizes comparison marks in table cells', () => {
    const out = applyTemplateSections(
      [h2('features', 'Features'), { tag: 'table', content: '<table><tbody><tr><td>✓</td><td>✗</td><td>➕</td></tr></tbody></table>' }],
      getTemplate('vs')
    )
    const table = out.find(token => token.tag === 'table')

    expect(table.content).toContain('vs-mark--yes')
    expect(table.content).toContain('vs-mark--no')
    expect(table.content).toContain('vs-mark--dep')
    expect(table.content).not.toContain('<td>✓</td>')
  })

  it('flags the table for highlight only when the 2nd header matches the configured column', () => {
    const featureTable = '<thead><tr><th>Feature</th><th>Acme</th><th>Other</th></tr></thead><tbody><tr><td>Router</td><td>✓</td><td>✗</td></tr></tbody>'

    const highlighted = applyTemplateSections(
      [h2('features', 'Features'), { tag: 'table', content: featureTable }],
      getTemplate('vs'),
      'en-US',
      { highlightColumn: 'Acme' }
    )
    expect(highlighted.find(token => token.tag === 'table').highlight).toBe(true)

    const noLabel = applyTemplateSections(
      [h2('features', 'Features'), { tag: 'table', content: featureTable }],
      getTemplate('vs')
    )
    expect(noLabel.find(token => token.tag === 'table').highlight).toBeUndefined()

    const labelAsRow = applyTemplateSections(
      [h2('performance', 'Performance'), { tag: 'table', content: '<thead><tr><th>Framework</th><th>Peak</th></tr></thead><tbody><tr><td>Acme</td><td>1</td></tr></tbody>' }],
      getTemplate('vs'),
      'en-US',
      { highlightColumn: 'Acme' }
    )
    expect(labelAsRow.find(token => token.tag === 'table').highlight).toBeUndefined()
  })
})

describe('vs template end-to-end with the real tokenizer', () => {
  it('reorders, relocalizes and omits sections from real markdown', () => {
    const source = [
      'Intro line.',
      '',
      '## Security',
      '',
      'Sec body.',
      '',
      '## Features',
      '',
      'Feat body.'
    ].join('\n')

    const out = applyTemplateSections(tokenizePageSectionSource(source), getTemplate('vs'), 'pt-BR')
    const headings = out.filter(token => token.tag === 'h2')

    expect(out[0]).toMatchObject({ tag: 'p', content: 'Intro line.' })
    expect(headings.map(token => token.anchorId)).toEqual(['features', 'security'])
    expect(headings.map(token => token.content)).toEqual(['Recursos', 'Segurança'])
  })
})
