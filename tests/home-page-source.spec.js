import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import { usesRemoteReadmeHomeContent } from '../src/home-page-mode.js'
import { resolveHomePageSources } from '../src/quasar.factory.js'

const createProjectRoot = () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'docsector-home-page-'))
  mkdirSync(join(projectRoot, 'src', 'pages'), { recursive: true })
  return projectRoot
}

const writeHomepage = (projectRoot, lang, content) => {
  writeFileSync(join(projectRoot, 'src', 'pages', `Homepage.${lang}.md`), content)
}

const buildConfig = (homePage = {}) => ({
  defaultLanguage: 'en-US',
  languages: [
    { value: 'en-US' },
    { value: 'pt-BR' }
  ],
  homePage
})

describe('resolveHomePageSources', () => {
  const originalFetch = global.fetch
  const roots = []

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()

    while (roots.length > 0) {
      rmSync(roots.pop(), { recursive: true, force: true })
    }
  })

  it('marks the homepage as remote-readme when the remote README loads successfully', async () => {
    const projectRoot = createProjectRoot()
    roots.push(projectRoot)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '# Remote Title\n\nBody'
    })

    const sources = await resolveHomePageSources(projectRoot, buildConfig({
      source: 'remote-readme',
      remoteReadmeUrl: 'https://example.com/README.md',
      fallbackToLocal: true
    }), { logPrefix: '[test]' })

    expect(sources.mode).toBe('remote-readme')
    expect(sources.byLang['en-US']).toContain('# Remote Title')
    expect(sources.byLang['pt-BR']).toContain('# Remote Title')
  })

  it('falls back to local homepage content and keeps the mode as local when the remote fetch fails', async () => {
    const projectRoot = createProjectRoot()
    roots.push(projectRoot)
    writeHomepage(projectRoot, 'en-US', '# Local Title\n\nLocal body')

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503
    })

    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const sources = await resolveHomePageSources(projectRoot, buildConfig({
      source: 'remote-readme',
      remoteReadmeUrl: 'https://example.com/README.md',
      fallbackToLocal: true
    }), { logPrefix: '[test]' })

    expect(sources.mode).toBe('local')
    expect(sources.byLang['en-US']).toContain('# Local Title')
    expect(sources.byLang['pt-BR']).toContain('# Local Title')
  })
})

describe('usesRemoteReadmeHomeContent', () => {
  it('only enables the content h1 path for the resolved remote homepage', () => {
    expect(usesRemoteReadmeHomeContent({
      pageBase: 'home',
      homePageSourceMode: 'remote-readme'
    })).toBe(true)

    expect(usesRemoteReadmeHomeContent({
      pageBase: 'home',
      homePageSourceMode: 'local'
    })).toBe(false)

    expect(usesRemoteReadmeHomeContent({
      pageBase: 'guide/getting-started',
      homePageSourceMode: 'remote-readme'
    })).toBe(false)
  })
})