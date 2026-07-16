import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CHUNK_RELOAD_STORAGE_KEY,
  RELOAD_LOOP_WINDOW,
  forceReload,
  isChunkLoadError,
  resetUpdateCheck,
  setupChunkReload,
  updateAvailable
} from '../src/composables/useUpdateCheck.js'

const createStorage = () => {
  const values = new Map()

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  }
}

const createWindow = () => {
  const listeners = new Map()

  return {
    location: {
      pathname: '/guide/current',
      search: '?q=1',
      hash: '#top',
      assign: vi.fn()
    },
    addEventListener (name, handler) {
      listeners.set(name, handler)
    },
    removeEventListener (name, handler) {
      if (listeners.get(name) === handler) {
        listeners.delete(name)
      }
    },
    listeners
  }
}

afterEach(() => {
  resetUpdateCheck()
})

describe('chunk load error detection', () => {
  it('matches the errors a stale bundle produces', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/a.css'))).toBe(true)
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isChunkLoadError(new Error('boom'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})

describe('forced reload', () => {
  it('reloads to the intended route and records the guard', () => {
    const win = createWindow()
    const storage = createStorage()

    expect(forceReload('/guide/target', { win, storage })).toBe(true)
    expect(win.location.assign).toHaveBeenCalledWith('/guide/target')

    const guard = JSON.parse(storage.getItem(CHUNK_RELOAD_STORAGE_KEY))
    expect(guard.path).toBe('/guide/target')
    expect(typeof guard.at).toBe('number')
  })

  it('falls back to the current location when no path is given', () => {
    const win = createWindow()
    const storage = createStorage()

    forceReload(null, { win, storage })

    expect(win.location.assign).toHaveBeenCalledWith('/guide/current?q=1#top')
  })

  it('breaks reload loops by falling back to the banner', () => {
    const win = createWindow()
    const storage = createStorage()
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, JSON.stringify({ path: '/guide/target', at: Date.now() }))

    expect(forceReload('/guide/target', { win, storage })).toBe(false)
    expect(win.location.assign).not.toHaveBeenCalled()
    expect(updateAvailable.value).toBe(true)
  })

  it('reloads again once the loop window has passed', () => {
    const win = createWindow()
    const storage = createStorage()
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, JSON.stringify({
      path: '/guide/target',
      at: Date.now() - RELOAD_LOOP_WINDOW - 1000
    }))

    expect(forceReload('/guide/target', { win, storage })).toBe(true)
    expect(win.location.assign).toHaveBeenCalledWith('/guide/target')
  })

  it('reloads a different target even inside the loop window', () => {
    const win = createWindow()
    const storage = createStorage()
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, JSON.stringify({ path: '/guide/other', at: Date.now() }))

    expect(forceReload('/guide/target', { win, storage })).toBe(true)
  })
})

describe('chunk reload wiring', () => {
  it('reloads on failed lazy route imports via router.onError', () => {
    const win = createWindow()
    const storage = createStorage()

    let handler = null
    const remove = vi.fn()
    const router = {
      onError (fn) {
        handler = fn
        return remove
      }
    }

    const cleanup = setupChunkReload({ router, win, storage })

    handler(new TypeError('Failed to fetch dynamically imported module: /assets/a.js'), { fullPath: '/manual/next' })
    expect(win.location.assign).toHaveBeenCalledWith('/manual/next')

    win.location.assign.mockClear()
    handler(new Error('boom'), { fullPath: '/manual/next' })
    expect(win.location.assign).not.toHaveBeenCalled()

    cleanup()
    expect(remove).toHaveBeenCalled()
  })

  it('reloads the current route on vite:preloadError and cleans up', () => {
    const win = createWindow()
    const storage = createStorage()

    const cleanup = setupChunkReload({ win, storage })

    const event = { preventDefault: vi.fn() }
    win.listeners.get('vite:preloadError')(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(win.location.assign).toHaveBeenCalledWith('/guide/current?q=1#top')

    cleanup()
    expect(win.listeners.size).toBe(0)
  })
})
