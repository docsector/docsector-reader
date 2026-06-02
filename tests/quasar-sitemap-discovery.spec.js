import { describe, expect, it } from 'vitest'

import { getAdvertisedRobotsSitemapPaths } from '../src/quasar.factory.js'

describe('robots sitemap discovery policy', () => {
  it('advertises the standard sitemap by default', () => {
    expect(getAdvertisedRobotsSitemapPaths()).toEqual(['/sitemap.xml'])
  })

  it('does not auto-advertise the AI Search sitemap when it is generated', () => {
    expect(getAdvertisedRobotsSitemapPaths({
      sitemapEnabled: true,
      aiSearchSitemapGenerated: true
    })).toEqual(['/sitemap.xml'])
  })

  it('omits sitemap discovery when the standard sitemap is disabled', () => {
    expect(getAdvertisedRobotsSitemapPaths({
      sitemapEnabled: false,
      aiSearchSitemapGenerated: true
    })).toEqual([])
  })
})