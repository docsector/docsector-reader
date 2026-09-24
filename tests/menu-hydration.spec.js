import { readFileSync } from 'node:fs'

import { babelParse, parse, walk } from 'vue/compiler-sfc'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MENU_WAIT_MS, createMenuHydration } from '../src/composables/menu-hydration.js'

const INTERACTIONS = ['pointerenter', 'touchstart', 'focusin', 'click']
const TO = { path: '/guide/getting-started/overview/' }
const FROM = { path: '/manual/basic/overview/' }

// : a router stand-in that records its beforeEach guards
const createRouter = () => {
  const guards = new Set()
  return {
    guards,
    beforeEach (guard) {
      guards.add(guard)
      return () => guards.delete(guard)
    }
  }
}

// : a hydration controller for server markup, with a loader resolved by hand
const setup = ({ hydrating = true, fail = false } = {}) => {
  const router = createRouter()
  const element = new EventTarget()
  const hydrate = vi.fn()
  let finish = null
  const loaded = new Promise((resolve, reject) => {
    finish = () => (fail ? reject(new Error('chunk failed')) : resolve({ default: {} }))
  })
  const menu = createMenuHydration(router, { interactions: INTERACTIONS, loader: () => loaded, hydrating })
  const [guard] = router.guards
  // : what Vue does for a lazily hydrated async component — load, then install
  const load = async () => {
    const request = menu.loader()
    finish()
    try {
      await request
    } catch {
      return null
    }
    return menu.strategy(hydrate, (callback) => callback(element))
  }
  return { router, element, hydrate, menu, guard, load }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('createMenuHydration', () => {
  it('registers its navigation guard up front, with no next() parameter', () => {
    const { router, guard } = setup()

    expect(router.guards.size).toBe(1)
    expect(guard.length).toBeLessThan(3)
  })

  it('hydrates inside the guard of the first navigation, while the route still matches the markup', async () => {
    const { router, hydrate, guard, load } = setup()
    await load()

    await guard(TO, FROM)

    expect(hydrate).toHaveBeenCalledTimes(1)
    expect(router.guards.size).toBe(0)
  })

  it('holds a navigation that starts before the chunk arrives until the menu has hydrated', async () => {
    const { hydrate, guard, load } = setup()
    let passed = false

    const navigation = guard(TO, FROM).then(() => { passed = true })
    await Promise.resolve()
    expect(passed).toBe(false)
    expect(hydrate).not.toHaveBeenCalled()

    await load()
    await navigation

    expect(hydrate).toHaveBeenCalledTimes(1)
    expect(passed).toBe(true)
  })

  it('lets the navigation go on at once, without hydrating, when the chunk fails', async () => {
    vi.useFakeTimers()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { router, hydrate, guard, load } = setup({ fail: true })
    let passed = false

    const navigation = guard(TO, FROM).then(() => { passed = true })
    await load()
    await vi.advanceTimersByTimeAsync(0)

    expect(passed).toBe(true)
    expect(hydrate).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(router.guards.size).toBe(0)
    await navigation
  })

  it('stops waiting for a stalled chunk after MENU_WAIT_MS and falls back to interactions', async () => {
    vi.useFakeTimers()
    const { router, element, hydrate, menu, guard } = setup()
    menu.loader()

    const navigation = guard(TO, FROM)
    await vi.advanceTimersByTimeAsync(MENU_WAIT_MS)
    await navigation

    expect(hydrate).not.toHaveBeenCalled()
    expect(router.guards.size).toBe(0)

    menu.strategy(hydrate, (callback) => callback(element))
    element.dispatchEvent(new Event('focusin'))
    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('leaves the menu asleep on same-path navigations (hash, query)', async () => {
    const { router, hydrate, guard, load } = setup()
    await load()

    await guard({ path: FROM.path, hash: '#install' }, FROM)

    expect(hydrate).not.toHaveBeenCalled()
    expect(router.guards.size).toBe(1)
  })

  it('hydrates on the first interaction and drops the navigation guard', async () => {
    const { router, element, hydrate, load } = setup()
    await load()

    element.dispatchEvent(new Event('pointerenter'))

    expect(hydrate).toHaveBeenCalledTimes(1)
    expect(router.guards.size).toBe(0)
  })

  it('hydrates once when two navigations race — each snapshots the guard before it is removed', async () => {
    const { hydrate, guard, load } = setup()
    await load()

    await Promise.all([guard(TO, FROM), guard({ path: '/guide/cache/overview/' }, FROM)])

    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('stops listening to interactions as soon as a navigation hydrated it', async () => {
    const { element, hydrate, guard, load } = setup()
    await load()
    const remove = vi.spyOn(element, 'removeEventListener')

    await guard(TO, FROM)
    expect(remove.mock.calls.map(([type]) => type).sort()).toEqual([...INTERACTIONS].sort())

    for (const type of INTERACTIONS) element.dispatchEvent(new Event(type))
    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('keeps the navigation going when hydrating throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { hydrate, guard, load } = setup()
    hydrate.mockImplementation(() => { throw new Error('render failed') })
    await load()

    await expect(guard(TO, FROM)).resolves.toBeUndefined()
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('drops the guard once the layout has mounted when no menu is hydrating (no sidebar)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { router, menu } = setup()

    menu.settle()

    expect(router.guards.size).toBe(0)
    expect(error).not.toHaveBeenCalled()
  })

  it('keeps the guard when the layout mounts while the menu chunk is loading', () => {
    const { router, menu } = setup()
    menu.loader()

    menu.settle()

    expect(router.guards.size).toBe(1)
  })

  it('registers nothing outside server hydration (SPA loads, later layouts)', () => {
    const { router } = setup({ hydrating: false })

    expect(router.guards.size).toBe(0)
  })

  it('leaves no guard or listener behind when the menu unmounts before hydrating', async () => {
    const { router, element, hydrate, load } = setup()
    const teardown = await load()

    teardown()
    element.dispatchEvent(new Event('click'))

    expect(router.guards.size).toBe(0)
    expect(hydrate).not.toHaveBeenCalled()
  })

  it('drops the guard when the layout unmounts before the menu loaded', () => {
    const { router, menu } = setup()
    menu.loader()

    menu.dispose()

    expect(router.guards.size).toBe(0)
  })
})

describe('DefaultLayout wires the sidebar menu to it', () => {
  const source = parse(readFileSync(new URL('../src/layouts/DefaultLayout.vue', import.meta.url), 'utf-8')).descriptor.scriptSetup.content
  const compact = (value) => value.replace(/\s+/g, '')

  // : compacted initializer of every const in the layout script
  const declarations = {}
  const calls = []
  walk(babelParse(source, { sourceType: 'module' }), {
    enter (node) {
      if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.init) {
        declarations[node.id.name] = { start: node.start, init: compact(source.slice(node.init.start, node.init.end)) }
      }
      if (node.type === 'CallExpression' && node.callee?.type === 'Identifier') {
        calls.push(compact(source.slice(node.start, node.end)))
      }
    }
  })

  it('creates the controller with the layout router, the menu loader and the hydration signal', () => {
    const menu = declarations.menuHydration?.init

    expect(menu, 'missing menuHydration').toBeDefined()
    expect(menu).toContain('createMenuHydration(router,')
    expect(menu).toContain("interactions:['pointerenter','touchstart','focusin','click']")
    expect(menu).toContain("loader:()=>import('../components/DMenu.vue')")
    expect(menu).toContain("hydrating:typeofwindow!=='undefined'&&window.__DOCSECTOR_HYDRATING__===true&&document.getElementById('menu')!==null")
    expect(declarations.router.start).toBeLessThan(declarations.menuHydration.start)
  })

  it('hands its loader and strategy to DMenu, and settles and disposes with the layout', () => {
    expect(declarations.DMenu?.init).toBe('defineAsyncComponent({loader:menuHydration.loader,hydrate:menuHydration.strategy})')
    expect(calls).toContain('onMounted(menuHydration.settle)')
    expect(calls).toContain('onBeforeUnmount(menuHydration.dispose)')
  })
})
