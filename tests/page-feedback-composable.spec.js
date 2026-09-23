import { createRenderer, createSSRApp, defineComponent, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'

import { usePageFeedback } from '../src/composables/usePageFeedback.js'
import { buildFeedbackStorageKey } from '../src/feedback/client.js'

// ! Minimal object-tree renderer — mounts components in Node so onMounted and
//   watchers run for real, without a DOM
const { createApp } = createRenderer({
  insert: (child, parent, anchor) => {
    child.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index >= 0) {
      parent.children.splice(index, 0, child)
    } else {
      parent.children.push(child)
    }
  },
  remove: (child) => {
    const siblings = child.parent?.children
    if (siblings) siblings.splice(siblings.indexOf(child), 1)
  },
  createElement: (tag) => ({ tag, children: [], props: {} }),
  createText: (text) => ({ text }),
  createComment: (text) => ({ comment: text }),
  setText: (node, text) => { node.text = text },
  setElementText: (element, text) => { element.children = [{ text }] },
  parentNode: (node) => node.parent || null,
  nextSibling: (node) => {
    const siblings = node.parent?.children
    return siblings ? (siblings[siblings.indexOf(node) + 1] || null) : null
  },
  patchProp: (element, key, _, next) => { element.props[key] = next }
})

const PAGE_A = Object.freeze({ path: '/guide/a', locale: 'en-US', version: 'v1.0.0' })
const PAGE_B = Object.freeze({ path: '/guide/b', locale: 'en-US', version: 'v1.0.0' })
const KEY_A = buildFeedbackStorageKey(PAGE_A)
const KEY_B = buildFeedbackStorageKey(PAGE_B)

function createStorage (entries = {}) {
  const map = new Map(Object.entries(entries))

  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  }
}

// : a fetch double answering `ok` and recording each payload
function createFetcher (ok = true) {
  const payloads = []
  const fetcher = vi.fn(async (_, init) => {
    payloads.push(JSON.parse(init.body))
    return { ok }
  })

  return { fetcher, payloads }
}

function mountFeedback (target, options) {
  let state
  const Probe = defineComponent({
    setup () {
      state = usePageFeedback(target, options)
      return () => null
    }
  })
  const app = createApp(Probe)
  app.mount({ tag: 'root', children: [], props: {} })

  return { state, app }
}

describe('usePageFeedback — restoring', () => {
  it('restores the recorded vote once mounted', () => {
    const { state } = mountFeedback(ref(PAGE_A), { storage: createStorage({ [KEY_A]: 'negative' }) })

    expect(state.rating.value).toBe('negative')
  })

  it('never reads storage while prerendering', async () => {
    const storage = createStorage({ [KEY_A]: 'negative' })
    const getItem = vi.spyOn(storage, 'getItem')
    const app = createSSRApp(defineComponent({
      setup () {
        const { rating } = usePageFeedback(ref(PAGE_A), { storage })
        return () => `rating:${rating.value}`
      }
    }))

    expect(await renderToString(app)).toBe('rating:null')
    expect(getItem).not.toHaveBeenCalled()
  })

  it('re-reads the vote when the target changes (client-side navigation, locale)', async () => {
    const target = ref(PAGE_A)
    const { state } = mountFeedback(target, { storage: createStorage({ [KEY_A]: 'negative', [KEY_B]: 'positive' }) })

    target.value = PAGE_B
    await nextTick()
    expect(state.rating.value).toBe('positive')

    target.value = { ...PAGE_B, path: '/guide/c' }
    await nextTick()
    expect(state.rating.value).toBeNull()
  })
})

describe('usePageFeedback — voting', () => {
  it('records a first vote and persists it once accepted', async () => {
    const storage = createStorage()
    const { fetcher, payloads } = createFetcher()
    const { state } = mountFeedback(ref(PAGE_A), { storage, fetcher })

    await expect(state.vote('positive')).resolves.toBe(true)

    expect(state.rating.value).toBe('positive')
    expect(payloads).toEqual([{ ...PAGE_A, rating: 'positive', previous: null }])
    expect(storage.map.get(KEY_A)).toBe('positive')
  })

  it('switches a recorded vote, naming it as previous', async () => {
    const storage = createStorage({ [KEY_A]: 'negative' })
    const { fetcher, payloads } = createFetcher()
    const { state } = mountFeedback(ref(PAGE_A), { storage, fetcher })

    await state.vote('positive')

    expect(payloads).toEqual([{ ...PAGE_A, rating: 'positive', previous: 'negative' }])
    expect(storage.map.get(KEY_A)).toBe('positive')
  })

  it('cancels the shown vote when it is picked again', async () => {
    const storage = createStorage({ [KEY_A]: 'neutral' })
    const { fetcher, payloads } = createFetcher()
    const { state } = mountFeedback(ref(PAGE_A), { storage, fetcher })

    await state.vote('neutral')

    expect(state.rating.value).toBeNull()
    expect(payloads).toEqual([{ ...PAGE_A, rating: null, previous: 'neutral' }])
    expect(storage.map.has(KEY_A)).toBe(false)
  })

  it('keeps storage on the recorded vote when a send fails', async () => {
    const storage = createStorage({ [KEY_A]: 'negative' })
    const { fetcher, payloads } = createFetcher(false)
    const { state } = mountFeedback(ref(PAGE_A), { storage, fetcher })

    await expect(state.vote('positive')).resolves.toBe(false)

    // ? the reader still sees their pick; the next request cancels the vote
    //   the endpoint really holds
    expect(state.rating.value).toBe('positive')
    expect(storage.map.get(KEY_A)).toBe('negative')

    await state.vote('neutral')
    expect(payloads.at(-1)).toEqual({ ...PAGE_A, rating: 'neutral', previous: 'negative' })
  })

  it('sends nothing when the endpoint already holds the pick', async () => {
    const { fetcher } = createFetcher(false)
    const { state } = mountFeedback(ref(PAGE_A), { storage: createStorage(), fetcher })

    await state.vote('positive') // fails: never recorded
    await expect(state.vote('positive')).resolves.toBe(true) // cancel what was never counted

    expect(state.rating.value).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('ignores clicks while a send is in flight', async () => {
    let release
    const fetcher = vi.fn(() => new Promise(resolve => { release = () => resolve({ ok: true }) }))
    const { state } = mountFeedback(ref(PAGE_A), { storage: createStorage(), fetcher })

    const first = state.vote('positive')
    await expect(state.vote('negative')).resolves.toBe(false)
    release()
    await first

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(state.rating.value).toBe('positive')
  })

  it('persists under the page the vote was cast on, even after navigating away', async () => {
    let release
    const storage = createStorage()
    const fetcher = vi.fn(() => new Promise(resolve => { release = () => resolve({ ok: true }) }))
    const target = ref(PAGE_A)
    const { state } = mountFeedback(target, { storage, fetcher })

    const pending = state.vote('positive')
    target.value = PAGE_B
    await nextTick()
    release()
    await pending

    expect(storage.map.get(KEY_A)).toBe('positive')
    expect(storage.map.has(KEY_B)).toBe(false)
    expect(state.rating.value).toBeNull()
  })
})
