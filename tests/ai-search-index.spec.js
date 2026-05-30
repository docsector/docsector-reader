import { describe, expect, it } from 'vitest'

import { createAiSearchIndexArtifacts } from '../src/ai-assistant/indexing.js'

describe('AI Search indexing artifacts', () => {
  it('creates a Markdown-focused manifest and sitemap', () => {
    const artifacts = createAiSearchIndexArtifacts({
      siteUrl: 'https://docs.example.com/',
      generatedAt: '2026-05-30T00:00:00.000Z',
      entries: [
        {
          title: 'Agent Skills',
          path: 'manual/basic/agent-skills/overview',
          markdownPath: 'manual/basic/agent-skills/overview.md',
          locale: 'en-US',
          book: 'manual',
          version: 'v4.3.3',
          subpage: 'overview'
        }
      ]
    })

    expect(artifacts.manifest.pages).toEqual([
      {
        title: 'Agent Skills',
        path: 'manual/basic/agent-skills/overview',
        markdownUrl: 'https://docs.example.com/manual/basic/agent-skills/overview.md',
        url: 'https://docs.example.com/manual/basic/agent-skills/overview',
        locale: 'en-US',
        book: 'manual',
        version: 'v4.3.3',
        subpage: 'overview'
      }
    ])
    expect(artifacts.sitemap).toContain('<loc>https://docs.example.com/manual/basic/agent-skills/overview.md</loc>')
    expect(artifacts.sitemap).toContain('<lastmod>2026-05-30</lastmod>')
  })

  it('falls back to root-relative URLs when siteUrl is omitted', () => {
    const artifacts = createAiSearchIndexArtifacts({
      generatedAt: '2026-05-30T00:00:00.000Z',
      entries: [
        {
          title: 'Agent Skills',
          path: 'manual/basic/agent-skills/overview',
          markdownPath: 'manual/basic/agent-skills/overview.md'
        }
      ]
    })

    expect(artifacts.manifest.pages[0].markdownUrl).toBe('/manual/basic/agent-skills/overview.md')
    expect(artifacts.manifest.pages[0].url).toBe('/manual/basic/agent-skills/overview')
    expect(artifacts.sitemap).toContain('<loc>/manual/basic/agent-skills/overview.md</loc>')
  })
})