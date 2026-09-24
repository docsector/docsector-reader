import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { RouterLink, createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import { resolve } from '../src/components/menu-link.js'

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
