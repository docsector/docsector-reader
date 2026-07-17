/* global globalThis */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PAGE_MARKDOWN = '# Guide\n\nThe guide body that only ships when the reader asks for it.'

let onRequestPost

beforeAll(async () => {
  // `server.js` is a Worker template: `__AI_ASSISTANT_CONFIG__` is a bare
  // identifier the build substitutes. Defining it as a global is what makes the
  // template importable — the same shape `quasar.factory.js` inlines.
  globalThis.__AI_ASSISTANT_CONFIG__ = {
    enabled: true,
    provider: 'aiSearch',
    endpoint: '/assistant',
    aiSearch: {
      binding: 'AI_SEARCH',
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      retrievalType: 'hybrid',
      maxResults: 6,
      matchThreshold: 0.4,
      contextExpansion: 1,
      stream: false
    }
  };

  ({ onRequestPost } = await import('../src/ai-assistant/server.js'))
})

afterAll(() => {
  delete globalThis.__AI_ASSISTANT_CONFIG__
})

function createEnv () {
  const assetRequests = []

  return {
    assetRequests,
    captured: {},
    ASSETS: {
      fetch: (request) => {
        assetRequests.push(request.url)
        return Promise.resolve(new Response(PAGE_MARKDOWN, {
          status: 200,
          headers: { 'Content-Type': 'text/markdown' }
        }))
      }
    },
    AI_SEARCH: {
      chatCompletions: function (payload) {
        this.captured = payload
        return Promise.resolve({ response: 'answer' })
      }
    }
  }
}

async function ask (context = {}, { route = { path: '/guide/', hash: '' } } = {}) {
  const env = createEnv()
  let captured = null

  env.AI_SEARCH.chatCompletions = (payload) => {
    captured = payload
    return Promise.resolve({ response: 'answer' })
  }

  const request = new Request('https://docs.example.com/assistant', {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Explain routing' }],
      locale: 'en-US',
      route,
      context
    })
  })

  const response = await onRequestPost({ env, request })

  return {
    response,
    systemPrompt: captured?.messages?.[0]?.content || '',
    assetRequests: env.assetRequests
  }
}

const BEGIN = '--- BEGIN CURRENT PAGE MARKDOWN ---'

describe('assistant endpoint page context', () => {
  it('attaches the page markdown when the reader opts in', async () => {
    const { systemPrompt, assetRequests } = await ask({
      title: 'Guide',
      markdownUrl: 'https://docs.example.com/guide.md',
      includePageMarkdown: true
    })

    expect(systemPrompt).toContain(BEGIN)
    expect(systemPrompt).toContain('The guide body that only ships when the reader asks for it.')
    expect(assetRequests).toHaveLength(1)
  })

  it('skips the asset fetch entirely when the toggle is off', async () => {
    const { systemPrompt, assetRequests } = await ask({
      title: 'Guide',
      markdownUrl: 'https://docs.example.com/guide.md',
      includePageMarkdown: false
    })

    // Guards against a vacuous pass: an empty prompt would satisfy not.toContain.
    expect(systemPrompt).toContain('You are Docsector Assistant')
    expect(systemPrompt).not.toContain(BEGIN)
    // The saving is the subrequest, not just the tokens.
    expect(assetRequests).toEqual([])
  })

  it('keeps the page title and selected text when the toggle is off', async () => {
    const { systemPrompt } = await ask({
      title: 'Guide',
      markdownUrl: 'https://docs.example.com/guide.md',
      selectedText: 'a highlighted sentence',
      includePageMarkdown: false
    })

    expect(systemPrompt).toContain('Current page: Guide (/guide/).')
    expect(systemPrompt).toContain('Selected text from the page:\na highlighted sentence')
    expect(systemPrompt).not.toContain(BEGIN)
  })

  it('cannot re-derive the page from the route when the toggle is off', async () => {
    // buildCurrentPageMarkdownCandidates() falls back to route.path, so dropping
    // markdownUrl alone would never have disabled anything.
    const { systemPrompt, assetRequests } = await ask({ includePageMarkdown: false })

    expect(systemPrompt).not.toContain(BEGIN)
    expect(assetRequests).toEqual([])
  })

  it('attaches the page when the flag is absent, for pre-4.17 cached bundles', async () => {
    const { systemPrompt, assetRequests } = await ask({
      title: 'Guide',
      markdownUrl: 'https://docs.example.com/guide.md'
    })

    expect(systemPrompt).toContain(BEGIN)
    expect(assetRequests).toHaveLength(1)
  })

  it('treats a non-boolean flag as opted in', async () => {
    const { systemPrompt } = await ask({
      markdownUrl: 'https://docs.example.com/guide.md',
      includePageMarkdown: 'false'
    })

    // Only an explicit `false` opts out; the client always sends a real boolean.
    expect(systemPrompt).toContain(BEGIN)
  })
})

describe('assistant endpoint context normalization', () => {
  it('caps untrusted context fields before they reach the system prompt', async () => {
    const { systemPrompt } = await ask({
      title: 'T'.repeat(500),
      selectedText: 'S'.repeat(4000),
      includePageMarkdown: false
    }, { route: { path: `/${'p'.repeat(600)}`, hash: '' } })

    expect(systemPrompt).not.toContain('T'.repeat(201))
    expect(systemPrompt).not.toContain('S'.repeat(1201))
    expect(systemPrompt).not.toContain('p'.repeat(301))
  })
})
