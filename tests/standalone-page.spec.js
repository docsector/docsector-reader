import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildPageRoutePath, buildSearchContentIndex, loadBooksRegistry } from '../src/quasar.factory.js'

const roots = []

afterEach(() => {
  vi.restoreAllMocks()
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true })
  }
})

// ! A standalone page: an entry keyed '' whose book no *.book.js registers,
//   hidden from the menus, with its Markdown at the pages root
const standaloneEntry = (book, extra = '') => `'': {
    config: {
      book: '${book}',
      icon: 'favorite',
      status: 'done',
      menu: { hidden: true },
      subpages: { showcase: true }${extra}
    },
    data: { 'en-US': { title: 'Sponsors' } }
  }`

const guideIndex = (standalone) => `export default {
  '/getting-started': {
    config: { icon: 'flag', status: 'done' },
    data: { 'en-US': { title: 'Getting Started' } }
  },
  ${standalone}
}
`

const createProject = (standalone = standaloneEntry('sponsors')) => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'docsector-standalone-'))
  roots.push(projectRoot)
  const pages = join(projectRoot, 'src', 'pages')
  mkdirSync(join(pages, 'guide'), { recursive: true })

  writeFileSync(join(pages, 'guide.book.js'), "export default { id: 'guide', label: 'Guide', icon: 'school', order: 1 }\n")
  writeFileSync(join(pages, 'guide.index.js'), guideIndex(standalone))
  writeFileSync(join(pages, 'guide', 'getting-started.overview.en-US.md'), '## Install\n\nRun the installer.\n')
  writeFileSync(join(pages, 'sponsors.overview.en-US.md'), `---
desc: Sponsor the project and advertise in the docs.
keys: advertise backers
faq:
  - q: How do I sponsor?
    a: Email us.
---

## Tiers

Platinum and Gold.
`)
  writeFileSync(join(pages, 'sponsors.showcase.en-US.md'), '## Placements\n\nThe panel.\n')

  return projectRoot
}

describe('standalone pages', () => {
  it('route at the book id, outside every registered book', async () => {
    const projectRoot = createProject()
    const registry = await loadBooksRegistry(projectRoot)
    const entry = registry.pageEntries.find(item => item.book === 'sponsors')

    expect(entry).toMatchObject({ book: 'sponsors', pagePath: '', versionCurrent: true, versionPrefix: '', i18nSegments: ['sponsors'], unversionedPath: '/sponsors' })
    expect(buildPageRoutePath(entry, 'overview', { leadingSlash: true })).toBe('/sponsors/overview')
    expect(buildPageRoutePath(entry, 'showcase')).toBe('sponsors/showcase')
    expect(buildPageRoutePath(entry, '')).toBe('sponsors')
    expect(registry.allBooks.map(book => book.id)).toEqual(['guide'])
  })

  it('merge their frontmatter and stay hidden', async () => {
    const registry = await loadBooksRegistry(createProject())
    const { page } = registry.pageEntries.find(item => item.book === 'sponsors')

    expect(page.config.menu.hidden).toBe(true)
    expect(page.config.meta.description['en-US']).toBe('Sponsor the project and advertise in the docs.')
  })

  it('stay out of the sidebar search index — the tree never lists them', async () => {
    const projectRoot = createProject()
    const registry = await loadBooksRegistry(projectRoot)
    const index = buildSearchContentIndex(join(projectRoot, 'src', 'pages'), registry.pageEntries, 'en-US')

    expect(Object.keys(index)).toEqual(['/guide/getting-started'])
    expect(index['/guide/getting-started']).toContain('run the installer')
  })

  it('warn once per reserved route path, whatever its case', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const projectRoot = createProject(`${standaloneEntry('index')},
  '/promo': { config: { book: 'Assets', status: 'done' }, data: { 'en-US': { title: 'Promo' } } }`)

    await loadBooksRegistry(projectRoot)
    await loadBooksRegistry(projectRoot)

    const messages = warn.mock.calls.map(([message]) => String(message))
    expect(messages.filter(message => message.includes('/index uses the reserved route path "/index"'))).toHaveLength(1)
    expect(messages.filter(message => message.includes('/Assets/promo uses the reserved route path "/Assets"'))).toHaveLength(1)
    expect(messages.find(message => message.includes('"/index"'))).toContain('dist/index.html')
  })

  it('reserve index, 404 and feedback for the bare page only, and nothing under a version prefix', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const projectRoot = createProject(`${standaloneEntry('sponsors')},
  '/about': { config: { book: 'index', status: 'done' }, data: { 'en-US': { title: 'About' } } },
  '/form': { config: { book: 'feedback', status: 'done' }, data: { 'en-US': { title: 'Form' } } },
  '/lost': { config: { book: '404', status: 'done' }, data: { 'en-US': { title: 'Lost' } } }`)
    const archived = join(projectRoot, 'src', 'pages', '.old', 'v1')
    mkdirSync(archived, { recursive: true })
    writeFileSync(join(archived, 'feedback.book.js'), "export default { id: 'feedback', label: 'Feedback', icon: 'chat', order: 1 }\n")
    writeFileSync(join(archived, 'feedback.index.js'), "export default { '/a': { config: { status: 'done' }, data: { 'en-US': { title: 'A' } } } }\n")
    writeFileSync(join(archived, 'assets.book.js'), "export default { id: 'assets', label: 'Assets', icon: 'image', order: 2 }\n")
    writeFileSync(join(archived, 'assets.index.js'), "export default { '/b': { config: { status: 'done' }, data: { 'en-US': { title: 'B' } } } }\n")

    await loadBooksRegistry(projectRoot)

    expect(warn.mock.calls.map(([message]) => String(message)).filter(message => message.includes('reserved route path'))).toEqual([])
  })

  it('do not warn for a free route prefix', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await loadBooksRegistry(createProject(standaloneEntry('backers')))

    expect(warn.mock.calls.filter(([message]) => String(message).includes('backers'))).toEqual([])
  })

  it('warn when declared in an archived version', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const projectRoot = createProject(standaloneEntry('patrons'))
    const archived = join(projectRoot, 'src', 'pages', '.old', 'v1')
    mkdirSync(archived, { recursive: true })
    writeFileSync(join(archived, 'guide.book.js'), "export default { id: 'guide', label: 'Guide', icon: 'school', order: 1 }\n")
    writeFileSync(join(archived, 'guide.index.js'), guideIndex(`${standaloneEntry('patrons')},
  '/internal': { config: { status: 'done', menu: { hidden: true } }, data: { 'en-US': { title: 'Internal' } } },
  '/extras': { config: { book: 'extras', status: 'done' }, data: { 'en-US': { title: 'Extras' } } }`))

    await loadBooksRegistry(projectRoot)

    const messages = warn.mock.calls.map(([message]) => String(message)).filter(message => message.includes('archived version'))
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('/patrons')
    expect(messages[0]).toContain('archived version v1')
    expect(messages[0]).toContain('current pages root only')
  })
})
