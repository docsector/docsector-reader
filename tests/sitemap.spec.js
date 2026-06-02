import { describe, expect, it } from 'vitest'

import { appendSitemapsToRobots, createSitemap } from '../src/sitemap.js'

describe('sitemap generation', () => {
  it('creates a root-relative sitemap when siteUrl is omitted', () => {
    const sitemap = createSitemap({
      generatedAt: '2026-05-30T00:00:00.000Z',
      entries: [
        { path: '/', priority: '1.0' },
        { path: '/manual/basic/ai-assistant/overview' }
      ]
    })

    expect(sitemap).toContain('<loc>/</loc>')
    expect(sitemap).toContain('<loc>/manual/basic/ai-assistant/overview</loc>')
    expect(sitemap).toContain('<lastmod>2026-05-30</lastmod>')
  })

  it('creates an absolute sitemap when siteUrl is configured', () => {
    const sitemap = createSitemap({
      siteUrl: 'https://docs.example.com/',
      generatedAt: '2026-05-30T00:00:00.000Z',
      entries: [
        { path: '/manual/basic/ai-assistant/overview' }
      ]
    })

    expect(sitemap).toContain('<loc>https://docs.example.com/manual/basic/ai-assistant/overview</loc>')
  })
})

describe('robots sitemap discovery', () => {
  it('moves sitemap discovery to the end without duplicating equivalent entries', () => {
    const robots = appendSitemapsToRobots('User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n', {
      siteUrl: 'https://docs.example.com',
      sitemaps: ['/sitemap.xml', '/ai-search-sitemap.xml']
    })

    expect(robots.match(/Sitemap:/g)).toHaveLength(2)
    expect(robots).toBe('User-agent: *\nAllow: /\n\nSitemap: https://docs.example.com/sitemap.xml\nSitemap: https://docs.example.com/ai-search-sitemap.xml\n')
  })

  it('appends sitemap discovery at the end of existing bot blocks', () => {
    const robots = appendSitemapsToRobots('User-agent: *\nAllow: /\n\nUser-agent: Cloudflare-AI-Search\nAllow: /\n', {
      siteUrl: 'https://docs.example.com',
      sitemaps: ['/sitemap.xml']
    })

    expect(robots).toBe('User-agent: *\nAllow: /\n\nUser-agent: Cloudflare-AI-Search\nAllow: /\n\nSitemap: https://docs.example.com/sitemap.xml\n')
  })

  it('preserves explicitly configured extra sitemaps while moving them to the end', () => {
    const robots = appendSitemapsToRobots('User-agent: *\nAllow: /\nSitemap: /ai-search-sitemap.xml\n\nUser-agent: Cloudflare-AI-Search\nAllow: /\n', {
      siteUrl: 'https://docs.example.com',
      sitemaps: ['/sitemap.xml']
    })

    expect(robots).toBe('User-agent: *\nAllow: /\n\nUser-agent: Cloudflare-AI-Search\nAllow: /\n\nSitemap: https://docs.example.com/sitemap.xml\nSitemap: https://docs.example.com/ai-search-sitemap.xml\n')
  })
})