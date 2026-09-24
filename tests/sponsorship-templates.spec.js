import { readFileSync } from 'node:fs'

import { babelParse, parse, walk } from 'vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

// ! Template pins over the parsed SFC AST (no Vue plugin needed). Every lookup
//   asserts that its node exists first, so a missing element fails loudly
//   instead of letting a negative check pass on nothing.
const ELEMENT = 1
const TEXT = 2
const COMMENT = 3
const INTERPOLATION = 5
const ATTRIBUTE = 6
const DIRECTIVE = 7

const readComponent = (file) => readFileSync(new URL(`../src/components/${file}`, import.meta.url), 'utf-8')

const templateOf = (file) => {
  const { descriptor, errors } = parse(readComponent(file))
  expect(errors).toEqual([])
  return descriptor.template.ast
}

const childElements = (node) => (node.children || []).filter(child => child.type === ELEMENT)

const findAll = (root, predicate) => {
  const found = []
  const visit = (node) => {
    for (const child of childElements(node)) {
      if (predicate(child)) found.push(child)
      visit(child)
    }
  }
  visit(root)
  return found
}

const find = (root, predicate, description) => {
  const [first] = findAll(root, predicate)
  expect(first, `missing ${description}`).toBeDefined()
  return first
}

const staticAttr = (node, name) => node.props.find(prop => prop.type === ATTRIBUTE && prop.name === name)?.value?.content

const directive = (node, name, arg) => node.props.find(prop =>
  prop.type === DIRECTIVE && prop.name === name && (arg === undefined || prop.arg?.content === arg)
)

const hasClass = (node, className) => (staticAttr(node, 'class') || '').split(/\s+/).includes(className)

describe('DPageAnchor keeps the tree in the flow', () => {
  it('renders the q-tree with a static margin class and no class binding', () => {
    const tree = find(templateOf('DPageAnchor.vue'), node => node.tag === 'q-tree', 'q-tree')

    expect(staticAttr(tree, 'class')).toBe('q-ma-xs')
    expect(directive(tree, 'bind', 'class')).toBeUndefined()
  })
})

const nextElement = (parent, node) => {
  const siblings = childElements(parent)
  return siblings[siblings.indexOf(node) + 1]
}

const hasAnyId = (node) => Boolean(staticAttr(node, 'id') !== undefined || directive(node, 'bind', 'id'))

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

describe('sponsors placement', () => {
  it('sits right after the ToC tree in the desktop rail', () => {
    const toc = find(templateOf('DPage.vue'), node => hasClass(node, 'd-right-rail__toc'), '.d-right-rail__toc')
    const [tree] = childElements(toc)

    expect(tree.tag).toBe('d-page-anchor')
    expect(staticAttr(tree, 'id')).toBe('anchor')

    const sponsors = nextElement(toc, tree)
    expect(sponsors?.tag).toBe('d-page-sponsors')
    expect(directive(sponsors, 'if')).toBeDefined()
    expect(directive(sponsors, 'bind', 'sponsors')).toBeDefined()
  })

  it('follows the tree in the mobile ToC dialog, outside #anchor', () => {
    const dialog = find(templateOf('DPage.vue'), node => node.tag === 'q-dialog' && hasClass(node, 'd-mobile-anchor-dialog'), 'mobile ToC dialog')
    const panel = find(dialog, node => hasClass(node, 'd-mobile-anchor-dialog__panel'), 'mobile ToC panel')

    expect(hasAnyId(panel)).toBe(false)
    expect(directive(panel, 'bind', 'class')).toBeDefined()

    const [wrapper, sponsors] = childElements(panel)
    expect(staticAttr(wrapper, 'id')).toBe('anchor')
    expect(childElements(wrapper).map(node => node.tag)).toEqual(['d-page-anchor'])
    expect(findAll(wrapper, node => node.tag === 'd-page-sponsors')).toEqual([])

    expect(sponsors?.tag).toBe('d-page-sponsors')
    expect(directive(sponsors, 'if')).toBeDefined()
  })
})

