/* global globalThis */

import { afterEach, describe, expect, it } from 'vitest'

import layoutStore, {
  createLayoutState,
  LAYOUT_ASSISTANT_STORAGE_KEY,
  loadPersistedAssistantLayout,
  savePersistedAssistantLayout
} from '../src/store/Layout.js'

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

describe('assistant layout persistence', () => {
  it('loads persisted assistant open state from storage', () => {
    const storage = createStorage()
    storage.setItem(LAYOUT_ASSISTANT_STORAGE_KEY, 'true')

    expect(loadPersistedAssistantLayout({ storage })).toBe(true)
    expect(createLayoutState.call({}).assistant).toBe(false)

    globalThis.window = { localStorage: storage }
    expect(createLayoutState().assistant).toBe(true)
  })

  it('persists assistant open state when the layout mutation runs', () => {
    const storage = createStorage()
    globalThis.window = { localStorage: storage }

    const state = createLayoutState()
    layoutStore.mutations.setAssistant(state, true)

    expect(state.assistant).toBe(true)
    expect(storage.getItem(LAYOUT_ASSISTANT_STORAGE_KEY)).toBe('true')

    layoutStore.mutations.setAssistant(state, false)

    expect(state.assistant).toBe(false)
    expect(storage.getItem(LAYOUT_ASSISTANT_STORAGE_KEY)).toBe('false')
  })

  it('saves explicit layout values through the helper', () => {
    const storage = createStorage()

    savePersistedAssistantLayout(true, { storage })
    expect(storage.getItem(LAYOUT_ASSISTANT_STORAGE_KEY)).toBe('true')
  })
})