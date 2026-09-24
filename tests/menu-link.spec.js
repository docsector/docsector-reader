import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { RouterLink, createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import { check, cross, resolve } from '../src/components/menu-link.js'

const Empty = defineComponent({ render: () => null })

// ! Records shaped like src/router/routes.js: a book page, a standalone page
//   (unregistered book, hidden, showcase on), home aliased to '/' and the
//   catch-all 404 — the only record without meta.book
const pageRecord = (path, book, subpages = ['overview'], meta = {}) => ({
  path,
  component: Empty,
  meta: { book, ...meta },
  children: [
    { path: '', redirect: to => `${to.path.replace(/\/$/, '')}/overview/` },
    ...subpages.map(subpage => ({ path: subpage, component: Empty }))
  ]
})

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    pageRecord('/guide/getting-started', 'guide'),
    pageRecord('/sponsors', 'sponsors', ['overview', 'showcase'], { menu: { hidden: true } }),
    { path: '/home', alias: '/', component: Empty, meta: { book: 'home' }, children: [{ path: '', component: Empty }] },
    { path: '/:catchAll(.*)*', component: Empty, meta: { menu: {} }, children: [{ path: '', component: Empty }] }
  ]
})

describe('MenuLink.resolve', () => {
  it('opens a page of this site in place', () => {
    const router = createTestRouter()

    expect(resolve('/sponsors/', router)).toEqual({ to: '/sponsors/' })
    expect(resolve('/sponsors', router)).toEqual({ to: '/sponsors' })
    expect(resolve('/sponsors/overview/', router)).toEqual({ to: '/sponsors/overview/' })
    expect(resolve('/sponsors/overview/#faq', router)).toEqual({ to: '/sponsors/overview/#faq' })
    expect(resolve('/guide/getting-started/overview/', router)).toEqual({ to: '/guide/getting-started/overview/' })
    expect(resolve('/', router)).toEqual({ to: '/' })
  })

  it('trims the configured value', () => {
    expect(resolve('  /sponsors/  ', createTestRouter())).toEqual({ to: '/sponsors/' })
    expect(resolve('  https://example.com/x  ', createTestRouter())).toEqual({ href: 'https://example.com/x', target: '_blank' })
  })

  it('keeps site paths that are not pages external (static files, unknown paths)', () => {
    const router = createTestRouter()

    expect(resolve('/sponsor.html', router)).toEqual({ href: '/sponsor.html', target: '_blank' })
    expect(resolve('/sponsors/x', router)).toEqual({ href: '/sponsors/x', target: '_blank' })
    expect(resolve('/guide/getting-started/showcase/', router)).toEqual({ href: '/guide/getting-started/showcase/', target: '_blank' })
  })

  it('keeps URLs and anything else external without asking the router', () => {
    const router = createTestRouter()
    const spy = vi.spyOn(router, 'resolve')

    for (const url of ['https://github.com/sponsors/example', 'http://example.com', '//cdn.example/x', '/\\evil.example', '/\\/evil.example', 'mailto:a@b.c', 'sponsor', '/a b']) {
      expect(resolve(url, router)).toEqual({ href: url, target: '_blank' })
    }

    expect(spy).not.toHaveBeenCalled()
  })

  it('renders nothing for blank or non-string values', () => {
    const router = createTestRouter()

    for (const value of [null, undefined, '', '   ', 7, {}, ['/sponsors/']]) {
      expect(resolve(value, router)).toBeNull()
    }
  })

  it('never throws — a failing or missing router means external', () => {
    const broken = { resolve: () => { throw new Error('boom') } }

    expect(resolve('/sponsors/', broken)).toEqual({ href: '/sponsors/', target: '_blank' })
    expect(resolve('/sponsors/', undefined)).toEqual({ href: '/sponsors/', target: '_blank' })
  })

  it('warns once when a subpage-like path matches no page', () => {
    const router = createTestRouter()
    const onWarning = vi.fn()

    expect(resolve('/sponsor/overview/', router, { onWarning })).toEqual({ href: '/sponsor/overview/', target: '_blank' })
    expect(onWarning).toHaveBeenCalledTimes(1)
    expect(onWarning.mock.calls[0][0]).toBe('/sponsor/overview/ is not a page of this site — it opens in a new tab')

    for (const path of ['/sponsor/showcase/', '/sponsor/vs', '/sponsor/overview/?x=1#faq', '/guide/getting-started/showcase/']) {
      onWarning.mockClear()
      expect(resolve(path, router, { onWarning })).toEqual({ href: path, target: '_blank' })
      expect(onWarning, path).toHaveBeenCalledTimes(1)
    }

    onWarning.mockClear()
    resolve('/sponsor.html', router, { onWarning })
    resolve('https://example.com/overview/', router, { onWarning })
    resolve('/sponsors/overview/', router, { onWarning })
    expect(onWarning).not.toHaveBeenCalled()

    expect(() => resolve('/sponsor/vs', router)).not.toThrow()
  })
})

