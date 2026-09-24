import { readFileSync } from 'node:fs'

import { babelParse, parse, walk } from 'vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

// ! `menu: { hidden: true }` keeps a page routed and published while every
//   navigation surface skips it — the standalone-page recipe relies on each
//   of these filters, so each one is pinned in its component's script
const compact = (value) => String(value ?? '').replace(/\s+/g, '')

// : compacted source of the function (declaration or arrow const) `name`
const functionOf = (file, name) => {
  const { descriptor } = parse(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf-8'))
  const source = descriptor.scriptSetup.content
  let found = null

  walk(babelParse(source, { sourceType: 'module' }), {
    enter (node) {
      const named = (node.type === 'FunctionDeclaration' && node.id?.name === name) ||
        (node.type === 'VariableDeclarator' && node.id?.name === name)
      if (named && found === null) found = compact(source.slice(node.start, node.end))
    }
  })

  expect(found, `missing ${name} in ${file}`).not.toBeNull()
  return found
}

describe('hidden pages stay off every navigation surface', () => {
  it('drops them from the sidebar tree and its search', () => {
    expect(functionOf('components/DMenu.vue', 'getTopRoutes')).toContain('.filter(route=>route?.meta?.menu?.hidden!==true)')
  })

  it('drops them from previous/next, and gives a hidden page no links of its own', () => {
    const sibling = functionOf('components/DPageMeta.vue', 'getVersionSiblingPath')

    expect(sibling).toContain('.filter(item=>item?.meta?.menu?.hidden!==true)')
    expect(sibling).toContain("if(index<0)return''")
    expect(sibling.indexOf('hidden!==true')).toBeLessThan(sibling.indexOf('if(index<0)'))
  })

  it('never lands a book tab on them', () => {
    const landing = functionOf('layouts/DefaultLayout.vue', 'getFirstRoutePathByBook')

    expect(landing).toContain('if(topRoute.meta?.menu?.hidden===true)continue')
    expect(landing.indexOf('hidden===true')).toBeLessThan(landing.indexOf('constcandidatePath'))
  })

  it('shows an empty tree on a page whose book is not registered — the route book passes through unchecked', () => {
    const book = functionOf('components/DMenu.vue', 'currentBookId')

    expect(book).toContain("if(routeBook&&routeBook!=='home'){returnrouteBook}")
    expect(book).not.toContain('allBooks')
    expect(book).not.toContain('sortedBooks')
  })

  it('highlights no book tab on a page whose book is not registered', () => {
    const tab = functionOf('layouts/DefaultLayout.vue', 'activeBookTab')

    expect(tab).toContain('constexists=sortedBooks.value.some(book=>book.id===routeBook)')
    expect(tab).toContain('returnexists?routeBook:null')
  })
})
