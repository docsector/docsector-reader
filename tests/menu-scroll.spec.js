import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { scroll } = vi.hoisted(() => ({
  scroll: {
    getScrollTarget: vi.fn(() => 'target'),
    setVerticalScrollPosition: vi.fn()
  }
}))

vi.mock('quasar', () => ({ scroll }))

const { scrollMenuToActive } = await import('../src/composables/menu-scroll.js')

// : a fake highlighted menu element
const element = (offsetTop, { visible = true } = {}) => ({
  offsetTop,
  offsetParent: visible ? {} : null,
  closest: () => null
})

describe('scrollMenuToActive', () => {
  let actives = []

  beforeEach(() => {
    scroll.getScrollTarget.mockClear()
    scroll.setVerticalScrollPosition.mockClear()
    vi.stubGlobal('window', { innerHeight: 800 })
    vi.stubGlobal('document', {
      getElementById: (id) => id === 'menu' ? { getElementsByClassName: () => actives } : null
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('centres the last highlighted item — the page-tree item after a top link to the same page', () => {
    const topLink = element(60)
    const treeItem = element(900)
    actives = [topLink, treeItem]

    scrollMenuToActive(0)

    expect(scroll.getScrollTarget).toHaveBeenCalledWith(treeItem)
    expect(scroll.setVerticalScrollPosition).toHaveBeenCalledWith('target', 900 - 400 + 50, 0)
  })

  it('does not scroll when the drawer is hidden or nothing is highlighted', () => {
    actives = [element(900, { visible: false })]
    scrollMenuToActive(0)

    actives = []
    scrollMenuToActive(0)

    expect(scroll.setVerticalScrollPosition).not.toHaveBeenCalled()
  })
})
