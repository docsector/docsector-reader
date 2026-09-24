import { afterEach, describe, expect, it, vi } from 'vitest'

import { move } from '../src/composables/menu-keys.js'

// : three fake menu rows inside a list, one of them focused
const setup = (focused = null) => {
  const items = [0, 1, 2].map(index => ({ index, focus: vi.fn() }))
  vi.stubGlobal('document', { activeElement: focused === null ? null : items[focused] })
  const list = { querySelectorAll: vi.fn(selector => (selector === '[role="menuitem"]' ? items : [])) }
  const press = (key) => {
    const event = { key, currentTarget: list, preventDefault: vi.fn() }
    move(event)
    return event
  }
  return { items, press }
}

const focusedIndex = (items) => items.findIndex(item => item.focus.mock.calls.length > 0)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('menu keys', () => {
  it('moves down and up, wrapping at both ends', () => {
    let menu = setup(0)
    menu.press('ArrowDown')
    expect(focusedIndex(menu.items)).toBe(1)

    menu = setup(2)
    menu.press('ArrowDown')
    expect(focusedIndex(menu.items)).toBe(0)

    menu = setup(0)
    menu.press('ArrowUp')
    expect(focusedIndex(menu.items)).toBe(2)
  })

  it('jumps to the first and the last row', () => {
    let menu = setup(1)
    menu.press('Home')
    expect(focusedIndex(menu.items)).toBe(0)

    menu = setup(1)
    menu.press('End')
    expect(focusedIndex(menu.items)).toBe(2)
  })

  it('enters the list from outside a row', () => {
    let menu = setup()
    menu.press('ArrowDown')
    expect(focusedIndex(menu.items)).toBe(0)

    menu = setup()
    menu.press('ArrowUp')
    expect(focusedIndex(menu.items)).toBe(2)
  })

  it('prevents the page from scrolling, and leaves every other key alone', () => {
    const menu = setup(0)

    expect(menu.press('ArrowDown').preventDefault).toHaveBeenCalledTimes(1)
    for (const key of ['Tab', 'Enter', 'Escape', 'a']) {
      const event = menu.press(key)
      expect(event.preventDefault, key).not.toHaveBeenCalled()
    }
    expect(menu.items[0].focus).not.toHaveBeenCalled()
    expect(menu.items[1].focus).toHaveBeenCalledTimes(1)
  })

  it('does nothing without rows', () => {
    vi.stubGlobal('document', { activeElement: null })
    const event = { key: 'ArrowDown', currentTarget: { querySelectorAll: () => [] }, preventDefault: vi.fn() }

    expect(() => move(event)).not.toThrow()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
