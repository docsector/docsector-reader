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

  it('lets the Dark plugin fall back to the OS theme', () => {
    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })

      // ? the fail-safe for when theme-init.js cannot apply the stored preference
      expect(config.framework.config.dark).toBe('auto')
      // ? Dark is auto-installed by Quasar — listing it would be a no-op at best
      expect(config.framework.plugins).not.toContain('Dark')
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it('keeps the theme out of the boot files', () => {
    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })

      // ? boot files run after ALL boot chunks load, far too late to beat the
      //   first paint — theme-init.js owns the theme; no theme boot here
      //   (no axios boot either: the engine fetches with the native Fetch API)
      //   `hydration` runs first: it must flag SSR hydration before mount
      expect(config.boot).toEqual(['hydration', 'icons', 'store', 'QZoom', 'i18n'])
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it('injects the pre-paint theme script into index.html', () => {
    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })
      const plugin = config.build.vitePlugins.find((entry) => entry?.name === 'docsector-theme-boot')

      expect(plugin).toBeDefined()
      // ? no `apply` key: the script is needed in dev and in build alike
      expect(plugin.apply).toBeUndefined()

      const [tag] = plugin.transformIndexHtml()

      expect(tag.tag).toBe('script')
      expect(tag.injectTo).toBe('body-prepend')
      expect(tag.children).toContain('prefers-color-scheme: dark')
      expect(tag.children).toContain('setting.theme')
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
