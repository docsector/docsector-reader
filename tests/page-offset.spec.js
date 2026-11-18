import { readFileSync } from 'node:fs'

import { compileString } from 'sass'
import { parse } from 'vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

import {
  HEADER_HEIGHT,
  HEADER_HEIGHT_WITH_BOOKS,
  resolveHeaderHeight,
  resolvePageMinHeight
} from '../src/composables/page-offset.js'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf-8')
const sfc = (path) => parse(read(path)).descriptor

// : every element node of a template AST
const elements = (node, found = []) => {
  if (node.type === 1) found.push(node)
  for (const child of node.children || []) elements(child, found)
  return found
}
// : the expression bound to `:name` on an element, or the static value of `name`
const bound = (element, name) => {
  const prop = element.props.find(p => (p.type === 7 && p.name === 'bind' && p.arg?.content === name) || (p.type === 6 && p.name === name))
  return prop?.exp?.content ?? prop?.value?.content
}

describe('page offset', () => {
  it('sizes the header from the books', () => {
    expect(resolveHeaderHeight(0)).toBe(HEADER_HEIGHT)
    expect(resolveHeaderHeight(1)).toBe(HEADER_HEIGHT_WITH_BOOKS)
    expect(resolveHeaderHeight(4)).toBe(111)
    expect(HEADER_HEIGHT).toBe(53)
  })

  it('subtracts the submenu, from its CSS height, only when the page shows one', () => {
    expect(resolvePageMinHeight(111, true)).toBe('calc(100vh - 111px - var(--d-submenu-min-height, 36px))')
    expect(resolvePageMinHeight(111, false)).toBe('calc(100vh - 111px)')
    expect(resolvePageMinHeight(53, true)).toBe('calc(100vh - 53px - var(--d-submenu-min-height, 36px))')
  })

  it('keeps the historical offset without a provided header height', () => {
    expect(resolvePageMinHeight(undefined, true)).toBe('calc(100vh - 86px)')
    expect(resolvePageMinHeight(null, false)).toBe('calc(100vh - 86px)')
  })
})

describe('DefaultLayout header height', () => {
  const layout = sfc('../src/layouts/DefaultLayout.vue')

  it('hints QLayout with the same height it provides to pages', () => {
    const header = elements(layout.template.ast).find(e => e.tag === 'q-header')

    expect(bound(header, 'height-hint')).toBe('headerHeight')
    expect(layout.scriptSetup.content).toMatch(/const headerHeight = computed\(\(\) => resolveHeaderHeight\(sortedBooks\.value\.length\)\)/)
    expect(layout.scriptSetup.content).toContain('provide(HEADER_HEIGHT_KEY, headerHeight)')
  })
})

describe('DPage first layout', () => {
  const page = sfc('../src/components/DPage.vue')
  const script = page.scriptSetup.content
  const rail = elements(page.template.ast).find(e => e.tag === 'q-drawer' && bound(e, 'side') === 'right')

  it('starts the page min-height below the provided header', () => {
    expect(script).toContain('const headerHeight = inject(HEADER_HEIGHT_KEY, null)')
    expect(script).toContain('const pageMinHeight = ref(resolvePageMinHeight(headerHeight?.value, showSubmenu.value))')
    expect(script).not.toContain("ref('calc(100vh - 86px)')")
  })

  it('sizes the submenu from the variable the first min-height reads', () => {
    const css = compileString(page.styles[0].content, { syntax: 'indented', style: 'compressed' }).css

    expect(css).toContain('#page-container{padding-bottom:0 !important;--d-submenu-min-height: 36px}')
    expect(css).toMatch(/@media\(max-width: 1023px\)\{#page-container\{--d-submenu-min-height: 40px\}/)
    expect(css).toMatch(/#submenu\{min-height:var\(--d-submenu-min-height\);/)
    expect(css).not.toMatch(/#submenu\{min-height:(36|40)px/)
  })

  it('never hydrates the right rail as an overlay before the screen is measured', () => {
    // ? width 0 must fall back like rightRailState, or a drawer hydrated as an
    //   open overlay takes the body's scroll lock and keeps it
    expect(bound(rail, 'behavior')).toBe("rightRailOverlay ? 'mobile' : 'desktop'")
    expect(script).toContain('const rightRailOverlay = computed(() => ($q.screen.width || 1440) <= 1023)')
    expect(script).toContain('screenWidth: $q.screen.width || 1440')
  })

  it('does not open the ToC on page entry where the rail is an overlay', () => {
    expect(script).toMatch(/mobileTocRuleApplied = true\n\s+if \(rightRailState\.value\.isMobile \|\| rightRailOverlay\.value\) \{\n\s+layoutMeta\.value = false/)
  })

  it('closes a tablet overlay assistant for the visit without saving it', () => {
    expect(script).toMatch(/if \(!rightRailState\.value\.isMobile && rightRailOverlay\.value && layoutAssistant\.value\) \{\n\s+store\.commit\('layout\/setAssistantUnsaved', false\)/)
  })
})

describe('root scrollbar', () => {
  it('reserves no scrollbar gutter on the root', () => {
    expect(read('../src/css/app.sass')).not.toMatch(/scrollbar-gutter/)
  })
})

describe('pre-hydration right rail', () => {
  it('paints open only a rail the server rendered open', () => {
    const css = compileString(read('../src/css/app.sass'), { syntax: 'indented', style: 'compressed' }).css

    expect(css).toContain('body:not(.docsector-hydrated) .q-layout:has(aside.q-drawer--right:not(.q-layout--prevent-focus)) aside.q-drawer--right{transform:translateX(0) !important')
    expect(css).not.toMatch(/\.q-layout:has\(aside\.q-drawer--right\)/)
  })
})

describe('right-rail close', () => {
  it('persists an assistant close only when the assistant is open', () => {
    const script = sfc('../src/components/DPage.vue').scriptSetup.content

    expect(script).toMatch(/layoutMeta\.value = false\n(?:\s*\/\/.*\n)*\s+if \(layoutAssistant\.value\) \{\n\s+layoutAssistant\.value = false/)
  })
})