describe('DPageSponsors template', () => {
  const root = templateOf('DPageSponsors.vue')

  it('carries no ids, headings or <b> that could collide with the ToC', () => {
    expect(findAll(root, node => node.tag === 'section')).toHaveLength(1)
    expect(findAll(root, hasAnyId)).toEqual([])
    expect(findAll(root, node => HEADINGS.has(node.tag) || node.tag === 'b')).toEqual([])
  })

  it('opens the title with the heart the menu uses for sponsoring, before the text', () => {
    const title = find(root, node => hasClass(node, 'd-page-sponsors__title'), 'panel title')
    // ? comments and whitespace-only text are layout, not content
    const content = title.children.filter(node => node.type !== COMMENT && !(node.type === TEXT && node.content.trim() === ''))
    const [heart, text] = content

    expect(heart?.tag).toBe('q-icon')
    expect(staticAttr(heart, 'name')).toBe('favorite')
    expect(staticAttr(heart, 'color')).toBe('red')
    expect(text?.type).toBe(INTERPOLATION)
    expect(text.content.content.replace(/\s+/g, '')).toBe("t('page.sponsors.title')")
    expect(content).toHaveLength(2)
  })

  it('marks sponsor links as sponsored and opens them in a new tab', () => {
    const tiles = findAll(root, node => node.tag === 'a' && hasClass(node, 'd-page-sponsors__tile') && !hasClass(node, 'd-page-sponsors__tile--example'))

    expect(tiles).toHaveLength(1)
    expect(staticAttr(tiles[0], 'target')).toBe('_blank')
    expect(staticAttr(tiles[0], 'rel')).toBe('sponsored noopener')
  })

  it('binds the fallback link attributes on the example slot and the button', () => {
    const fallbackLinks = findAll(root, node => node.tag === 'a' && (hasClass(node, 'd-page-sponsors__tile--example') || hasClass(node, 'd-page-sponsors__cta')))

    expect(fallbackLinks).toHaveLength(2)
    for (const link of fallbackLinks) {
      expect(link.props.some(prop => prop.type === DIRECTIVE && prop.name === 'bind' && !prop.arg)).toBe(true)
      expect(staticAttr(link, 'rel')).toBeUndefined()
      expect(directive(link, 'bind', 'href')).toBeDefined()
    }
  })

  it('reserves every logo box and loads logos lazily', () => {
    const images = findAll(root, node => node.tag === 'img')

    expect(images).toHaveLength(2)
    for (const image of images) {
      expect(directive(image, 'bind', 'alt')).toBeDefined()
      expect(directive(image, 'bind', 'width')).toBeDefined()
      expect(directive(image, 'bind', 'height')).toBeDefined()
      expect(staticAttr(image, 'loading')).toBe('lazy')
      expect(staticAttr(image, 'decoding')).toBe('async')
    }
  })
})

describe('page ad placement and template', () => {
  it('sits between the page header and the content in every subpage', () => {
    const page = find(templateOf('DSubpage.vue'), node => node.tag === 'd-page', 'd-page')
    const tags = childElements(page).map(node => node.tag)
    const ad = childElements(page).find(node => node.tag === 'd-page-ad')

    expect(tags).toEqual(['header', 'd-page-ad', 'main'])
    expect(directive(ad, 'if')).toBeDefined()
    expect(directive(ad, 'bind', 'ad')).toBeDefined()
  })

  it('carries no ids, headings or <b>', () => {
    const root = templateOf('DPageAd.vue')

    expect(findAll(root, node => node.tag === 'aside')).toHaveLength(1)
    expect(findAll(root, hasAnyId)).toEqual([])
    expect(findAll(root, node => HEADINGS.has(node.tag) || node.tag === 'b')).toEqual([])
  })

  it('binds the link attributes per ad kind', () => {
    const link = find(templateOf('DPageAd.vue'), node => node.tag === 'a' && hasClass(node, 'd-page-ad__link'), 'ad link')

    expect(link.props.some(prop => prop.type === DIRECTIVE && prop.name === 'bind' && !prop.arg)).toBe(true)
    expect(staticAttr(link, 'rel')).toBeUndefined()
    expect(staticAttr(link, 'target')).toBeUndefined()
  })

  it('loads the ad image eagerly in a fixed box', () => {
    const image = find(templateOf('DPageAd.vue'), node => node.tag === 'img', 'ad image')

    expect(staticAttr(image, 'alt')).toBe('')
    expect(staticAttr(image, 'width')).toBe('128')
    expect(staticAttr(image, 'height')).toBe('96')
    expect(staticAttr(image, 'decoding')).toBe('async')
    expect(staticAttr(image, 'loading')).toBeUndefined()
    expect(directive(image, 'bind', 'loading')).toBeUndefined()
  })
})

