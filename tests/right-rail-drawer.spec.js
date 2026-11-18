import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { parse } from 'vue/compiler-sfc'
import { renderToString } from 'vue/server-renderer'
import * as QuasarServer from 'quasar/dist/quasar.server.prod.js'
import { describe, expect, it } from 'vitest'

const { Quasar, QLayout, QDrawer } = QuasarServer.default || QuasarServer

// ! DPage's right-rail drawer, as its template declares it
const { descriptor } = parse(readFileSync(new URL('../src/components/DPage.vue', import.meta.url), 'utf-8'))
const elements = (node, found = []) => {
  if (node.type === 1) found.push(node)
  for (const child of node.children || []) elements(child, found)
  return found
}
const rail = elements(descriptor.template.ast).find(e => e.tag === 'q-drawer' && e.props.some(p => p.type === 6 && p.name === 'side' && p.value?.content === 'right'))
// : the drawer's static attributes as QDrawer props (`elevated`, `side="right"`, …)
const staticProps = Object.fromEntries(rail.props
  .filter(p => p.type === 6)
  .map(p => [p.name.replace(/-(\w)/g, (_, c) => c.toUpperCase()), p.value ? p.value.content : true]))

// : a bound attribute's expression (`:model-value="rightRailOpen"` → `rightRailOpen`)
const bound = (name) => rail.props.find(p => p.type === 7 && p.name === 'bind' && p.arg?.content === name)?.exp.content

// : the drawer's server-rendered <aside>, hydrating in desktop mode with a given model
const renderRail = async (modelValue) => {
  const app = createSSRApp({
    render: () => h(QLayout, { view: 'lHh LpR lFf' }, () => h(QDrawer, {
      ...staticProps,
      behavior: 'desktop',
      modelValue,
      'onUpdate:modelValue': () => {}
    }, () => h('div', 'rail')))
  })
  app.use(Quasar, {}, { req: { headers: {} }, res: {}, _meta: {} })
  const html = await renderToString(app, { _meta: {}, req: { headers: {} } })
  return html.match(/<aside[^>]*>[\s\S]*?<\/aside>/)[0]
}

describe('right-rail drawer', () => {
  it('hydrates in desktop mode while the screen is unmeasured', () => {
    expect(bound('behavior')).toBe("rightRailOverlay ? 'mobile' : 'desktop'")
  })

  it('opens from its model alone', () => {
    // ? show-if-above, static or bound or spread, would override the model
    const showIfAbove = rail.props.filter(p => /show-?if-?above|showIfAbove/i.test(p.name) || /show-?if-?above|showIfAbove/i.test(p.arg?.content || '') || (p.name === 'bind' && !p.arg))

    expect(showIfAbove).toEqual([])
    expect(bound('model-value')).toBe('rightRailOpen')
  })

  it('stays closed when the model is closed — a page without a ToC', async () => {
    // ? show-if-above would open it whatever the model says in desktop mode
    expect(await renderRail(false)).toContain('q-layout--prevent-focus')
  })

  it('opens when the model is open', async () => {
    const aside = await renderRail(true)

    expect(aside).not.toContain('q-layout--prevent-focus')
    // : the shadow renders only on a showing drawer
    expect(aside).toContain('q-layout__shadow')
  })
})
