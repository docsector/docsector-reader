/* global globalThis */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildFeedbackPayload } from '../src/feedback/client.js'

let onRequestPost

beforeAll(async () => {
  // `server.js` is a Worker template: `__FEEDBACK_CONFIG__` is a bare
  // identifier the build substitutes — defining it as a global is what makes
  // the template importable, in the shape `buildFeedbackServerConfig` bakes.
  globalThis.__FEEDBACK_CONFIG__ = {
    binding: 'FEEDBACK',
    languages: ['en-US', 'pt-BR'],
    versions: ['v4.25.0', '__current__', '2024 Edition']
  };

  ({ onRequestPost } = await import('../src/feedback/server.js'))
})

afterAll(() => {
  delete globalThis.__FEEDBACK_CONFIG__
})

let warn

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

const VOTE = Object.freeze({
  path: '/manual/basic/d-page-meta/overview',
  locale: 'en-US',
  version: 'v4.25.0',
  rating: 'positive',
  previous: null
})

function createEnv () {
  const points = []

  return {
    points,
    FEEDBACK: {
      writeDataPoint: (point) => points.push(point)
    }
  }
}

function createRequest (body = VOTE, headers = {}) {
  return new Request('https://docs.example.com/feedback', {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json', ...headers }),
    body: typeof body === 'string' ? body : JSON.stringify(body)
  })
}

async function post (request, env = createEnv()) {
  const response = await onRequestPost({ env, request })

  return { response, points: env.points }
}

const point = (rating, action, score, count, vote = VOTE) => ({
  indexes: [vote.path],
  blobs: [vote.path, vote.locale, vote.version, rating, action],
  doubles: [score, count]
})

describe('feedback endpoint — recording', () => {
  it('records a first vote as one data point', async () => {
    const { response, points } = await post(createRequest())

    expect(response.status).toBe(204)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(points).toEqual([point('positive', 'vote', 1, 1)])
  })

  it('scores neutral as 0 and negative as -1', async () => {
    const neutral = await post(createRequest({ ...VOTE, rating: 'neutral' }))
    const negative = await post(createRequest({ ...VOTE, rating: 'negative' }))

    expect(neutral.points).toEqual([point('neutral', 'vote', 0, 1)])
    expect(negative.points).toEqual([point('negative', 'vote', -1, 1)])
  })

  it('treats a missing previous as a first vote', async () => {
    const { path, locale, version, rating } = VOTE
    const { response, points } = await post(createRequest({ path, locale, version, rating }))

    expect(response.status).toBe(204)
    expect(points).toEqual([point('positive', 'vote', 1, 1)])
  })

  it('cancels a vote with a compensating point', async () => {
    const { response, points } = await post(createRequest({ ...VOTE, rating: null, previous: 'negative' }))

    expect(response.status).toBe(204)
    expect(points).toEqual([point('negative', 'undo', 1, -1)])
  })

  it('cancels a neutral vote at score 0, never -0', async () => {
    const { points } = await post(createRequest({ ...VOTE, rating: null, previous: 'neutral' }))

    expect(Object.is(points[0].doubles[0], 0)).toBe(true)
  })

  it('switches a vote: cancels the previous one, then records the new one', async () => {
    const { response, points } = await post(createRequest({ ...VOTE, rating: 'positive', previous: 'negative' }))

    expect(response.status).toBe(204)
    expect(points).toEqual([point('negative', 'undo', 1, -1), point('positive', 'vote', 1, 1)])
  })

  it('nets every sequence of switches to the last vote', async () => {
    const env = createEnv()
    const steps = [['negative', null], ['neutral', 'negative'], ['positive', 'neutral'], [null, 'positive'], ['negative', null]]

    for (const [rating, previous] of steps) {
      await post(createRequest({ ...VOTE, rating, previous }), env)
    }

    const count = env.points.reduce((sum, { doubles }) => sum + doubles[1], 0)
    const score = env.points.reduce((sum, { doubles }) => sum + doubles[0], 0)
    expect(count).toBe(1)
    expect(score).toBe(-1)
  })

  it('accepts every baked version id, free-text labels included', async () => {
    for (const version of ['v4.25.0', '__current__', '2024 Edition']) {
      const { response } = await post(createRequest({ ...VOTE, version }))
      expect(response.status).toBe(204)
    }
  })

  it('caps the index at 96 bytes but keeps the full path in the blob', async () => {
    const path = `/${'a'.repeat(200)}`
    const { points } = await post(createRequest({ ...VOTE, path }))

    expect(points[0].indexes[0]).toHaveLength(96)
    expect(points[0].blobs[0]).toBe(path)
  })

  it('accepts a path of exactly 256 characters', async () => {
    const { response } = await post(createRequest({ ...VOTE, path: `/${'a'.repeat(255)}` }))

    expect(response.status).toBe(204)
  })
})

