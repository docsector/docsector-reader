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

  it('gives the centered links the tile shadow and weight of the other header buttons', () => {
    expect(css).toContain('.d-header .q-btn:before{box-shadow:0 0 5px rgba(0,0,0,.2),0 0 2px rgba(0,0,0,.14),0 0 1px -2px rgba(0,0,0,.12);')
    expect(css).not.toMatch(/d-header__nav \.q-btn:before/)
    expect(css).not.toMatch(/\.d-header__link\{/)
  })

  it('sets a menu group title apart from the links, on the rows\' columns', () => {
    // ? a class pair beats `body.body--light .q-item__label--header` and app.sass' flush left
    expect(css).toContain('.d-header-links__menu .q-item__label.d-header-links__group{display:flex;align-items:center;padding:14px 16px 6px;color:rgba(0,0,0,.6);font-size:.75rem;font-weight:500;line-height:1rem;letter-spacing:.08em;text-transform:uppercase}')
    expect(css).toContain('.d-header-links__menu .q-item__label.d-header-links__group .q-icon{margin-right:12px}')
    expect(css).toContain('.body--dark .d-header-links__menu .q-item__label.d-header-links__group{color:hsla(0,0%,100%,.6)}')
    expect(css).toContain('.d-header-links__menu .d-header-links__section+.d-header-links__section,.d-header-links__menu .d-header-links__section+.d-header-link-item,.d-header-links__menu .d-header-link-item+.d-header-links__section{border-top:1px solid rgba(0,0,0,.12)}')
    expect(css).toContain('.body--dark .d-header-links__menu .d-header-links__section+.d-header-links__section,.body--dark .d-header-links__menu .d-header-links__section+.d-header-link-item,.body--dark .d-header-links__menu .d-header-link-item+.d-header-links__section{border-top-color:hsla(0,0%,100%,.12)}')
    expect(css).not.toMatch(/d-sr-only \.d-header-links__group/)
  })

  it('keeps the active menu row readable in both themes', () => {
    expect(css).toContain('.d-header-links__menu .q-item--active{color:inherit;font-weight:500;background-color:rgba(189,189,189,.35)}')
    expect(css).toContain('.body--dark .d-header-links__menu .q-item--active{color:var(--q-primary-in-dark-bg);')
  })
})
