import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

import HJSON from 'hjson'
import { describe, expect, it } from 'vitest'

const cliPath = resolve(process.cwd(), 'bin/docsector.js')
const skillName = 'docsector-documentation-authoring'

const runCli = (cwd, args = []) =>
  execFileSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf-8'
  })

describe('docsector CLI', () => {
  it('scaffolds guide book tabs with Docsector white colors', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'docsector-init-book-color-'))
    const projectName = 'DocsBookColor'

    try {
      runCli(projectDir, ['init', projectName])

      const bookSource = readFileSync(join(projectDir, projectName, 'src/pages/guide.book.js'), 'utf-8')

      expect(bookSource).toContain("active: 'white'")
      expect(bookSource).toContain("inactive: 'white'")
      expect(bookSource).not.toContain("color: 'secondary'")
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })

  it('scaffolds the sponsors and ad UI strings', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'docsector-init-sponsorship-'))
    const projectName = 'DocsSponsorship'

    try {
      runCli(projectDir, ['init', projectName])

      const messages = HJSON.parse(readFileSync(join(projectDir, projectName, 'src/i18n/languages/en-US.hjson'), 'utf-8'))

      expect(messages.page.sponsors).toEqual({ title: 'Sponsors', cta: 'Your logo here', example: 'Your sponsor here' })
      expect(messages.page.ad).toEqual({ label: 'Ad', example: 'Your ad here' })

      const configSource = readFileSync(join(projectDir, projectName, 'docsector.config.js'), 'utf-8')
      expect(configSource).toContain('// sponsors: {')
      expect(configSource).toContain('// ads: {')
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })

  it('answers `serve --help` itself instead of asking the app bin for a serve extension', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'docsector-serve-help-'))

    try {
      const output = runCli(projectDir, ['serve', '--help'])

      expect(output).toContain('Serve the production build (dist/spa) locally')
      expect(output).toContain('--port, -p')
      expect(output).not.toContain('app extension')
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })

  it('refuses to serve a project that has no build', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'docsector-serve-nobuild-'))

    try {
      let failure = null
      try {
        runCli(projectDir, ['serve'])
      } catch (error) {
        failure = error
      }

      expect(failure).not.toBeNull()
      expect(String(failure.stderr)).toContain('No index.html')
      expect(String(failure.stderr)).toContain('docsector build')
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })

  it('installs the built-in authoring skill for older scaffolded projects', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'docsector-install-skill-'))

    try {
      mkdirSync(join(projectDir, 'public'), { recursive: true })

      const output = runCli(projectDir, ['install-skill'])
      const localSkill = join(projectDir, '.github/skills', skillName, 'SKILL.md')
      const publicSkill = join(projectDir, 'public/.well-known/agent-skills', skillName, 'SKILL.md')

      expect(output).toContain('Installing docsector-documentation-authoring')
      expect(output).toContain('docsector.config.js')
      expect(output).toContain("name: 'docsector-documentation-authoring'")
      expect(existsSync(localSkill)).toBe(true)
      expect(existsSync(publicSkill)).toBe(true)
      expect(readFileSync(localSkill, 'utf-8')).toContain('Docsector Documentation Authoring')
      expect(readFileSync(publicSkill, 'utf-8')).toContain('Docsector Documentation Authoring')
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })

  it('does not overwrite an installed authoring skill unless forced', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'docsector-install-skill-'))
    const localSkill = join(projectDir, '.github/skills', skillName, 'SKILL.md')

    try {
      runCli(projectDir, ['install-skill'])
      writeFileSync(localSkill, 'custom local skill', 'utf-8')

      const skippedOutput = runCli(projectDir, ['install-skill'])
      expect(skippedOutput).toContain('skipped Repository-local skill')
      expect(readFileSync(localSkill, 'utf-8')).toBe('custom local skill')

      const forcedOutput = runCli(projectDir, ['install-skill', '--force'])
      expect(forcedOutput).toContain('created Repository-local skill')
      expect(readFileSync(localSkill, 'utf-8')).toContain('Docsector Documentation Authoring')
    } finally {
      rmSync(projectDir, { recursive: true, force: true })
    }
  })
})
