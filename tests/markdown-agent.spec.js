import { describe, expect, it } from 'vitest'

import { matchesMarkdownAgentUserAgent } from '../src/markdown-agent.js'

describe('markdown agent detection', () => {
  it('matches Cloudflare AI Search crawler', () => {
    expect(matchesMarkdownAgentUserAgent('Cloudflare-AI-Search')).toBe(true)
  })

  it('matches other known AI crawlers', () => {
    expect(matchesMarkdownAgentUserAgent('GPTBot')).toBe(true)
    expect(matchesMarkdownAgentUserAgent('PerplexityBot/1.0')).toBe(true)
  })

  it('ignores regular browser user agents', () => {
    expect(matchesMarkdownAgentUserAgent('Mozilla/5.0 Chrome/137.0 Safari/537.36')).toBe(false)
  })
})