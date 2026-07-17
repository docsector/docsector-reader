import { describe, expect, it } from 'vitest'

import { compilePageTokens, extractPageHeading, PAGE_TOKENS_VERSION } from '../src/components/page-tokens-compile.js'
import { tokenizePageSectionSource } from '../src/components/page-section-tokens.js'
import { isCompiledPageSource, parseCompiledPageTokens } from '../src/components/page-tokens-support.js'

const SAMPLE = [
  '# Getting started',
  '',
  'A paragraph with { braces }, an @mention and a | pipe.',
  '',
  '```php',
  'if ($x) { echo $y; }',
  '```',
  '',
  '## Install',
  '',
  '### Requirements',
  '',
  'Done.'
].join('\n')

describe('compilePageTokens', () => {
  it('produces the compiled module shape', async () => {
    const compiled = await compilePageTokens(SAMPLE)

    expect(compiled.v).toBe(PAGE_TOKENS_VERSION)
    expect(compiled.math).toBe(false)
    expect(compiled.heading).toBe('Getting started')
    expect(compiled.headers).toBe(2)
    expect(typeof compiled.tokens).toBe('string')
    expect(isCompiledPageSource(compiled)).toBe(true)
  })

  it('serializes tokens identically to a live tokenization', async () => {
    const compiled = await compilePageTokens(SAMPLE)
    const live = tokenizePageSectionSource(SAMPLE, { codeToolbarDefault: null })

    expect(parseCompiledPageTokens(compiled)).toEqual(JSON.parse(JSON.stringify(live)))
  })

  it('leaves the code toolbar unbaked for render-time defaults', async () => {
    const compiled = await compilePageTokens(SAMPLE)
    const code = parseCompiledPageTokens(compiled).find((token) => token.tag === 'code')

    expect(code).toBeDefined()
    expect(code.toolbar).toBeNull()
    expect(code.content).toBe('if ($x) { echo $y; }\n')
  })

  it('pre-renders math pages with KaTeX and marks them', async () => {
    const compiled = await compilePageTokens('Euler: $e^{i\\pi}+1=0$\n')

    expect(compiled.math).toBe(true)
    expect(compiled.tokens).toContain('katex')
  })

  it('is stable across JSON round-trips (safe as a Vite module literal)', async () => {
    const compiled = await compilePageTokens(SAMPLE)

    expect(JSON.parse(JSON.stringify(compiled))).toEqual(compiled)
    expect(compiled.tokens).toBe(JSON.stringify(JSON.parse(compiled.tokens)))
  })
})

describe('extractPageHeading', () => {
  it('prefers an inline <h1> (remote README style)', () => {
    expect(extractPageHeading('<h1 align="center"><b>Bootgly</b> docs</h1>\n\n# Ignored')).toBe('Bootgly docs')
  })

  it('falls back to the first ATX heading', () => {
    expect(extractPageHeading('intro\n\n# Title here\n')).toBe('Title here')
    expect(extractPageHeading('no heading at all')).toBe('')
  })
})

describe('parseCompiledPageTokens', () => {
  it('returns [] for malformed token payloads', () => {
    expect(parseCompiledPageTokens({ v: 1, tokens: '{broken' })).toEqual([])
    expect(parseCompiledPageTokens({ v: 1, tokens: '"not-an-array"' })).toEqual([])
  })
})