describe('SSR purity', () => {
  const FORBIDDEN_IDENTIFIERS = new Set(['Date', 'window', 'document', 'localStorage', 'sessionStorage', 'useSsrSafeDark'])

  const scriptOf = (file) => {
    if (file.endsWith('.vue')) {
      const { descriptor } = parse(readComponent(file))
      expect(descriptor.scriptSetup?.content, `missing <script setup> in ${file}`).toBeTruthy()
      return descriptor.scriptSetup.content
    }
    return readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf-8')
  }

  const offenders = (source) => {
    const found = []
    walk(babelParse(source, { sourceType: 'module' }), {
      enter (node) {
        if (node.type === 'Identifier' && FORBIDDEN_IDENTIFIERS.has(node.name)) found.push(node.name)
        if (node.type === 'MemberExpression' && node.object?.name === 'Math' && node.property?.name === 'random') found.push('Math.random')
      }
    })
    return found
  }

  it.each(['DPageSponsors.vue', 'DPageAd.vue', 'sponsors/config.js', 'ads/config.js', 'hash.js', 'asset-url.js', 'i18n/locale-map.js'])('%s renders the same on the server and the client', (file) => {
    const source = scriptOf(file)

    expect(source.length).toBeGreaterThan(0)
    expect(offenders(source)).toEqual([])
  })
})

// ! Expression and script pins — the wiring and bindings the placement pins
//   cannot see (a `v-if` that exists but tests the wrong thing, a bound object
//   that is not the per-kind helper)
const compact = (value) => String(value ?? '').replace(/\s+/g, '')
const expressionOf = (node, name, arg) => compact(directive(node, name, arg)?.exp?.content)
const spreadOf = (node) => compact(node.props.find(prop => prop.type === DIRECTIVE && prop.name === 'bind' && !prop.arg)?.exp?.content)

const scriptSetupOf = (file) => {
  const { descriptor } = parse(readComponent(file))
  expect(descriptor.scriptSetup?.content, `missing <script setup> in ${file}`).toBeTruthy()
  return descriptor.scriptSetup.content
}

// : `name` → the source of its initializer, for every const/let in the script
const declarationsOf = (source) => {
  const found = {}
  walk(babelParse(source, { sourceType: 'module' }), {
    enter (node) {
      if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.init) {
        found[node.id.name] = compact(source.slice(node.init.start, node.init.end))
      }
    }
  })
  return found
}

// : the argument sources of every call to `callee` in the script
const callsOf = (source, callee) => {
  const found = []
  walk(babelParse(source, { sourceType: 'module' }), {
    enter (node) {
      if (node.type === 'CallExpression' && node.callee?.name === callee) {
        found.push(node.arguments.map(argument => compact(source.slice(argument.start, argument.end))))
      }
    }
  })
  return found
}

describe('wiring — scripts', () => {
  it('normalizes the sponsors in DPage from the static config', () => {
    expect(declarationsOf(scriptSetupOf('DPage.vue')).sponsors).toBe('normalizeSponsorsConfig(docsectorConfig)')
  })

  it('picks the ad in DSubpage from the static config and the route, keeping the raw-path id', () => {
    const declarations = declarationsOf(scriptSetupOf('DSubpage.vue'))

    expect(declarations.ads).toBe('normalizeAdsConfig(docsectorConfig)')
    expect(declarations.ad).toBe('computed(()=>resolvePageAd(ads,route))')
    expect(declarations.id).toBe('computed(()=>hashString(route.path))')
  })

  it('binds the per-kind link helpers in both components', () => {
    expect(declarationsOf(scriptSetupOf('DPageSponsors.vue')).fallbackAttrs).toBe('computed(()=>resolveFallbackLinkAttrs(props.sponsors.fallback))')
    expect(declarationsOf(scriptSetupOf('DPageAd.vue')).linkAttrs).toBe('computed(()=>resolveAdLinkAttrs(props.ad))')
  })

  it('resolves locale maps with the reader locale in every migrated caller', () => {
    for (const [file, source] of [['DFooter.vue', scriptSetupOf('DFooter.vue')], ['DPageAd.vue', scriptSetupOf('DPageAd.vue')]]) {
      const calls = callsOf(source, 'resolveLocaleMap')
      expect(calls.length, `resolveLocaleMap calls in ${file}`).toBeGreaterThan(0)
      for (const [, localeArgument] of calls) {
        expect(localeArgument).toBe('locale.value')
      }
    }

    const layout = readFileSync(new URL('../src/layouts/DefaultLayout.vue', import.meta.url), 'utf-8')
    const { descriptor } = parse(layout)
    const layoutCalls = callsOf(descriptor.scriptSetup.content, 'resolveLocaleMap')
    expect(layoutCalls.length).toBeGreaterThan(0)
    for (const [, localeArgument] of layoutCalls) {
      expect(localeArgument).toBe('locale.value')
    }
  })
})