describe('an in-place top link is highlighted while its page is open', () => {
  // : the RouterLink class list for `to` rendered at `path` — Quasar's
  //   use-router-link mirrors vue-router's active rule for q-item `to`
  const render = async (to, path) => {
    const router = createTestRouter()
    await router.push(path)
    await router.isReady()

    const app = createSSRApp(defineComponent({ render: () => h(RouterLink, { to }, () => 'link') }))
    app.use(router)

    return renderToString(app)
  }

  it('keeps a bare page path active on every subpage', async () => {
    expect(await render('/sponsors/', '/sponsors/overview/')).toContain('router-link-active')
    expect(await render('/sponsors/', '/sponsors/showcase/')).toContain('router-link-active')
  })

  it('keeps a subpage path active on that subpage only', async () => {
    expect(await render('/sponsors/overview/', '/sponsors/overview/')).toContain('router-link-active')
    expect(await render('/sponsors/overview/', '/sponsors/showcase/')).not.toContain('router-link-active')
  })

  it('stays inactive on other pages', async () => {
    expect(await render('/sponsors/', '/guide/getting-started/overview/')).not.toContain('router-link-active')
  })
})

describe('MenuLink.cross', () => {
  it('names the other book a shortcut lands in', () => {
    const router = createTestRouter()

    expect(cross({ book: 'manual', link: { to: '/guide/getting-started/overview/' } }, router)).toBe('guide')
    expect(cross({ book: 'manual', link: { to: '  /guide/getting-started/  ' } }, router)).toBe('guide')
    expect(cross({ book: 'manual', link: { to: 'guide/getting-started/overview/' } }, router)).toBe('guide')
    expect(cross({ type: 'manual', link: { to: '/sponsors/' } }, router)).toBe('sponsors')
    expect(cross({ book: 'manual', link: { to: '/' } }, router)).toBe('home')
  })

  it('gives nothing for a shortcut within the same book', () => {
    expect(cross({ book: 'guide', link: { to: '/guide/getting-started/overview/' } }, createTestRouter())).toBeNull()
  })

  it('gives nothing without a shortcut or for a target that is not a page', () => {
    const router = createTestRouter()

    for (const meta of [undefined, null, {}, { book: 'manual' }, { book: 'manual', link: {} }, { book: 'manual', link: { to: '' } }, { book: 'manual', link: { to: 7 } }]) {
      expect(cross(meta, router)).toBeNull()
    }
    expect(cross({ book: 'manual', link: { to: '/nowhere/overview/' } }, router)).toBeNull()
    expect(cross({ book: 'manual', link: { to: '//cdn.example/x' } }, router)).toBeNull()
    expect(cross({ book: 'manual', link: { to: 'https://example.com/guide/' } }, router)).toBeNull()
  })

  it('never throws — a failing or missing router means no arrow', () => {
    const meta = { book: 'manual', link: { to: '/guide/getting-started/overview/' } }

    expect(cross(meta, { resolve: () => { throw new Error('boom') } })).toBeNull()
    expect(cross(meta, undefined)).toBeNull()
  })
})

// ! A wider router for the active rule: a page with vs, a shortcut page
//   (both children redirect elsewhere, like routes.js link.to entries) and a
//   page of an archived version
const shortcutRecord = (path, to) => ({
  path,
  component: Empty,
  meta: { book: 'manual', link: { to } },
  children: [
    { path: '', redirect: () => to },
    { path: 'overview', redirect: () => to }
  ]
})

const createActiveRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    pageRecord('/guide/getting-started', 'guide'),
    pageRecord('/sponsors', 'sponsors', ['overview', 'showcase'], { menu: { hidden: true } }),
    pageRecord('/manual/x', 'manual', ['overview', 'vs']),
    shortcutRecord('/manual/short', '/guide/getting-started/overview/'),
    pageRecord('/v0.x/guide/old', 'guide'),
    { path: '/home', alias: '/', component: Empty, meta: { book: 'home' }, children: [{ path: '', component: Empty }] },
    { path: '/:catchAll(.*)*', component: Empty, meta: { menu: {} }, children: [{ path: '', component: Empty }] }
  ]
})

describe('MenuLink.check', () => {
  const at = async (path) => {
    const router = createActiveRouter()
    await router.push(path)
    await router.isReady()
    return router
  }

  it('keeps a bare page path active on every subpage, and a subpage path on its own', async () => {
    const router = await at('/sponsors/showcase/')
    const route = router.currentRoute.value

    expect(check('/sponsors/', route, router)).toBe(true)
    expect(check('/sponsors', route, router)).toBe(true)
    expect(check('/sponsors/showcase/', route, router)).toBe(true)
    expect(check('/sponsors/overview/', route, router)).toBe(false)
    expect(check('/guide/getting-started/', route, router)).toBe(false)
  })

  it('treats home and its alias as one page', async () => {
    const home = await at('/home')
    const root = await at('/')

    expect(check('/', home.currentRoute.value, home)).toBe(true)
    expect(check('/home', root.currentRoute.value, root)).toBe(true)
    expect(check('/sponsors/', root.currentRoute.value, root)).toBe(false)
  })

  it('never activates a target that is not a page, and never throws', async () => {
    const router = await at('/nowhere')
    const route = router.currentRoute.value

    expect(check('/nowhere', route, router)).toBe(false)
    expect(check('/sponsor.html', route, router)).toBe(false)
    for (const to of [undefined, null, '', 7]) {
      expect(check(to, route, router)).toBe(false)
    }
    expect(check('/sponsors/', route, { resolve: () => { throw new Error('boom') } })).toBe(false)
    expect(check('/sponsors/', route, undefined)).toBe(false)
    expect(check('/sponsors/', undefined, router)).toBe(false)
    expect(check('/sponsors/', { matched: 'nope' }, router)).toBe(false)
  })

  it('never activates an empty target, which would resolve to the current page', async () => {
    const router = await at('/sponsors/showcase/')

    expect(check('', router.currentRoute.value, router)).toBe(false)
  })

  it('needs a parent record for the bare-path rule', () => {
    const lone = { path: '/sponsors', meta: { book: 'sponsors' } }
    const stub = { resolve: () => ({ matched: [lone] }) }

    expect(check('/sponsors', { matched: [] }, stub)).toBe(false)
    expect(check('/sponsors', { matched: [lone] }, stub)).toBe(true)
  })

  it('agrees with RouterLink for every in-place target on every page', async () => {
    const targets = [
      '/sponsors/', '/sponsors', '/sponsors/overview/', '/sponsors/showcase/', '/sponsors/overview/#faq', '/sponsors/?tab=1',
      '/guide/getting-started/', '/guide/getting-started/overview/', '/manual/x/', '/manual/x/vs/', '/manual/short/',
      '/v0.x/guide/old/', '/', '/home'
    ]
    const pages = [
      '/sponsors/overview/', '/sponsors/showcase/', '/guide/getting-started/overview/', '/manual/x/overview/', '/manual/x/vs/',
      '/manual/short/', '/v0.x/guide/old/overview/', '/', '/home', '/nowhere'
    ]
    const mismatches = []

    for (const page of pages) {
      const router = await at(page)
      const route = router.currentRoute.value

      for (const to of targets) {
        expect(resolve(to, router), to).toEqual({ to })

        const app = createSSRApp(defineComponent({ render: () => h(RouterLink, { to }, () => 'link') }))
        app.use(router)
        const expected = (await renderToString(app)).includes('router-link-active')

        if (check(to, route, router) !== expected) {
          mismatches.push(`${to} on ${page}: RouterLink ${expected}`)
        }
      }
    }

    expect(mismatches).toEqual([])
  })
})
