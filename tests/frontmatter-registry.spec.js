import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { afterEach, describe, expect, it } from 'vitest'

import { buildSearchContentIndex, collectFrontmatterOverlay, loadBooksRegistry } from '../src/quasar.factory.js'
import { definePage } from '../src/index.js'

const roots = []

const createProjectRoot = () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'docsector-frontmatter-'))
  roots.push(projectRoot)
  mkdirSync(join(projectRoot, 'src', 'pages', 'guide'), { recursive: true })

  writeFileSync(join(projectRoot, 'src', 'pages', 'guide.book.js'), "export default { id: 'guide', label: 'Guide' }\n")
  writeFileSync(join(projectRoot, 'src', 'pages', 'guide.index.js'), `export default {
  '/getting-started': {
    config: {
      icon: 'flag',
      status: 'done',
      meta: { description: { 'en-US': 'Registry description' } },
      book: 'guide',
      menu: {},
      subpages: { showcase: true }
    },
    data: { 'en-US': { title: 'Registry Title' }, 'pt-BR': { title: 'Título do registry' } },
    metadata: { tags: { 'en-US': 'install setup' } }
  }
}
`)

  return projectRoot
}

const writePage = (projectRoot, name, content) => {
  writeFileSync(join(projectRoot, 'src', 'pages', 'guide', name), content)
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true })
  }
})

describe('frontmatter overlay collection', () => {
  it('keys the overlay by page and subpage from the filename convention', () => {
    const projectRoot = createProjectRoot()
    writePage(projectRoot, 'getting-started.overview.en-US.md', '---\ntitle: In-Page Title\n---\n\n## Overview\n')
    writePage(projectRoot, 'getting-started.showcase.pt-BR.md', '---\ntitle: Demonstração\n---\n\nDemo.\n')
    writePage(projectRoot, 'getting-started.overview.pt-BR.md', '## Sem frontmatter\n')

    const { overlay, rawBlocksByFile } = collectFrontmatterOverlay(projectRoot)

    expect(overlay.__current__['/guide/getting-started'].overview['en-US']).toEqual({ title: 'In-Page Title' })
    expect(overlay.__current__['/guide/getting-started'].showcase['pt-BR']).toEqual({ title: 'Demonstração' })
    expect(overlay.__current__['/guide/getting-started'].overview['pt-BR']).toBeUndefined()
    expect(Object.keys(rawBlocksByFile)).toHaveLength(2)
  })

  it('ignores Homepage files and markdown without a leading block', () => {
    const projectRoot = createProjectRoot()
    writeFileSync(join(projectRoot, 'src', 'pages', 'Homepage.en-US.md'), '---\ntitle: Home\n---\n\n# Home\n')
    writePage(projectRoot, 'getting-started.overview.en-US.md', '## Plain page\n\n---\n\nA thematic break.\n')

    const { overlay } = collectFrontmatterOverlay(projectRoot)
    expect(overlay).toEqual({})
  })
})

describe('frontmatter in loadBooksRegistry', () => {
  it('applies the full Quasar-style block to the registry entry', async () => {
    const projectRoot = createProjectRoot()
    writePage(projectRoot, 'getting-started.overview.en-US.md', [
      '---',
      'title: Ajax Bar',
      'desc: The QAjaxBar component displays a loading bar.',
      'keys: QAjaxBar loading',
      'examples: QAjaxBar',
      'related:',
      '  - /quasar-plugins/loading',
      '  - /quasar-plugins/loading-bar',
      '---',
      '',
      '## Overview',
      ''
    ].join('\n'))
    writePage(projectRoot, 'getting-started.showcase.en-US.md', '---\ntitle: Live Demo\ndesc: See it running.\n---\n\nDemo.\n')

    const registry = await loadBooksRegistry(projectRoot)
    const page = registry.books.guide.routes['/getting-started']

    expect(page.data['en-US'].title).toBe('Ajax Bar')
    expect(page.data['pt-BR'].title).toBe('Título do registry')
    expect(page.config.meta.description['en-US']).toBe('The QAjaxBar component displays a loading bar.')
    expect(page.config.examples).toBe('QAjaxBar')
    expect(page.config.related).toEqual(['/quasar-plugins/loading', '/quasar-plugins/loading-bar'])
    expect(page.config.icon).toBe('flag')
    expect(page.subpageMeta.showcase['en-US']).toEqual({ title: 'Live Demo', description: 'See it running.' })

    // : keys APPEND to the registry tags and reach the book search maps
    expect(page.metadata.tags['en-US']).toBe('install setup QAjaxBar loading')
    const currentVersion = registry.versions.find(version => version.current)
    expect(registry.bookTagsByVersion[currentVersion.id].guide['en-US']['/guide/getting-started'])
      .toBe('install setup QAjaxBar loading')
  })

  it('leaves pages without frontmatter untouched', async () => {
    const projectRoot = createProjectRoot()
    writePage(projectRoot, 'getting-started.overview.en-US.md', '## Overview\n')

    const registry = await loadBooksRegistry(projectRoot)
    const page = registry.books.guide.routes['/getting-started']

    expect(page.data['en-US'].title).toBe('Registry Title')
    expect(page.subpageMeta).toBeUndefined()
  })
})

describe('definePage', () => {
  it('passes metadata and subpageMeta through', () => {
    const page = definePage({
      config: { icon: 'flag' },
      data: { 'en-US': { title: 'X' } },
      metadata: { tags: { 'en-US': 'a b' } },
      subpageMeta: { showcase: { 'en-US': { title: 'Y' } } }
    })

    expect(page.metadata).toEqual({ tags: { 'en-US': 'a b' } })
    expect(page.subpageMeta).toEqual({ showcase: { 'en-US': { title: 'Y' } } })
  })

  it('keeps the lean shape when the optional blocks are absent', () => {
    expect(definePage({ config: { icon: 'flag' }, data: {} })).toEqual({ config: { icon: 'flag' }, data: {} })
  })
})

describe('frontmatter and the search content index', () => {
  it('strips the block from the indexed content while keys reach the tags', async () => {
    const projectRoot = createProjectRoot()
    writePage(projectRoot, 'getting-started.overview.en-US.md', [
      '---',
      'desc: The QAjaxBar component displays a loading bar.',
      'keys: QAjaxBar',
      '---',
      '',
      '## Overview',
      '',
      'Body content here.',
      ''
    ].join('\n'))

    const registry = await loadBooksRegistry(projectRoot)
    const index = buildSearchContentIndex(join(projectRoot, 'src', 'pages'), registry.pageEntries, 'en-US')
    const content = index['/guide/getting-started']

    expect(content).toContain('body content here.')
    expect(content).not.toContain('desc: the qajaxbar component')
    expect(registry.books.guide.routes['/getting-started'].metadata.tags['en-US']).toContain('QAjaxBar')
  })
})
