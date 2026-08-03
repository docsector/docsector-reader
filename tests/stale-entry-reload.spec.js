import { describe, expect, it } from 'vitest'

import { buildStaleEntryReloadScript } from '../src/quasar.factory.js'

const ORIGIN = 'https://docs.example.com'

function createHarness ({
  build = 'live-build',
  deployed = 'live-build',
  online = true,
  fetchFails = false,
  stored = null,
  booted = false,
  storageWriteFails = false,
  pathname = '/guide/getting-started/overview/',
  search = '',
  hash = ''
} = {}) {
  const listeners = []
  const values = new Map()
  if (stored !== null) {
    values.set('docsector.entry.reload', JSON.stringify(stored))
  }

  const sessionStorage = {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => {
      if (storageWriteFails) throw new Error('quota')
      values.set(key, value)
    },
    removeItem: key => values.delete(key)
  }

  const location = {
    origin: ORIGIN,
    pathname,
    search,
    hash,
    replaced: [],
    replace (url) { this.replaced.push(url) }
  }

  const fetchCalls = []
  const fetch = (url, options) => {
    fetchCalls.push({ url, options })
    return fetchFails
      ? Promise.reject(new Error('offline edge'))
      : Promise.resolve({ json: () => Promise.resolve({ build: deployed }) })
  }

  const addEventListener = (type, handler, capture) => listeners.push({ type, handler, capture })

  // ? params shadow the real globals — same sandbox idiom as theme.spec.js
  new Function('addEventListener', 'sessionStorage', 'navigator', 'location', 'fetch', 'window', buildStaleEntryReloadScript(build))(
    addEventListener, sessionStorage, { onLine: online }, location, fetch, { __DOCSECTOR_BOOTED__: booted }
  )

  const fire = async (target) => {
    listeners[0].handler({ target })
    // : the handler resolves version.json in microtasks
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  const staleScript = { tagName: 'SCRIPT', type: 'module', src: `${ORIGIN}/assets/index-OLDHASH.js` }
  const guard = () => JSON.parse(values.get('docsector.entry.reload') || 'null')

  return { listeners, location, fetchCalls, fire, staleScript, guard }
}

describe('stale entry reload script', () => {
  it('registers a capture-phase error listener', () => {
    const harness = createHarness()
    expect(harness.listeners).toHaveLength(1)
    expect(harness.listeners[0]).toMatchObject({ type: 'error', capture: true })
  })

  it('recovers with a cache-busting navigation when a newer deploy is live', async () => {
    const harness = createHarness({ deployed: 'newer-build', search: '?q=1', hash: '#section' })
    await harness.fire(harness.staleScript)

    expect(harness.location.replaced).toHaveLength(1)
    expect(harness.location.replaced[0]).toMatch(/^\/guide\/getting-started\/overview\/\?q=1&docsector-stale=\d+#section$/)
    expect(harness.guard()).toMatchObject({ n: 1 })
  })

  it('also recovers on stylesheet failures under /assets/', async () => {
    const harness = createHarness({ deployed: 'newer-build' })
    await harness.fire({ tagName: 'LINK', rel: 'stylesheet', href: `${ORIGIN}/assets/index-OLD.css` })

    expect(harness.location.replaced).toHaveLength(1)
  })

  it('ignores third-party and non-module failures', async () => {
    const harness = createHarness({ deployed: 'newer-build' })

    await harness.fire({ tagName: 'SCRIPT', type: 'module', src: 'https://cdn.example.org/assets/x.js' })
    await harness.fire({ tagName: 'SCRIPT', type: '', src: `${ORIGIN}/assets/x.js` })
    await harness.fire({ tagName: 'IMG', src: `${ORIGIN}/assets/logo.png` })
    await harness.fire({ tagName: 'SCRIPT', type: 'module', src: `${ORIGIN}/other/x.js` })

    expect(harness.fetchCalls).toHaveLength(0)
    expect(harness.location.replaced).toHaveLength(0)
  })

  it('does nothing while offline', async () => {
    const harness = createHarness({ online: false, deployed: 'newer-build' })
    await harness.fire(harness.staleScript)

    expect(harness.fetchCalls).toHaveLength(0)
    expect(harness.location.replaced).toHaveLength(0)
  })

  it('never reacts after the app booted — post-boot failures belong to setupChunkReload', async () => {
    const harness = createHarness({ deployed: 'newer-build', booted: true })
    await harness.fire(harness.staleScript)

    expect(harness.fetchCalls).toHaveLength(0)
    expect(harness.location.replaced).toHaveLength(0)
  })

  it('never navigates when the deployed build matches — reloading the same build cannot fix the asset', async () => {
    const matching = createHarness()
    await matching.fire(matching.staleScript)

    expect(matching.fetchCalls).toHaveLength(1)
    expect(matching.location.replaced).toHaveLength(0)
  })

  it('makes ONE blind attempt only when version.json is unreachable', async () => {
    const unreachable = createHarness({ fetchFails: true })
    await unreachable.fire(unreachable.staleScript)
    expect(unreachable.location.replaced).toHaveLength(1)

    // ? already attempted once and still unreachable — stop
    const spent = createHarness({ fetchFails: true, stored: { n: 1, at: Date.now() - 500 } })
    await spent.fire(spent.staleScript)
    expect(spent.location.replaced).toHaveLength(0)
  })

  it('allows the second attempt immediately when a newer deploy is confirmed, then dead-ends', async () => {
    // : no artificial time window — fast networks reach the second failure
    //   in well under a second
    const second = createHarness({ deployed: 'newer-build', stored: { n: 1, at: Date.now() - 300 } })
    await second.fire(second.staleScript)
    expect(second.location.replaced).toHaveLength(1)
    expect(second.guard()).toMatchObject({ n: 2 })

    const third = createHarness({ deployed: 'newer-build', stored: { n: 2, at: Date.now() - 300 } })
    await third.fire(third.staleScript)
    expect(third.location.replaced).toHaveLength(0)
  })

  it('navigates at most once per page load, even on failure bursts', async () => {
    const harness = createHarness({ deployed: 'newer-build' })
    await harness.fire(harness.staleScript)
    await harness.fire({ tagName: 'LINK', rel: 'stylesheet', href: `${ORIGIN}/assets/index-OLD.css` })

    expect(harness.location.replaced).toHaveLength(1)
    expect(harness.guard()).toMatchObject({ n: 1 })
  })

  it('refuses to navigate when the attempt cannot be recorded', async () => {
    // ? no record ⇒ no loop bound — a dead page beats an infinite reload
    const harness = createHarness({ deployed: 'newer-build', storageWriteFails: true })
    await harness.fire(harness.staleScript)

    expect(harness.location.replaced).toHaveLength(0)
  })

  it('interpolates the baked build id', () => {
    expect(buildStaleEntryReloadScript('abc123')).toContain('"abc123"')
    expect(buildStaleEntryReloadScript('')).toContain('""')
  })
})
