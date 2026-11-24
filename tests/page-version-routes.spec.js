import { readFileSync } from 'node:fs'

import Hjson from 'hjson'
import { parse as parseSFC } from 'vue/compiler-sfc'
import { describe, expect, it, vi } from 'vitest'

// ! Registry: a page with release facts, a shortcut to it, and a shortcut with its own version
vi.mock('virtual:docsector-books', () => ({
  versions: [{ id: 'v1.3.1', current: true, released: true, routePrefix: '' }],
  pageEntries: [
    {
      book: 'manual',
      pagePath: '/storage/s3',
      version: 'v1.3.1',
      page: {
        config: { icon: 'cloud', status: 'done', version: 'v0.18.0', updated: ['v1.4.0', 'v1.3.0', 'v1.3.0', 'nope'] },
        data: { '*': { title: 'S3' } }
      }
    },
    {
      book: 'guide',
      pagePath: '/s3-shortcut',
      version: 'v1.3.1',
      page: {
        config: { link: { to: '/manual/storage/s3/overview/' } },
        data: { '*': { title: 'S3 shortcut' } }
      }
    },
    {
      book: 'guide',
      pagePath: '/own-shortcut',
      version: 'v1.3.1',
      page: {
        config: { link: { to: '/manual/storage/s3/overview/' }, version: 'v1.3.0', updated: 'v1.4.0' },
        data: { '*': { title: 'Own shortcut' } }
      }
    }
  ]
}))
vi.mock('pages/boot', () => ({ default: { meta: { 'en-US': {} } } }))

const { default: routes } = await import('../src/router/routes.js')

const metaOf = (path) => routes.find(route => route.path === path)?.meta

describe('page version route meta', () => {
  it('normalizes updated into pageUpdated next to pageVersion', () => {
    const meta = metaOf('/manual/storage/s3')

    expect(meta.pageVersion).toBe('v0.18.0')
    expect(meta.pageUpdated).toEqual(['v1.3.0', 'v1.4.0'])
    // ? The docs version keeps its own key, untouched by the page version
    expect(meta.version).toBe('v1.3.1')
  })

  it('lets a shortcut inherit the destination release facts', () => {
    const meta = metaOf('/guide/s3-shortcut')

    expect(meta.pageVersion).toBe('v0.18.0')
    expect(meta.pageUpdated).toEqual(['v1.3.0', 'v1.4.0'])
  })

  it('keeps the shortcut own release facts over the destination ones', () => {
    const meta = metaOf('/guide/own-shortcut')

    expect(meta.pageVersion).toBe('v1.3.0')
    expect(meta.pageUpdated).toEqual(['v1.4.0'])
  })
})

