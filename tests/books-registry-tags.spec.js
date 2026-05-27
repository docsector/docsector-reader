import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { createQuasarConfig, loadBooksRegistry } from '../src/quasar.factory.js'

describe('book registry tags migration', () => {
  it('loads tags from each book index into the current version map', async () => {
    const registry = await loadBooksRegistry(process.cwd())
    const currentVersionId = registry.versions.find(version => version.current === true)?.id

    expect(typeof currentVersionId).toBe('string')

    const currentTags = registry.bookTagsByVersion[currentVersionId]

    expect(currentTags.guide['en-US']['/guide/getting-started']).toContain('install')
    expect(currentTags.manual['pt-BR']['/manual/components/d-menu']).toContain('busca')
  })

  it('keeps tags scoped by book prefix', async () => {
    const registry = await loadBooksRegistry(process.cwd())
    const currentVersionId = registry.versions.find(version => version.current === true)?.id
    const currentTags = registry.bookTagsByVersion[currentVersionId]

    expect(Object.keys(currentTags.guide['en-US']).every(path => path.startsWith('/guide/'))).toBe(true)
    expect(Object.keys(currentTags.manual['en-US']).every(path => path.startsWith('/manual/'))).toBe(true)
  })

  it('does not inject legacy @docsector/tags alias in consumer mode', () => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'docsector-reader-'))
    const packageDir = join(projectRoot, 'node_modules', '@docsector', 'docsector-reader')

    mkdirSync(packageDir, { recursive: true })
    writeFileSync(join(packageDir, 'package.json'), '{"name":"@docsector/docsector-reader"}')

    try {
      const config = createQuasarConfig({ projectRoot })
      const viteConf = {}

      config.build.extendViteConf(viteConf)

      expect(viteConf.resolve.alias['@docsector/tags']).toBeUndefined()
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})