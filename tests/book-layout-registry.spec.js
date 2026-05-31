import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { afterEach, describe, expect, it } from 'vitest'

import { loadBooksRegistry } from '../src/quasar.factory.js'
import { PAGE_LAYOUT_FULLWIDTH, resolvePageLayout } from '../src/page-layout.js'

const roots = []

const createProjectRoot = () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'docsector-book-layout-'))
  roots.push(projectRoot)
  mkdirSync(join(projectRoot, 'src', 'pages'), { recursive: true })
  return projectRoot
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true })
  }
})

describe('book layout registry', () => {
  it('registers the example Full book as a fullwidth book', async () => {
    const registry = await loadBooksRegistry(process.cwd())
    const book = registry.books.full.config
    const entry = registry.pageEntries.find(entry => entry.book === 'full' && entry.pagePath === '/layout')

    expect(book.label).toBe('Full')
    expect(book.layouts).toBe(PAGE_LAYOUT_FULLWIDTH)
    expect(entry.bookConfig.layouts).toBe(PAGE_LAYOUT_FULLWIDTH)
    expect(resolvePageLayout(entry.bookConfig.layouts)).toMatchObject({
      mode: PAGE_LAYOUT_FULLWIDTH,
      sidebar: false,
      submenu: false,
      toc: false,
      contentWidth: 'fullwidth'
    })
  })

  it('carries book layout defaults into page entries', async () => {
    const projectRoot = createProjectRoot()

    writeFileSync(join(projectRoot, 'src', 'pages', 'guide.book.js'), `export default {
  id: 'guide',
  label: 'Guide',
  layout: 'fullwidth'
}
`)
    writeFileSync(join(projectRoot, 'src', 'pages', 'guide.index.js'), `export default {
  '/getting-started': {
    config: {
      icon: 'flag',
      status: 'done',
      subpages: { showcase: false, vs: false }
    },
    data: {
      'en-US': { title: 'Getting Started' }
    }
  }
}
`)

    const registry = await loadBooksRegistry(projectRoot)
    const book = registry.books.guide.config
    const entry = registry.pageEntries.find(entry => entry.book === 'guide' && entry.pagePath === '/getting-started')

    expect(book.layouts).toBe(PAGE_LAYOUT_FULLWIDTH)
    expect(entry.bookConfig.layouts).toBe(PAGE_LAYOUT_FULLWIDTH)
    expect(resolvePageLayout(entry.bookConfig.layouts)).toMatchObject({
      mode: PAGE_LAYOUT_FULLWIDTH,
      sidebar: false,
      submenu: false,
      toc: false,
      contentWidth: 'fullwidth'
    })
  })
})
