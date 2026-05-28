import { describe, expect, it } from 'vitest'

import { resolveEmbeddedUrl } from '../src/composables/useEmbeddedUrl.js'

describe('embedded-url providers', () => {
  it('resolves YouTube watch URLs into embed URLs and preserves playback params', () => {
    const resolved = resolveEmbeddedUrl('https://www.youtube.com/watch?v=M7lc1UVf-VE&autoplay=1&loop=1&t=1m2s')

    expect(resolved).toMatchObject({
      mode: 'embed',
      provider: 'youtube',
      kind: 'video',
      embedSrc: 'https://www.youtube.com/embed/M7lc1UVf-VE?autoplay=1&loop=1&start=62&playlist=M7lc1UVf-VE',
      aspectRatio: '16 / 9',
      allowFullscreen: true
    })
  })

  it('resolves Vimeo URLs into player URLs', () => {
    const resolved = resolveEmbeddedUrl('https://vimeo.com/76979871?autoplay=1')

    expect(resolved).toMatchObject({
      mode: 'embed',
      provider: 'vimeo',
      embedSrc: 'https://player.vimeo.com/video/76979871?autoplay=1'
    })
  })

  it('resolves Spotify URLs into embed URLs with provider-specific height', () => {
    const resolved = resolveEmbeddedUrl('https://open.spotify.com/track/7ouMYWpwJ422jRcDASZB7P?si=1234')

    expect(resolved).toMatchObject({
      mode: 'embed',
      provider: 'spotify',
      kind: 'audio',
      embedSrc: 'https://open.spotify.com/embed/track/7ouMYWpwJ422jRcDASZB7P?si=1234',
      frameHeight: 152
    })
  })

  it('resolves CodePen pen URLs into embed URLs', () => {
    const resolved = resolveEmbeddedUrl('https://codepen.io/team/codepen/pen/PNaGbb?default-tab=result')

    expect(resolved).toMatchObject({
      mode: 'embed',
      provider: 'codepen',
      kind: 'code',
      embedSrc: 'https://codepen.io/team/codepen/embed/PNaGbb?default-tab=result'
    })
  })

  it('falls back to a safe link card for unsupported providers', () => {
    const resolved = resolveEmbeddedUrl('https://example.com/docs/embed-me', {
      title: 'API docs'
    })

    expect(resolved).toMatchObject({
      mode: 'link',
      provider: 'link',
      title: 'API docs',
      canonicalUrl: 'https://example.com/docs/embed-me',
      providerLabel: 'example.com'
    })
  })
})