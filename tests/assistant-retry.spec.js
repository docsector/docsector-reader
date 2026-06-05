import { afterEach, describe, expect, it, vi } from 'vitest'

import { ASSISTANT_SESSION_STORAGE_KEY } from '../src/ai-assistant/session.js'

function createStorage () {
  const values = new Map()

  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  }
}

function createWindow (storage) {
  return {
    localStorage: storage,
    setTimeout: (callback) => {
      callback()
      return 1
    },
    clearTimeout: () => {}
  }
}

function createJsonResponse (payload) {
  return {
    ok: true,
    status: 200,
    body: null,
    headers: { get: () => 'application/json' },
    json: vi.fn().mockResolvedValue(payload)
  }
}

async function loadAssistant (session) {
  const storage = createStorage()
  storage.setItem(ASSISTANT_SESSION_STORAGE_KEY, JSON.stringify(session))
  vi.stubGlobal('window', createWindow(storage))
  vi.resetModules()

  const { default: useAssistant } = await import('../src/composables/useAssistant.js')

  return { storage, useAssistant }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('assistant retry', () => {
  it('keeps the selected user message and replaces later history', async () => {
    const requests = []
    const fetchMock = vi.fn(async (_url, options) => {
      requests.push(JSON.parse(options.body))
      return createJsonResponse({ content: 'Fresh answer' })
    })

    vi.stubGlobal('fetch', fetchMock)

    const { storage, useAssistant } = await loadAssistant({
      messages: [
        { id: 'user-1', role: 'user', content: 'First question' },
        { id: 'assistant-1', role: 'assistant', content: 'First answer' },
        { id: 'user-2', role: 'user', content: 'Second question' },
        { id: 'assistant-2', role: 'assistant', content: 'Second answer' }
      ],
      sources: [{ id: 'source-1', key: '/old', title: 'Old source' }]
    })

    const assistant = useAssistant({
      route: { path: '/guide', hash: '' },
      locale: 'en-US',
      getContext: () => ({ title: 'Guide' })
    })

    await assistant.retryFromUserMessage('user-1')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(requests[0].messages).toEqual([
      { role: 'user', content: 'First question' }
    ])
    expect(assistant.sources.value).toEqual([])
    expect(assistant.messages.value.map(({ role, content }) => ({ role, content }))).toEqual([
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'Fresh answer' }
    ])

    const persisted = JSON.parse(storage.getItem(ASSISTANT_SESSION_STORAGE_KEY))
    expect(persisted.messages.map(({ role, content }) => ({ role, content }))).toEqual([
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'Fresh answer' }
    ])
  })

  it('does not retry assistant messages', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { useAssistant } = await loadAssistant({
      messages: [
        { id: 'user-1', role: 'user', content: 'First question' },
        { id: 'assistant-1', role: 'assistant', content: 'First answer' }
      ]
    })

    const assistant = useAssistant()

    await assistant.retryFromUserMessage('assistant-1')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(assistant.messages.value.map(message => message.id)).toEqual(['user-1', 'assistant-1'])
  })
})