describe('feedback endpoint — origin and transport', () => {
  it('accepts same-origin browser votes', async () => {
    const byHost = await post(createRequest(VOTE, { Origin: 'https://docs.example.com' }))
    const byFetchMetadata = await post(createRequest(VOTE, { Origin: 'https://docs.example.com', 'Sec-Fetch-Site': 'same-origin' }))

    expect(byHost.response.status).toBe(204)
    expect(byFetchMetadata.response.status).toBe(204)
  })

  it('trusts Sec-Fetch-Site behind a proxy that serves the site under another host', async () => {
    const { response } = await post(createRequest(VOTE, { Origin: 'https://docs.proxy.example', 'Sec-Fetch-Site': 'same-origin' }))

    expect(response.status).toBe(204)
  })

  it('rejects cross-site, same-site and opaque-origin browser votes', async () => {
    const results = await Promise.all([
      post(createRequest(VOTE, { Origin: 'https://evil.example' })),
      post(createRequest(VOTE, { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' })),
      post(createRequest(VOTE, { Origin: 'https://docs.example.com', 'Sec-Fetch-Site': 'same-site' })),
      post(createRequest(VOTE, { Origin: 'null' }))
    ])

    expect(results.map(({ response }) => response.status)).toEqual([403, 403, 403, 403])
    expect(results.flatMap(({ points }) => points)).toEqual([])
  })

  it('checks the MIME essence, not a substring', async () => {
    const smuggled = await post(createRequest(VOTE, { 'Content-Type': 'text/plain; x=application/json' }))
    const plain = await post(createRequest(VOTE, { 'Content-Type': 'text/plain' }))
    const charset = await post(createRequest(VOTE, { 'Content-Type': 'Application/JSON; charset=utf-8' }))

    expect(smuggled.response.status).toBe(415)
    expect(plain.response.status).toBe(415)
    expect(charset.response.status).toBe(204)
  })

  it('accepts a 1024-byte body and rejects one byte more, declared or streamed', async () => {
    const sized = (bytes) => {
      const base = JSON.stringify({ ...VOTE, pad: '' })
      return JSON.stringify({ ...VOTE, pad: 'x'.repeat(bytes - base.length) })
    }

    const exact = await post(createRequest(sized(1024)))
    const streamed = await post(createRequest(sized(1025)))
    const declaredAtCap = await post(createRequest(sized(1024), { 'Content-Length': '1024' }))
    const declaredOver = await post(createRequest(VOTE, { 'Content-Length': '1025' }))

    expect(exact.response.status).toBe(204)
    expect(streamed.response.status).toBe(413)
    expect(declaredAtCap.response.status).toBe(204)
    expect(declaredOver.response.status).toBe(413)
  })

  it('rejects malformed JSON', async () => {
    const { response } = await post(createRequest('{"rating":'))

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('bad_request')
  })
})

describe('feedback endpoint — validation', () => {
  it.each([
    ['rating', 'an unknown rating', { ...VOTE, rating: 'great' }],
    ['rating', 'an inherited property as rating', { ...VOTE, rating: 'toString' }],
    ['previous', 'an unknown previous', { ...VOTE, previous: 'great' }],
    ['rating', 'nothing to record', { ...VOTE, rating: null, previous: null }],
    ['rating', 'the same vote twice', { ...VOTE, rating: 'neutral', previous: 'neutral' }],
    ['path', 'a relative path', { ...VOTE, path: 'manual/overview' }],
    ['path', 'a path carrying a query', { ...VOTE, path: '/manual?x=1' }],
    ['path', 'a path carrying a hash', { ...VOTE, path: '/manual#install' }],
    ['path', 'a path with whitespace', { ...VOTE, path: '/manual page' }],
    ['path', 'a path with markup', { ...VOTE, path: '/<svg/onload=alert(1)>' }],
    ['path', 'a path with a quote', { ...VOTE, path: "/it's" }],
    ['path', 'a path over 256 characters', { ...VOTE, path: `/${'a'.repeat(256)}` }],
    ['locale', 'an unconfigured locale', { ...VOTE, locale: 'fr-FR' }],
    ['version', 'a version the build did not bake', { ...VOTE, version: 'v9.9.9' }],
    ['version', 'an empty version', { ...VOTE, version: '' }],
    ['path', 'a non-string field', { ...VOTE, path: ['/manual'] }],
    ['body', 'an array body', [VOTE]]
  ])('rejects %s: %s', async (field, _, body) => {
    const { response, points } = await post(createRequest(body))

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('invalid_vote')
    expect(points).toEqual([])
    expect(warn).toHaveBeenCalledWith(`[docsector] Feedback vote rejected: invalid ${field}`)
  })

  it('never echoes reader-supplied values into the log', async () => {
    await post(createRequest({ ...VOTE, path: '/<script>secret</script>' }))

    expect(warn.mock.calls.flat().join(' ')).not.toContain('secret')
  })
})

describe('feedback endpoint — storage failures', () => {
  it('answers 503 and logs when the binding is missing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const response = await onRequestPost({ env: {}, request: createRequest() })

      expect(response.status).toBe(503)
      expect((await response.json()).error.code).toBe('feedback_not_configured')
      expect(error).toHaveBeenCalledWith(expect.stringContaining('FEEDBACK'))
    } finally {
      error.mockRestore()
    }
  })

  it('answers 500 when the write throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const env = { FEEDBACK: { writeDataPoint: () => { throw new Error('quota') } } }

    try {
      const response = await onRequestPost({ env, request: createRequest() })

      expect(response.status).toBe(500)
      expect(error).toHaveBeenCalledWith(expect.stringContaining('quota'))
    } finally {
      error.mockRestore()
    }
  })
})

describe('client ↔ endpoint agreement', () => {
  it.each([
    '/',
    '/manual/basic/overview/',
    '/manual/basic/overview/index.html',
    '/guide/overview?tab=1#install',
    '/guia/instalação',
    '/emoji/😀',
    '/broken/\uD800',
    "/it's/<b>{x}|^`\\",
    '/v0.x/manual/overview',
    `/${'ç'.repeat(200)}`
  ])('the endpoint accepts what the client builds from %j', async (routePath) => {
    const payload = buildFeedbackPayload({ path: routePath, locale: 'pt-BR', version: '__current__', rating: 'neutral', previous: null })
    const { response } = await post(createRequest(payload))

    expect(response.status).toBe(204)
  })
})
