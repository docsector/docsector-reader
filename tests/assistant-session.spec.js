import { describe, expect, it } from 'vitest'

import {
  ASSISTANT_SESSION_STORAGE_KEY,
  clearAssistantSession,
  loadAssistantSession,
  normalizeAssistantSession,
  saveAssistantSession
} from '../src/ai-assistant/session.js'

function createStorage () {
  const values = new Map()

  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  }
}

describe('assistant session persistence', () => {
  it('normalizes persisted messages and sources', () => {
    expect(normalizeAssistantSession({
      messages: [
        { id: 'user-1', role: 'user', content: 'Question' },
        { id: 'assistant-1', role: 'assistant', content: 'Answer' },
        { id: 'empty', role: 'assistant', content: '   ' },
        { id: 'bad', role: 'system', content: 'Hidden' }
      ],
      sources: [
        { id: 'source-1', key: '/guide', title: 'Guide', meta: 'docsector.com/guide', score: '0.8' },
        { id: 'empty-source', key: '', text: '' }
      ]
    })).toEqual({
      messages: [
        { id: 'user-1', role: 'user', content: 'Question' },
        { id: 'assistant-1', role: 'assistant', content: 'Answer' }
      ],
      sources: [
        { id: 'source-1', key: '/guide', title: 'Guide', meta: 'docsector.com/guide', text: '', score: 0.8 }
      ]
    })
  })

  it('saves, loads, and clears local storage sessions', () => {
    const storage = createStorage()

    saveAssistantSession({
      messages: [{ id: 'user-1', role: 'user', content: 'Question' }],
      sources: [{ id: 'source-1', key: '/guide', title: 'Guide' }]
    }, { storage })

    expect(JSON.parse(storage.getItem(ASSISTANT_SESSION_STORAGE_KEY))).toMatchObject({
      messages: [{ id: 'user-1', role: 'user', content: 'Question' }],
      sources: [{ id: 'source-1', key: '/guide', title: 'Guide' }]
    })

    expect(loadAssistantSession({ storage })).toMatchObject({
      messages: [{ id: 'user-1', role: 'user', content: 'Question' }],
      sources: [{ id: 'source-1', key: '/guide', title: 'Guide' }]
    })

    clearAssistantSession({ storage })

    expect(storage.getItem(ASSISTANT_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('returns an empty session for corrupted data', () => {
    const storage = createStorage()
    storage.setItem(ASSISTANT_SESSION_STORAGE_KEY, '{not-json')

    expect(loadAssistantSession({ storage })).toEqual({ messages: [], sources: [] })
  })
})