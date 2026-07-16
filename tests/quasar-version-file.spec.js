import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createQuasarConfig } from '../src/quasar.factory.js'

const createConsumerProject = () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'docsector-version-file-'))
  const packageDir = join(projectRoot, 'node_modules', '@docsector', 'docsector-reader')

  mkdirSync(packageDir, { recursive: true })
  writeFileSync(join(packageDir, 'package.json'), '{"name":"@docsector/docsector-reader"}')

  return projectRoot
}

const findVersionPlugin = (config) =>
  config.build.vitePlugins.find((plugin) => plugin?.name === 'docsector-version-file')

const ENV_KEYS = ['CF_PAGES_COMMIT_SHA', 'DOCSECTOR_BUILD_ID']
const savedEnv = {}

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = savedEnv[key]
    }
  }
})

describe('build ID stamping', () => {
  it('bakes the build ID into the client bundle via define', () => {
    process.env.DOCSECTOR_BUILD_ID = 'test-build-42'

    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })
      const viteConf = {}

      config.build.extendViteConf(viteConf)

      expect(viteConf.define.__DOCSECTOR_BUILD__).toBe('"test-build-42"')
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it('prefers the Cloudflare Pages commit SHA over the explicit override', () => {
    process.env.CF_PAGES_COMMIT_SHA = 'abc123'
    process.env.DOCSECTOR_BUILD_ID = 'ignored'

    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })
      const viteConf = {}

      config.build.extendViteConf(viteConf)

      expect(viteConf.define.__DOCSECTOR_BUILD__).toBe('"abc123"')
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it('falls back to a per-build timestamp without env overrides', () => {
    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })
      const viteConf = {}

      config.build.extendViteConf(viteConf)

      const baked = JSON.parse(viteConf.define.__DOCSECTOR_BUILD__)
      expect(typeof baked).toBe('string')
      expect(baked.length).toBeGreaterThan(0)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})

describe('version.json emission', () => {
  it('writes version.json with the same build ID and a Cache-Control rule', () => {
    process.env.DOCSECTOR_BUILD_ID = 'test-build-42'

    const projectRoot = createConsumerProject()

    try {
      const distDir = join(projectRoot, 'dist', 'spa')
      mkdirSync(distDir, { recursive: true })
      writeFileSync(join(distDir, '_headers'), '/*.md\n  Content-Type: text/markdown; charset=utf-8\n')

      const config = createQuasarConfig({ projectRoot })
      const plugin = findVersionPlugin(config)

      expect(plugin).toBeDefined()
      expect(plugin.apply).toBe('build')

      plugin.closeBundle()

      const version = JSON.parse(readFileSync(join(distDir, 'version.json'), 'utf-8'))
      expect(version.build).toBe('test-build-42')
      expect(typeof version.generatedAt).toBe('string')

      const headers = readFileSync(join(distDir, '_headers'), 'utf-8')
      expect(headers).toContain('/*.md')
      expect(headers).toContain('/version.json\n  Cache-Control: no-cache')

      // ? a second run must not duplicate the rule
      plugin.closeBundle()
      const again = readFileSync(join(distDir, '_headers'), 'utf-8')
      expect(again.match(/\/version\.json/g)).toHaveLength(1)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it('creates _headers when the build produced none', () => {
    const projectRoot = createConsumerProject()

    try {
      const distDir = join(projectRoot, 'dist', 'spa')
      mkdirSync(distDir, { recursive: true })

      const config = createQuasarConfig({ projectRoot })
      findVersionPlugin(config).closeBundle()

      const headers = readFileSync(join(distDir, '_headers'), 'utf-8')
      expect(headers).toContain('/version.json\n  Cache-Control: no-cache')
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it('does nothing when the dist directory is missing', () => {
    const projectRoot = createConsumerProject()

    try {
      const config = createQuasarConfig({ projectRoot })

      expect(() => findVersionPlugin(config).closeBundle()).not.toThrow()
      expect(existsSync(join(projectRoot, 'dist', 'spa', 'version.json'))).toBe(false)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
