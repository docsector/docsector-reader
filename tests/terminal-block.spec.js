import { describe, expect, it } from 'vitest'

import { tokenizePageSectionSource } from '../src/components/page-section-tokens.js'

describe('d-block-terminal tokenization', () => {
  it('tokenizes a paired terminal block with caption and attributes', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-terminal engine="demo-echo" title="Echo demo" command="echo Hi" height="300" autorun="true" run-label="Play">
Caption with *emphasis*.
</d-block-terminal>
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      tag: 'terminal',
      engine: 'demo-echo',
      title: 'Echo demo',
      command: 'echo Hi',
      height: '300',
      autorun: true,
      runLabel: 'Play'
    })
    expect(tokens[0].caption).toContain('<em>emphasis</em>')
    expect(typeof tokens[0].codeIndex).toBe('number')
  })

  it('tokenizes a self-closing terminal block with a command picker', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-terminal engine="bootgly-cli" commands="Alert:demo 12|Table:demo 21| :demo 0|Raw command" />
`)

    expect(tokens).toHaveLength(1)
    expect(tokens[0].tag).toBe('terminal')
    expect(tokens[0].autorun).toBe(false)
    expect(tokens[0].commands).toEqual([
      { label: 'Alert', command: 'demo 12' },
      { label: 'Table', command: 'demo 21' },
      { label: 'demo 0', command: 'demo 0' },
      { label: 'Raw command', command: 'Raw command' }
    ])
  })

  it('leaves the block as plain content when engine is missing', () => {
    const tokens = tokenizePageSectionSource(`
<d-block-terminal title="No engine" />
`)

    expect(tokens.some((token) => token.tag === 'terminal')).toBe(false)
  })
})