describe('page version chip — component wiring', () => {
  const sfc = (file) => parseSFC(readFileSync(new URL(`../src/components/${file}`, import.meta.url), 'utf-8')).descriptor
  const bindings = (node) => Object.fromEntries(node.props
    .filter(prop => prop.type === 7 && prop.name === 'bind')
    .map(prop => [prop.arg.content, prop.exp.content]))
  const find = (node, test) => {
    if (test(node)) return node
    for (const child of node.children || []) {
      const found = find(child, test)
      if (found) return found
    }
    return null
  }

  it('DMenuItem hands the whole route meta and the selector release to describe()', () => {
    const script = sfc('DMenuItem.vue').scriptSetup.content

    expect(script).toContain("import { versions } from 'virtual:docsector-books'")
    expect(script).toContain('const released = latestReleased(versions)')
    expect(script).toContain('describePageStatus(props.subitem?.meta, released)')
    expect(script).toContain('tooltip: t(chip.tooltip, { version: chip.version })')
  })

  it('DMenuItem binds each badge prop to its own chip field', () => {
    const badge = find(sfc('DMenuItem.vue').template.ast, node => node.tag === 'q-badge')

    expect(bindings(badge)).toEqual({
      'text-color': 'pageStatus.textColor',
      color: 'pageStatus.color',
      label: 'pageStatus.label'
    })
  })

  it('DMenu lists the versions in development above the selector entries', () => {
    const script = sfc('DMenu.vue').scriptSetup.content

    expect(script).toContain("import { current, unreleased } from './page-version-status.js'")
    expect(script).toContain('const currentVersionId = current(versions)')
    expect(script).toContain('unreleased(($router.options.routes || []).map(route => route?.meta), versions)')
    expect(script).toContain("badge: { label: t('menu.version.status.development'), color: 'info', textColor: 'white' }")
    expect(script).toContain('return development.concat(')
    // ? Choosing one opens the current docs
    expect(script).toMatch(/if \(developmentVersions\.includes\(versionId\)\) \{\s*versionId = currentVersionId/)
  })

  it('DPageBar lays out the release lines with timeline()', () => {
    const descriptor = sfc('DPageBar.vue')

    expect(descriptor.scriptSetup.content).toContain('const released = latestReleased(versions)')
    expect(descriptor.scriptSetup.content).toContain('timeline(route.meta, released)')
    expect(descriptor.template.content).toContain("{{ t(pageReleases.versionLabel) }}: {{ pageReleases.version }}")
    expect(descriptor.template.content).toContain("{{ t('page.updatedVersion') }}: {{ pageReleases.past }}")
    expect(descriptor.template.content).toContain("{{ t('page.updatingVersion') }}: {{ pageReleases.future }}")
  })
})

describe('page version chip — i18n keys', () => {
  const read = (locale) => Hjson.parse(readFileSync(new URL(`../src/i18n/languages/${locale}.hjson`, import.meta.url), 'utf-8'))
  const helpers = readFileSync(new URL('../src/i18n/helpers.js', import.meta.url), 'utf-8')
  const scaffold = readFileSync(new URL('../bin/docsector.js', import.meta.url), 'utf-8')

  it.each(['en-US', 'pt-BR'])('%s ships every chip and page bar key', (locale) => {
    const messages = read(locale)

    for (const kind of ['new', 'soon', 'updated', 'updating']) {
      expect(messages.menu.status[kind]._).toEqual(expect.any(String))
      expect(messages.menu.status[kind].tooltipVersion).toContain('{version}')
    }
    // ? The future-update tooltip moved from soon to updating
    expect(messages.menu.status.soon.tooltipUpdated).toBeUndefined()
    expect(messages.menu.version.status.development).toEqual(expect.any(String))
    for (const key of ['newVersion', 'updatedVersion', 'comingVersion', 'updatingVersion']) {
      expect(messages.page[key]).toEqual(expect.any(String))
    }
  })

  it.each([
    ['en-US', { soon: 'soon', updating: 'updating', updated: 'updated' }, 'Will be updated in {version}', 'in development'],
    ['pt-BR', { soon: 'em breve', updating: 'atualizando', updated: 'atualizado' }, 'Será atualizado na {version}', 'em desenvolvimento']
  ])('%s pins the chip labels it ships', (locale, labels, updatingTooltip, development) => {
    const messages = read(locale)

    for (const [kind, label] of Object.entries(labels)) {
      expect(messages.menu.status[kind]._).toBe(label)
    }
    expect(messages.menu.status.updating.tooltipVersion).toBe(updatingTooltip)
    expect(messages.menu.version.status.development).toBe(development)
  })

  it('keeps the removed soon.tooltipUpdated out of the defaults and the scaffold', () => {
    expect(helpers).not.toContain('tooltipUpdated')
    expect(scaffold).not.toContain('tooltipUpdated')
  })

  it('keeps the engine defaults and the scaffold in step', () => {
    for (const key of ["_: 'updating',", "_: 'atualizando',", "tooltipVersion: 'Will be updated in {version}'", "updatingVersion: 'Will be updated in'", "comingVersion: 'Coming in'"]) {
      expect(helpers).toContain(key)
    }
    expect(helpers).toContain("development: 'in development'")
    expect(helpers).toContain("development: 'em desenvolvimento'")
    for (const key of ["_: 'updating'", "tooltipVersion: 'Will be updated in {version}'", "updatingVersion: 'Will be updated in'", "development: 'in development'"]) {
      expect(scaffold).toContain(key)
    }
  })
})

describe('page version chip — third locale', () => {
  it('falls back to the en-US engine defaults instead of raw keys', async () => {
    const { buildMessages } = await import('../src/i18n/helpers.js')
    const messages = buildMessages({
      langModules: {
        './languages/en-US.hjson': { menu: { home: 'Home' } },
        './languages/es-ES.hjson': { menu: { home: 'Inicio', status: { new: { _: 'nuevo' } } } }
      },
      mdModules: {},
      books: {},
      boot: { meta: { 'en-US': {}, 'es-ES': {} } },
      langs: ['en-US', 'es-ES']
    })

    expect(messages['es-ES'].menu.status.new._).toBe('nuevo')
    expect(messages['es-ES'].menu.status.soon._).toBe('soon')
    expect(messages['es-ES'].menu.status.updating._).toBe('updating')
    expect(messages['es-ES'].page.updatedVersion).toBe('Updated in')
    // ? Cloned defaults: no locale shares an object with another
    expect(messages['es-ES'].menu.status.soon).not.toBe(messages['en-US'].menu.status.soon)
  })
})
