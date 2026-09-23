/* global globalThis */

import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import {
  FEEDBACK_PATH_MAX_LENGTH,
  FEEDBACK_STORAGE_PREFIX,
  RATINGS,
  buildFeedbackPayload,
  buildFeedbackStorageKey,
  normalizeFeedbackPath,
  readStoredRating,
  resolveFeedbackStorage,
  sendFeedback,
  storeRating
} from '../src/feedback/client.js'

function createStorage (entries = {}) {
  const map = new Map(Object.entries(entries))

  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  }
}

const THROWING_STORAGE = {
  getItem: () => { throw new Error('SecurityError') },
  setItem: () => { throw new Error('QuotaExceededError') },
  removeItem: () => { throw new Error('SecurityError') }
}

describe('feedback ratings', () => {
  it('lists positive, neutral and negative with their sentiment icons, in that order', () => {
    expect(RATINGS.map(rating => rating.value)).toEqual(['positive', 'neutral', 'negative'])
    expect(RATINGS.map(rating => rating.icon)).toEqual(['sentiment_very_satisfied', 'sentiment_neutral', 'sentiment_very_dissatisfied'])
  })

  it('keeps every icon name on a line the icon subset scanner reads', () => {
    // The scanner (collectIconTokens) only reads lines that mention `icon`.
    const lines = readFileSync(new URL('../src/feedback/client.js', import.meta.url), 'utf-8').split('\n')

    for (const { icon } of RATINGS) {
      expect(lines.some(line => /icon/i.test(line) && line.includes(`'${icon}'`))).toBe(true)
    }
  })
})

describe('normalizeFeedbackPath', () => {
  it.each([
    ['/manual/basic/overview/', '/manual/basic/overview'],
    ['/manual/basic/overview/index.html', '/manual/basic/overview'],
    ['/guide/overview?tab=1#install', '/guide/overview'],
    ['/', '/'],
    ['', '/'],
    ['manual/overview', '/manual/overview'],
    ['/guia/instalação', '/guia/instala%C3%A7%C3%A3o'],
    ['/a b', '/a%20b'],
    ["/it's", '/it%27s'],
    ['/<b>{x}|^`\\', '/%3Cb%3E%7Bx%7D%7C%5E%60%5C'],
    ['/v0.x/(draft)/a+b~c', '/v0.x/(draft)/a+b~c'],
    ['/emoji/😀', '/emoji/%F0%9F%98%80'],
    ['/broken/\uD800', '/broken/']
  ])('%j → %j', (input, expected) => {
    expect(normalizeFeedbackPath(input)).toBe(expected)
  })

  it('bounds the path length', () => {
    expect(normalizeFeedbackPath(`/${'a'.repeat(400)}`)).toHaveLength(FEEDBACK_PATH_MAX_LENGTH)
  })
})

describe('feedback payload and storage key', () => {
  it('builds the payload the endpoint validates', () => {
    expect(buildFeedbackPayload({ path: '/guide/overview/', locale: 'pt-BR', version: 'v1.0.0', rating: 'neutral', previous: 'negative' }))
      .toEqual({ path: '/guide/overview', locale: 'pt-BR', version: 'v1.0.0', rating: 'neutral', previous: 'negative' })
    expect(buildFeedbackPayload({ path: '/', previous: 'positive' }))
      .toEqual({ path: '/', locale: '', version: '', rating: null, previous: 'positive' })
  })

  it('keys one vote per version, locale and page', () => {
    const key = buildFeedbackStorageKey({ path: '/guide/overview/', locale: 'en-US', version: 'v1.0.0' })

    expect(key).toBe(`${FEEDBACK_STORAGE_PREFIX}v1.0.0:en-US:/guide/overview`)
    expect(buildFeedbackStorageKey({ path: '/guide/overview', locale: 'pt-BR', version: 'v1.0.0' })).not.toBe(key)
    expect(buildFeedbackStorageKey({ path: '/guide/overview', locale: 'en-US', version: 'v0.x' })).not.toBe(key)
  })
})

describe('stored ratings', () => {
  it('round-trips a rating', () => {
    const storage = createStorage()

    storeRating('k', 'negative', storage)

    expect(storage.map.get('k')).toBe('negative')
    expect(readStoredRating('k', storage)).toBe('negative')
  })

  it('forgets the vote on a null value', () => {
    const storage = createStorage({ k: 'positive' })

    storeRating('k', null, storage)

    expect(storage.map.has('k')).toBe(false)
  })

  it('ignores missing and foreign values', () => {
    expect(readStoredRating('missing', createStorage())).toBeNull()
    expect(readStoredRating('k', createStorage({ k: 'great' }))).toBeNull()
  })

  it('survives a storage that throws or does not exist', () => {
    expect(readStoredRating('k', THROWING_STORAGE)).toBeNull()
    expect(() => storeRating('k', 'positive', THROWING_STORAGE)).not.toThrow()
    expect(() => storeRating('k', null, THROWING_STORAGE)).not.toThrow()
    expect(readStoredRating('k', null)).toBeNull()
    expect(() => storeRating('k', 'positive', null)).not.toThrow()
  })

  it('resolves to null when reading localStorage throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => { throw new Error('SecurityError') }
    })

    try {
      expect(resolveFeedbackStorage()).toBeNull()
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'localStorage', descriptor)
      } else {
        delete globalThis.localStorage
      }
    }
  })
})

describe('sendFeedback', () => {
  const PAYLOAD = { path: '/guide', locale: 'en-US', version: 'v1.0.0', rating: 'positive', previous: null }

  it('POSTs the JSON payload to /feedback with keepalive', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })

    await expect(sendFeedback(PAYLOAD, fetcher)).resolves.toBe(true)
    expect(fetcher).toHaveBeenCalledWith('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PAYLOAD),
      keepalive: true
    })
  })

  it('reports a rejected vote without throwing', async () => {
    await expect(sendFeedback(PAYLOAD, vi.fn().mockResolvedValue({ ok: false, status: 503 }))).resolves.toBe(false)
  })

  it('swallows network errors', async () => {
    await expect(sendFeedback(PAYLOAD, vi.fn().mockRejectedValue(new TypeError('offline')))).resolves.toBe(false)
  })
})
