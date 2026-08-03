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
  it('reloads to the intended route and records the guard', async () => {
    const win = createWindow()
    const storage = createStorage()

    await expect(forceReload('/guide/target', { win, storage })).resolves.toBe(true)
    expect(win.location.assign).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\/target\?docsector-stale=\d+$/))

    const guard = JSON.parse(storage.getItem(CHUNK_RELOAD_STORAGE_KEY))
    expect(guard.path).toBe('/guide/target')
    expect(typeof guard.at).toBe('number')
  })

  it('falls back to the current location when no path is given', async () => {
    const win = createWindow()
    const storage = createStorage()

    await forceReload(null, { win, storage })

    expect(win.location.assign).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\/current\?q=1&docsector-stale=\d+#top$/))
  })

  it('normalizes away a previous cache-bust param — the guard must match and the param must not accumulate', async () => {
    const win = createWindow()
    win.location.search = '?docsector-stale=111'
    const storage = createStorage()

    await forceReload(null, { win, storage })

    // : exactly one fresh param, the stale one dropped
    expect(win.location.assign).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\/current\?docsector-stale=\d+#top$/))
    expect(win.location.assign.mock.calls[0][0]).not.toContain('docsector-stale=111')

    // ? and the loop guard keys on the CLEAN path, so a second pass within the
    //   window falls back to the banner instead of looping
    expect(JSON.parse(storage.getItem(CHUNK_RELOAD_STORAGE_KEY)).path).toBe('/guide/current#top')

    win.location.assign.mockClear()
    await forceReload(null, { win, storage })
    expect(win.location.assign).not.toHaveBeenCalled()
  })

  it('breaks reload loops by falling back to the banner', async () => {
    const win = createWindow()
    const storage = createStorage()
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, JSON.stringify({ path: '/guide/target', at: Date.now() }))

    await expect(forceReload('/guide/target', { win, storage })).resolves.toBe(false)
    expect(win.location.assign).not.toHaveBeenCalled()
    expect(updateAvailable.value).toBe(true)
  })

  it('reloads again once the loop window has passed', async () => {
    const win = createWindow()
    const storage = createStorage()
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, JSON.stringify({
      path: '/guide/target',
      at: Date.now() - RELOAD_LOOP_WINDOW - 1000
    }))

    await expect(forceReload('/guide/target', { win, storage })).resolves.toBe(true)
    expect(win.location.assign).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\/target\?docsector-stale=\d+$/))
  })

  it('reloads a different target even inside the loop window', async () => {
    const win = createWindow()
    const storage = createStorage()
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, JSON.stringify({ path: '/guide/other', at: Date.now() }))

    await expect(forceReload('/guide/target', { win, storage })).resolves.toBe(true)
  })

  it('verifies the deployed build before reloading — same build never navigates', async () => {
    const win = createWindow()
    const storage = createStorage()
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ build: 'abc' }) }))

    await expect(forceReload('/guide/target', { win, storage, build: 'abc', base: '/', fetcher })).resolves.toBe(false)
    expect(win.location.assign).not.toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledWith('/version.json', { cache: 'no-store' })
  })

  it('reloads when the deployed build differs from the running one', async () => {
    const win = createWindow()
    const storage = createStorage()
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ build: 'newer' }) }))

    await expect(forceReload('/guide/target', { win, storage, build: 'abc', base: '/', fetcher })).resolves.toBe(true)
    expect(win.location.assign).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\/target\?docsector-stale=\d+$/))
  })

  it('skips the reload when version.json is unreachable (unverifiable state)', async () => {
    const win = createWindow()
    const storage = createStorage()
    const fetcher = vi.fn(async () => { throw new Error('blocked') })

    await expect(forceReload('/guide/target', { win, storage, build: 'abc', base: '/', fetcher })).resolves.toBe(false)
    expect(win.location.assign).not.toHaveBeenCalled()
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
    expect(win.location.assign).toHaveBeenCalledWith(expect.stringMatching(/^\/manual\/next\?docsector-stale=\d+$/))

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
    expect(win.location.assign).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\/current\?q=1&docsector-stale=\d+#top$/))

    cleanup()
    expect(win.listeners.size).toBe(0)
  })
})
