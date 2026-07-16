import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_POLL_INTERVAL,
  FOCUS_CHECK_THROTTLE,
  MIN_POLL_INTERVAL,
  STARTUP_CHECK_DELAY,
  UPDATE_DISMISSED_STORAGE_KEY,
  dismissUpdate,
  normalizeUpdatesConfig,
  resetUpdateCheck,
  setupUpdateCheck,
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

const createDocument = (visibilityState = 'visible') => {
  const listeners = new Map()

  return {
    visibilityState,
    addEventListener (name, handler) {
      listeners.set(name, handler)
    },
    removeEventListener (name, handler) {
      if (listeners.get(name) === handler) {
        listeners.delete(name)
      }
    },
    dispatch (name) {
      listeners.get(name)?.()
    },
    listeners
  }
}

const jsonResponse = (payload, ok = true) => ({
  ok,
  json: async () => payload
})

const setup = (overrides = {}) => {
  const storage = overrides.storage || createStorage()
  const doc = overrides.doc || createDocument()
  const fetcher = overrides.fetcher || vi.fn(async () => jsonResponse({ build: 'build-a' }))

  const cleanup = setupUpdateCheck({
    config: {},
    build: 'build-a',
    dev: false,
    base: '/',
    win: {},
    doc,
    fetcher,
    storage,
    ...overrides
  })

  return { cleanup, storage, doc, fetcher }
}

describe('updates config normalization', () => {
  it('defaults to enabled with the standard poll interval', () => {
    expect(normalizeUpdatesConfig({})).toEqual({
      enabled: true,
      interval: DEFAULT_POLL_INTERVAL
    })
    expect(normalizeUpdatesConfig({ updates: true }).enabled).toBe(true)
  })

  it('supports the `updates: false` shorthand and `enabled: false`', () => {
    expect(normalizeUpdatesConfig({ updates: false }).enabled).toBe(false)
    expect(normalizeUpdatesConfig({ updates: { enabled: false } }).enabled).toBe(false)
  })

  it('clamps the interval to the minimum floor', () => {
    expect(normalizeUpdatesConfig({ updates: { interval: 1000 } }).interval).toBe(MIN_POLL_INTERVAL)
    expect(normalizeUpdatesConfig({ updates: { interval: 60000 } }).interval).toBe(60000)
    expect(normalizeUpdatesConfig({ updates: { interval: 'soon' } }).interval).toBe(DEFAULT_POLL_INTERVAL)
  })
})

describe('update polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetUpdateCheck()
  })

  afterEach(() => {
    vi.useRealTimers()
    resetUpdateCheck()
  })

  it('prompts when the deployed build differs from the running one', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ build: 'build-b' }))
    const { cleanup } = setup({ fetcher })

    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY)

    expect(fetcher).toHaveBeenCalledWith('/version.json', { cache: 'no-store' })
    expect(updateAvailable.value).toBe(true)

    cleanup()
  })

  it('stays silent when the deployed build matches', async () => {
    const { cleanup } = setup()

    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY)

    expect(updateAvailable.value).toBe(false)

    cleanup()
  })

  it('stays silent on fetch failures and non-OK responses', async () => {
    const rejecting = setup({ fetcher: vi.fn(async () => { throw new Error('offline') }) })
    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY)
    expect(updateAvailable.value).toBe(false)
    rejecting.cleanup()

    const notFound = setup({ fetcher: vi.fn(async () => jsonResponse({ build: 'build-b' }, false)) })
    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY)
    expect(updateAvailable.value).toBe(false)
    notFound.cleanup()
  })

  it('does not re-prompt a dismissed deploy, but prompts a newer one', async () => {
    const storage = createStorage()
    storage.setItem(UPDATE_DISMISSED_STORAGE_KEY, 'build-b')

    const fetcher = vi.fn(async () => jsonResponse({ build: 'build-b' }))
    const { cleanup } = setup({ storage, fetcher })

    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY)
    expect(updateAvailable.value).toBe(false)

    fetcher.mockImplementation(async () => jsonResponse({ build: 'build-c' }))
    await vi.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
    expect(updateAvailable.value).toBe(true)

    cleanup()
  })

  it('remembers the dismissed deploy for the session', async () => {
    const storage = createStorage()
    const fetcher = vi.fn(async () => jsonResponse({ build: 'build-b' }))
    const { cleanup } = setup({ storage, fetcher })

    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY)
    expect(updateAvailable.value).toBe(true)

    dismissUpdate({ storage, win: {} })
    expect(updateAvailable.value).toBe(false)
    expect(storage.getItem(UPDATE_DISMISSED_STORAGE_KEY)).toBe('build-b')

    await vi.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
    expect(updateAvailable.value).toBe(false)

    cleanup()
  })

  it('polls on the interval only while the tab is visible', async () => {
    const doc = createDocument('hidden')
    const fetcher = vi.fn(async () => jsonResponse({ build: 'build-a' }))
    const { cleanup } = setup({ doc, fetcher })

    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY + DEFAULT_POLL_INTERVAL * 2)
    const hiddenCalls = fetcher.mock.calls.length

    doc.visibilityState = 'visible'
    await vi.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
    expect(fetcher.mock.calls.length).toBeGreaterThan(hiddenCalls)

    cleanup()
  })

  it('checks on tab re-focus, throttled', async () => {
    const doc = createDocument()
    const fetcher = vi.fn(async () => jsonResponse({ build: 'build-a' }))
    const { cleanup } = setup({ doc, fetcher })

    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY)
    const initialCalls = fetcher.mock.calls.length

    // ? within the throttle window — no extra check
    doc.dispatch('visibilitychange')
    expect(fetcher.mock.calls.length).toBe(initialCalls)

    await vi.advanceTimersByTimeAsync(FOCUS_CHECK_THROTTLE)
    doc.dispatch('visibilitychange')
    expect(fetcher.mock.calls.length).toBe(initialCalls + 1)

    cleanup()
  })

  it('stops timers and listeners on cleanup', async () => {
    const doc = createDocument()
    const fetcher = vi.fn(async () => jsonResponse({ build: 'build-a' }))
    const { cleanup } = setup({ doc, fetcher })

    cleanup()

    await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY + DEFAULT_POLL_INTERVAL * 2)
    expect(fetcher).not.toHaveBeenCalled()
    expect(doc.listeners.size).toBe(0)
  })

  it('is a no-op when disabled, in dev mode or without a baked build', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ build: 'build-b' }))

    for (const overrides of [
      { config: { updates: false } },
      { dev: true },
      { build: null }
    ]) {
      const { cleanup } = setup({ fetcher, ...overrides })
      await vi.advanceTimersByTimeAsync(STARTUP_CHECK_DELAY + DEFAULT_POLL_INTERVAL)
      cleanup()
    }

    expect(fetcher).not.toHaveBeenCalled()
    expect(updateAvailable.value).toBe(false)
  })
})
