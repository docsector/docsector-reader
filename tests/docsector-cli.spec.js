import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

import { describe, expect, it } from 'vitest'

const cliPath = resolve(process.cwd(), 'bin/docsector.js')
const skillName = 'docsector-documentation-authoring'

const runCli = (cwd, args = []) =>
  execFileSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf-8'
  })

describe('docsector CLI', () => {
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
