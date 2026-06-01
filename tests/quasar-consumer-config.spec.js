import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { createQuasarConfig } from '../src/quasar.factory.js'

const createConsumerProject = () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'docsector-consumer-config-'))
  const packageDir = join(projectRoot, 'node_modules', '@docsector', 'docsector-reader')

  mkdirSync(packageDir, { recursive: true })
  writeFileSync(join(packageDir, 'package.json'), '{"name":"@docsector/docsector-reader"}')

  return projectRoot
}

describe('consumer Quasar config', () => {
  it('keeps Docsector virtual registry imports out of dependency optimization', () => {
    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })
      const viteConf = {}

      config.build.extendViteConf(viteConf)

      expect(viteConf.optimizeDeps.exclude).toEqual(expect.arrayContaining([
        '@docsector/docsector-reader',
        '@docsector/docsector-reader/src/router/index',
        '@docsector/docsector-reader/src/router/routes',
        'node_modules/@docsector/docsector-reader/src/router/index',
        'node_modules/@docsector/docsector-reader/src/router/routes',
        'virtual:docsector-books',
        'virtual:docsector-homepage-override',
        'virtual:docsector-code-examples',
        'virtual:docsector-git-dates'
      ]))
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it('pre-bundles markdown CommonJS plugins used by engine source files', () => {
    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })
      const viteConf = {}

      config.build.extendViteConf(viteConf)

      expect(viteConf.optimizeDeps.include).toEqual(expect.arrayContaining([
        'markdown-it',
        'markdown-it-attrs',
        'markdown-it-task-lists',
        'markdown-it-texmath'
      ]))
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
