import { describe, expect, it } from 'vitest'

import { buildEarlyHintsLink } from '../src/quasar.factory.js'

describe('buildEarlyHintsLink', () => {
  it('composes CSS first, then the module graph, as one Link value', () => {
    const link = buildEarlyHintsLink({
      baseCss: ['assets/index-abc.css'],
      entryScripts: ['assets/index-abc.js'],
      sharedFiles: ['assets/DSubpage-def.js'],
      sharedCss: ['assets/DSubpage-def.css']
    })

    expect(link).toBe([
      '</assets/index-abc.css>; rel=preload; as=style',
      '</assets/index-abc.js>; rel=modulepreload; crossorigin',
      '</assets/DSubpage-def.js>; rel=modulepreload; crossorigin',
      '</assets/DSubpage-def.css>; rel=preload; as=style'
    ].join(', '))
  })

  it('deduplicates files that appear in more than one wave', () => {
    const link = buildEarlyHintsLink({
      entryScripts: ['assets/index-abc.js'],
      sharedFiles: ['assets/index-abc.js', 'assets/boot-ghi.js']
    })

    expect(link).toBe([
      '</assets/index-abc.js>; rel=modulepreload; crossorigin',
      '</assets/boot-ghi.js>; rel=modulepreload; crossorigin'
    ].join(', '))
  })

  it('skips empty entries and returns an empty string when nothing is given', () => {
    expect(buildEarlyHintsLink({})).toBe('')
    expect(buildEarlyHintsLink({ baseCss: ['', null] })).toBe('')
  })
})
