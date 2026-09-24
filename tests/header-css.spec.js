import { readFileSync } from 'node:fs'

import { compileString } from 'sass'
import { parse } from 'vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

// ! The header's layout rules live only in DefaultLayout's style block: pin
//   the compiled CSS they must produce (the headless checks measure it too)
const { descriptor } = parse(readFileSync(new URL('../src/layouts/DefaultLayout.vue', import.meta.url), 'utf-8'))
const css = compileString(descriptor.styles[0].content, { syntax: 'indented', style: 'compressed' }).css

// : the body of the @container rule for a slot at least `width` px wide
const containerRule = (width) => {
  const start = css.indexOf(`@container d-header-slot (min-width: ${width}px){`)
  expect(start, `missing @container rule for ${width}px`).toBeGreaterThan(-1)
  const end = css.indexOf('}}', start)
  return css.slice(start, end + 2)
}

describe('header links CSS', () => {
  it('makes the title slot a size container only when there are links', () => {
    expect(css).toContain('.d-header .d-header__brand-slot--links{container:d-header-slot/inline-size}')
  })

  it('hides the centered nav by default, so the brand arrow opens the links', () => {
    // : the stylesheet without its @container rules
    const outside = css.replace(/@container[^{]*\{(?:[^{}]*\{[^}]*\})*\}/g, '')

    expect(css).toContain('.d-header .d-header__nav{display:none;')
    expect(outside).not.toMatch(/\.d-header__nav\{display:flex/)
    expect(outside).not.toMatch(/q-btn-dropdown__arrow-container\{display:none/)
    expect(css).not.toMatch(/@media[^{]*\{[^}]*d-header__nav/)
  })

  it('shows the nav, hides the arrow and centers with a grid from each fit width', () => {
    for (let width = 500; width <= 1600; width += 100) {
      const rule = containerRule(width)

      expect(rule).toContain(`.d-header .d-header__brand-slot--fit-${width} .d-header__nav{display:flex}`)
      expect(rule).toContain(`.d-header .d-header__brand-slot--fit-${width} .d-header__brand .q-btn-dropdown__arrow-container{display:none}`)
      expect(rule).toContain(`.d-header .d-header__brand-slot--fit-${width} .d-header__bar{display:grid;grid-template-columns:minmax(3.75rem, 1fr) auto minmax(0, 1fr)}`)
    }
    expect(css).not.toContain('--fit-1700')
    expect(css).not.toContain('--fit-400')
  })

  it('keeps the split home button padded so the toolbar stays 52px tall', () => {
    expect(css).toContain('.d-header .d-header__brand.q-btn-group>.q-btn-dropdown--current{min-width:0;padding:13px 16px}')
  })

  it('keeps the active menu row readable in both themes', () => {
    expect(css).toContain('.d-header-links__menu .q-item--active{color:inherit;font-weight:500;background-color:rgba(189,189,189,.35)}')
    expect(css).toContain('.body--dark .d-header-links__menu .q-item--active{color:var(--q-primary-in-dark-bg);')
  })
})