describe('wiring — template expressions', () => {
  it('gates the sponsors on their visibility in the rail and the dialog', () => {
    const page = templateOf('DPage.vue')
    const sponsors = findAll(page, node => node.tag === 'd-page-sponsors')
    const panel = find(page, node => hasClass(node, 'd-mobile-anchor-dialog__panel'), 'mobile ToC panel')

    expect(sponsors).toHaveLength(2)
    for (const node of sponsors) {
      expect(expressionOf(node, 'if')).toBe('sponsors.visible')
      expect(expressionOf(node, 'bind', 'sponsors')).toBe('sponsors')
    }
    expect(expressionOf(panel, 'bind', 'class')).toBe("{'d-mobile-anchor-dialog__panel--sponsored':sponsors.visible}")
  })

  it('renders the ad only when a route has one', () => {
    const ad = find(templateOf('DSubpage.vue'), node => node.tag === 'd-page-ad', 'd-page-ad')

    expect(expressionOf(ad, 'if')).toBe('ad')
    expect(expressionOf(ad, 'bind', 'ad')).toBe('ad')
  })

  it('binds the per-kind link attributes on every self link and the ad link', () => {
    const sponsors = templateOf('DPageSponsors.vue')
    const fallbackLinks = findAll(sponsors, node => node.tag === 'a' && (hasClass(node, 'd-page-sponsors__tile--example') || hasClass(node, 'd-page-sponsors__cta')))
    const adLink = find(templateOf('DPageAd.vue'), node => node.tag === 'a' && hasClass(node, 'd-page-ad__link'), 'ad link')

    expect(fallbackLinks).toHaveLength(2)
    for (const link of fallbackLinks) {
      expect(spreadOf(link)).toBe('fallbackAttrs')
      expect(expressionOf(link, 'bind', 'href')).toBe('sponsors.fallback')
    }
    expect(spreadOf(adLink)).toBe('linkAttrs')
    expect(expressionOf(adLink, 'bind', 'href')).toBe('ad.href')
  })

  it('renders the engine layouts as CSS custom properties and swaps dark logos by class', () => {
    const root = templateOf('DPageSponsors.vue')
    const tier = find(root, node => node.tag === 'ul' && hasClass(node, 'd-page-sponsors__tier'), 'tier list')
    const tile = find(root, node => node.tag === 'a' && hasClass(node, 'd-page-sponsors__tile') && !hasClass(node, 'd-page-sponsors__tile--example'), 'sponsor tile')
    const darkLogo = find(root, node => node.tag === 'img' && hasClass(node, 'd-page-sponsors__logo--dark'), 'dark logo')
    const example = find(root, node => node.tag === 'li' && findAll(node, child => hasClass(child, 'd-page-sponsors__tile--example')).length === 1, 'example slot item')
    const cta = find(root, node => node.tag === 'a' && hasClass(node, 'd-page-sponsors__cta'), 'CTA')

    expect(expressionOf(tier, 'bind', 'style')).toBe("{'--d-page-sponsors-columns':tier.columns,'--d-page-sponsors-ratio':tier.ratio}")
    expect(expressionOf(tile, 'bind', 'class')).toBe("{'d-page-sponsors__tile--dual':item.logoDark}")
    expect(expressionOf(darkLogo, 'if')).toBe('item.logoDark')
    expect(expressionOf(darkLogo, 'bind', 'src')).toBe('item.logoDark')
    expect(expressionOf(example, 'if')).toBe('tier.example')
    expect(expressionOf(cta, 'if')).toBe('sponsors.fallback')
  })
})
