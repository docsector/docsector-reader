import { describe, expect, it } from 'vitest'

import { SITE_PATH, resolveAssetUrl } from '../src/asset-url.js'

describe('resolveAssetUrl', () => {
  it('returns an empty string for nothing', () => {
    expect(resolveAssetUrl('')).toBe('')
    expect(resolveAssetUrl('   ')).toBe('')
    expect(resolveAssetUrl(null)).toBe('')
    expect(resolveAssetUrl(undefined)).toBe('')
  })

  it('passes absolute, protocol-relative, data and blob URLs through', () => {
    for (const url of ['https://cdn.example/a.svg', 'http://cdn.example/a.svg', '//cdn.example/a.svg', 'data:image/png;base64,AAA', 'blob:https://x/1']) {
      expect(resolveAssetUrl(url, '/docs/')).toBe(url)
    }
  })

  it('serves root-relative and relative paths from the base', () => {
    expect(resolveAssetUrl('/images/a.svg', '/docs/')).toBe('/docs/images/a.svg')
    expect(resolveAssetUrl('./a.svg', '/docs/')).toBe('/docs/a.svg')
    expect(resolveAssetUrl('a.svg', '/docs/')).toBe('/docs/a.svg')
    expect(resolveAssetUrl('a//b.svg', '/docs/')).toBe('/docs/a/b.svg')
    expect(resolveAssetUrl('.//a.svg', '/docs/')).toBe('/docs/a.svg')
    expect(resolveAssetUrl('.//images/a.png', '/')).toBe('/images/a.png')
    expect(resolveAssetUrl('.//images/a.png', 'https://cdn.example/docs/')).toBe('https://cdn.example/docs/images/a.png')
    expect(resolveAssetUrl('/images/a.svg', '/')).toBe('/images/a.svg')
    expect(resolveAssetUrl('a.svg', '/')).toBe('/a.svg')
  })

  it('keeps the // of an absolute base for relative paths', () => {
    expect(resolveAssetUrl('a.svg', 'https://cdn.example/docs/')).toBe('https://cdn.example/docs/a.svg')
    expect(resolveAssetUrl('/a.svg', 'https://cdn.example/docs/')).toBe('https://cdn.example/docs/a.svg')
  })

  it('defaults to the Vite base', () => {
    expect(resolveAssetUrl('/images/a.svg')).toBe('/images/a.svg')
  })
})

describe('SITE_PATH', () => {
  it('matches paths of this site only', () => {
    for (const value of ['/', '/a', '/sponsors/', '/sponsors/overview/#faq', '/sponsor.html']) {
      expect(SITE_PATH.test(value), value).toBe(true)
    }

    for (const value of ['', 'a', '//a', '//cdn.example/x', 'https://a', 'mailto:a@b.c', '/a b', ' /a', '/\\a', '/\\/a', '/a\\b']) {
      expect(SITE_PATH.test(value), value).toBe(false)
    }
  })
})
