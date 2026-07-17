/* global globalThis */

import { afterEach, describe, expect, it } from 'vitest'

import {
  ASSISTANT_PAGE_CONTEXT_STORAGE_KEY,
  loadPersistedPageContext,
  savePersistedPageContext
} from '../src/ai-assistant/page-context.js'

function createStorage () {
  const values = new Map()

  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  }
}

const originalWindow = globalThis.window

afterEach(() => {
  if (typeof originalWindow === 'undefined') {
    delete globalThis.window
    return
  }

  globalThis.window = originalWindow
})

describe('assistant page context persistence', () => {
  it('pins the storage key', () => {
    // Renaming this silently resets the toggle for every reader who set it.
    expect(ASSISTANT_PAGE_CONTEXT_STORAGE_KEY).toBe('docsector.assistant.context.v1')
  })

  it('defaults to off when nothing is stored', () => {
    expect(loadPersistedPageContext({ storage: createStorage() })).toBe(false)
  })

  it('defaults to off without a window or storage', () => {
    delete globalThis.window
    expect(loadPersistedPageContext()).toBe(false)

    globalThis.window = {}
    expect(loadPersistedPageContext()).toBe(false)
  })

  it('reads the toggle back from storage', () => {
    const storage = createStorage()
    storage.setItem(ASSISTANT_PAGE_CONTEXT_STORAGE_KEY, 'true')

    expect(loadPersistedPageContext({ storage })).toBe(true)

    globalThis.window = { localStorage: storage }
    expect(loadPersistedPageContext()).toBe(true)
  })

  it('treats every value other than the literal "true" as off', () => {
    const storage = createStorage()

    for (const value of ['false', '1', 'yes', 'TRUE', '']) {
      storage.setItem(ASSISTANT_PAGE_CONTEXT_STORAGE_KEY, value)
      expect(loadPersistedPageContext({ storage })).toBe(false)
    }
  })

  it('persists the toggle as a boolean string', () => {
    const storage = createStorage()

    savePersistedPageContext(true, { storage })
    expect(storage.getItem(ASSISTANT_PAGE_CONTEXT_STORAGE_KEY)).toBe('true')

    savePersistedPageContext(false, { storage })
    expect(storage.getItem(ASSISTANT_PAGE_CONTEXT_STORAGE_KEY)).toBe('false')
  })

  it('survives storage that throws', () => {
    const storage = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('quota') }
    }

    expect(loadPersistedPageContext({ storage })).toBe(false)
    expect(() => savePersistedPageContext(true, { storage })).not.toThrow()
  })
})
