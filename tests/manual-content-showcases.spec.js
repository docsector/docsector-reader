import { existsSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import guidePages from '../src/pages/guide.index.js'
import manualPages from '../src/pages/manual.index.js'

describe('manual content showcase registry', () => {
  const blockEntries = Object.entries(manualPages)
    .filter(([routePath, entry]) => routePath.startsWith('/content/blocks/') && entry?.config)

  it('enables showcase for every content block and ships localized showcase files', () => {
    expect(blockEntries.length).toBeGreaterThan(0)

    for (const [routePath, entry] of blockEntries) {
      expect(entry.config.subpages.showcase).toBe(true)

      const slug = routePath.replace('/content/blocks/', '')
      expect(existsSync(join(process.cwd(), 'src/pages/manual/content/blocks', `${slug}.showcase.en-US.md`))).toBe(true)
      expect(existsSync(join(process.cwd(), 'src/pages/manual/content/blocks', `${slug}.showcase.pt-BR.md`))).toBe(true)
    }
  })

  it('keeps Page overview-only and removes the old guide alerts page', () => {
    expect(manualPages['/content/structures/page'].config.subpages.showcase).toBe(false)
    expect(guidePages['/alerts-and-blockquotes']).toBeUndefined()
    expect(existsSync(join(process.cwd(), 'src/pages/manual/content/structures', 'page.showcase.en-US.md'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'src/pages/manual/content/structures', 'page.showcase.pt-BR.md'))).toBe(false)
  })
})