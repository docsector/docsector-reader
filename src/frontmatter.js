/**
 * Markdown frontmatter metadata.
 *
 * Pages may open with a Quasar-docs-compatible frontmatter block:
 *
 *   ---
 *   title: Ajax Bar
 *   desc: The QAjaxBar component displays a loading bar.
 *   keys: QAjaxBar loading
 *   related:
 *     - /quasar-plugins/loading
 *   ---
 *
 * The block exists ONLY when the very first line of the file is `---`; it
 * closes on a `---` (or `...`) line. An unclosed block is NOT frontmatter —
 * the whole source stays content. A `---` later in the document is a plain
 * thematic break and is never touched.
 *
 * Supported YAML subset (anything else warns and is skipped per line):
 *   key: scalar        — quoted strings, true/false, null/~, numbers,
 *                        anything else is a trimmed string; deeper-indented
 *                        lines below continue it (joined by a space, a
 *                        blank line keeps a line break)
 *   key: | or >        — a literal (|) or folded (>) block scalar: the
 *                        more-indented lines below, dedented (`-` strips the
 *                        final newline, `+` keeps every trailing one)
 *   key:               — followed by a one-level list of `- item` lines; an
 *                        item written `- name: value` (YAML: the colon is
 *                        followed by a space) is a map, continued by lines
 *                        indented to its first key, whose values may be
 *                        scalars or block scalars — the `faq:` form
 *   # comment / blank  — ignored
 *
 * Merge semantics against the `*.index.js` registry entry (per locale — each
 * `.md` file is one locale): a key present in both is OVERRIDDEN by the page;
 * a key present only in the page is MERGED in. `keys` is the exception: it
 * APPENDS to the registry search tags instead of replacing them. Frontmatter
 * in `showcase`/`vs` files may only override the title/description of their
 * own subpage (plus append `keys`); page-level keys are honored from the
 * `overview` file alone.
 */

const CLOSE_LINE = /^(---|\.\.\.)\s*$/
const KEY_LINE = /^([A-Za-z0-9_-]+):(.*)$/
const LIST_ITEM_LINE = /^(\s*-\s+)(.*)$/
// ? YAML map entry: the colon must be followed by a space or end the line —
//   `- http://x` stays a scalar
const MAP_ENTRY = /^([A-Za-z0-9_-]+):(?:[ \t]+(.*))?$/
const BLOCK_INDICATOR = /^([|>])([+-]?)$/
const NUMBER_VALUE = /^-?\d+(\.\d+)?$/

// Keys the page may never override. `book`/`type`: the file's own path decides
// them (honoring an in-page value would break the file↔page mapping). The
// structural blocks (`meta`, `data`, `metadata`, `subpageMeta`): a scalar from
// this parser would clobber an object the engine relies on.
const FORBIDDEN_KEYS = new Set(['book', 'type', 'meta', 'data', 'metadata', 'subpageMeta'])

// Config keys that only make sense as objects — this parser produces scalars
// and flat lists, so an in-page value can never be well-formed.
const OBJECT_ONLY_KEYS = new Set(['menu', 'subpages', 'link', 'layouts'])

// Localized keys — each locale file writes its own locale slot.
const LOCALIZED_KEYS = new Set(['title', 'desc', 'keys'])

// Content keys — rendered with the page (compiled into its tokens), never
// merged into the registry: they would ship every page's content in the boot
// bundle.
const CONTENT_KEYS = new Set(['faq'])

const SUBPAGES = ['overview', 'showcase', 'vs']

function warn (onWarning, message) {
  if (typeof onWarning === 'function') {
    onWarning(message)
  }
}

export function extractFrontmatterBlock (source) {
  const text = String(source ?? '').replace(/^\uFEFF/, '')
  const lines = text.split('\n')
  const first = (lines[0] ?? '').replace(/\r$/, '')

  if (first !== '---') {
    return null
  }

  for (let index = 1; index < lines.length; index++) {
    const line = lines[index].replace(/\r$/, '')

    if (CLOSE_LINE.test(line)) {
      return {
        raw: lines.slice(0, index + 1).join('\n'),
        bodyLines: lines.slice(1, index).map(bodyLine => bodyLine.replace(/\r$/, '')),
        content: lines.slice(index + 1).join('\n')
      }
    }
  }

  // ? Unclosed block — not frontmatter, the whole source is content
  return null
}

export function stripFrontmatter (source) {
  const block = extractFrontmatterBlock(source)
  return block === null ? String(source ?? '') : block.content
}

function parseScalar (value) {
  const trimmed = value.trim()

  if (trimmed === '' ) return null
  if (trimmed === 'null' || trimmed === '~') return null
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (NUMBER_VALUE.test(trimmed)) return Number(trimmed)

  const quote = trimmed[0]
  if ((quote === '"' || quote === "'") && trimmed.length >= 2 && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

const isBlank = (line) => line.trim() === '' || line.trim().startsWith('#')
const indentOf = (line) => line.length - line.trimStart().length

// : a block scalar starting at `start` — every following line that is blank or
//   indented deeper than `parentIndent`, dedented by its first line's indent
function readBlockScalar (lines, start, parentIndent, style, chomp) {
  const collected = []
  let index = start

  // @@ Collect the block
  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() !== '' && indentOf(line) <= parentIndent) break
    collected.push(line)
    index++
  }

  // ? trailing blank lines are chomping material, not content
  let trailing = 0
  while (collected.length > 0 && collected[collected.length - 1].trim() === '') {
    collected.pop()
    trailing++
  }

  const first = collected.find(line => line.trim() !== '')
  const blockIndent = first === undefined ? 0 : indentOf(first)
  const body = collected.map(line => (line.trim() === '' ? '' : line.slice(Math.min(blockIndent, indentOf(line)))))

  let value
  if (style === '|') {
    value = body.join('\n')
  } else {
    // ? folded: lines of a paragraph join with a space, blank lines break paragraphs
    value = body.reduce((text, line, position) => {
      if (position === 0) return line
      if (line === '') return `${text}\n`
      return text.endsWith('\n') || text === '' ? `${text}${line}` : `${text} ${line}`
    }, '')
  }

  if (value !== '') {
    if (chomp === '+') value += '\n'.repeat(trailing + 1)
    else if (chomp !== '-') value += '\n'
  }

  return { value, next: index }
}

// : a scalar or block-scalar value after `key:` — `next` is the first line
//   after it
function readValue (rest, lines, index, parentIndent) {
  const trimmed = rest.trim()
  const block = trimmed.match(BLOCK_INDICATOR)
  if (block !== null) {
    return readBlockScalar(lines, index + 1, parentIndent, block[1], block[2])
  }

  // ? Multi-line plain (or quoted) scalar: deeper-indented lines continue the
  //   value — joined by a space, blank lines between them kept as breaks. A
  //   comment line or one at the parent indent ends it.
  let text = trimmed
  let next = index + 1
  let breaks = 0

  // @@ Continuation lines
  for (let cursor = index + 1; cursor < lines.length; cursor++) {
    const line = lines[cursor]

    if (line.trim() === '') {
      breaks++
      continue
    }
    if (indentOf(line) <= parentIndent || line.trimStart().startsWith('#')) break

    const separator = text === '' ? '' : (breaks > 0 ? '\n'.repeat(breaks) : ' ')
    text = `${text}${separator}${line.trim()}`
    breaks = 0
    next = cursor + 1
  }

  return { value: parseScalar(text), next }
}

// : one `- name: value` list item and its continuation lines, as a map
function readMapItem (lines, index, onWarning) {
  const [, marker, content] = lines[index].match(LIST_ITEM_LINE)
  const keyIndent = marker.length
  const item = {}
  let entry = content.match(MAP_ENTRY)
  let cursor = index

  // @@ Entries of this item: the first one, then lines at the key indent
  while (entry !== null) {
    const { value, next } = readValue(entry[2] ?? '', lines, cursor, keyIndent)
    item[entry[1]] = value
    cursor = next
    entry = null

    let peek = cursor
    while (peek < lines.length && isBlank(lines[peek])) peek++
    const line = lines[peek]
    if (line === undefined || indentOf(line) !== keyIndent || LIST_ITEM_LINE.test(line)) break

    entry = line.trimStart().match(MAP_ENTRY)
    if (entry === null) {
      warn(onWarning, `unsupported frontmatter line "${line.trim()}" — ignored`)
      cursor = peek + 1
      break
    }
    cursor = peek
  }

  return { item, next: cursor }
}

export function parseFrontmatter (source, { onWarning } = {}) {
  const block = extractFrontmatterBlock(source)

  if (block === null) {
    return { data: null, content: String(source ?? ''), raw: '', spans: {}, ranges: [] }
  }

  const lines = block.bodyLines
  const data = {}
  // ! [first, last] body-line index of every top-level key (last non-blank
  //   line of its region) — `spans` holds the occurrence that won, `ranges`
  //   every occurrence in order (a duplicated key leaves more than one)
  const spans = {}
  const ranges = []
  let index = 0

  const record = (key, start, last) => {
    if (key in spans) {
      warn(onWarning, `duplicate key "${key}" — the last one wins`)
    }
    spans[key] = [start, last]
    ranges.push({ key, start, end: last })
  }

  // @@ Top-level keys
  while (index < lines.length) {
    const line = lines[index]

    if (isBlank(line)) {
      index++
      continue
    }

    const keyed = /^\s/.test(line) ? null : line.match(KEY_LINE)
    if (keyed === null) {
      warn(onWarning, `unsupported frontmatter line "${line.trim()}" — ignored`)
      index++
      continue
    }

    const key = keyed[1]
    const rest = keyed[2]
    const start = index
    let last = index

    if (rest.trim() !== '') {
      const { value, next } = readValue(rest, lines, index, 0)
      data[key] = value
      for (let cursor = index; cursor < next; cursor++) {
        if (lines[cursor].trim() !== '') last = cursor
      }
      index = next
      record(key, start, last)
      continue
    }

    // ! bare `key:` — a list may follow; anything else is unsupported
    const items = []
    index++

    // @@ List items (blank and comment lines allowed between them)
    while (index < lines.length) {
      const item = lines[index]

      if (isBlank(item)) {
        index++
        continue
      }
      if (!/^\s/.test(item) && !LIST_ITEM_LINE.test(item)) break

      const listed = item.match(LIST_ITEM_LINE)
      if (listed === null) {
        // ? still this key's region — a rewrite that drops the key drops it too
        warn(onWarning, `unsupported frontmatter line "${item.trim()}" — ignored`)
        last = index
        index++
        continue
      }

      if (MAP_ENTRY.test(listed[2])) {
        const { item: map, next } = readMapItem(lines, index, onWarning)
        items.push(map)
        for (let cursor = index; cursor < next; cursor++) {
          if (lines[cursor].trim() !== '') last = cursor
        }
        index = next
      } else {
        items.push(parseScalar(listed[2]))
        last = index
        index++
      }
    }

    if (items.length > 0) {
      data[key] = items
      record(key, start, last)
    } else {
      warn(onWarning, `key "${key}" has no supported value (nested maps are not supported) — ignored`)
    }
  }

  return { data, content: block.content, raw: block.raw, spans, ranges }
}

// : what of a file's frontmatter the page registry depends on, as a string —
//   content keys (`faq`) excluded, so editing them never restarts the dev
//   server; null when the file has no block
export function fingerprintFrontmatter (data) {
  if (data === null || data === undefined) return null

  const registryData = Object.fromEntries(Object.entries(data).filter(([key]) => !CONTENT_KEYS.has(key)))

  return JSON.stringify(registryData)
}

export function mergeTagTerms (existing = '', added = '') {
  const seen = new Set()
  const terms = []

  for (const source of [existing, added]) {
    for (const term of String(source ?? '').split(/[\s,]+/)) {
      if (term === '' || seen.has(term)) continue
      seen.add(term)
      terms.push(term)
    }
  }

  return terms.join(' ')
}

function joinTermList (value) {
  return Array.isArray(value) ? value.join(' ') : String(value ?? '')
}

// ? title/desc accept what an author plausibly writes unquoted — strings and
//   numbers (`title: 42`); anything else is not text and is dropped with a warn
function toText (value) {
  // ? block scalars (`title: |`) end with a line break a <title> must not keep
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return ''
}

// : the page FAQ as `[{ question, answer }]` — only items whose `q` and `a` are
//   text (strings, or numbers an author wrote unquoted); the rest warn
export function normalizePageFaq (value, { onWarning } = {}) {
  if (value === undefined || value === null) return []

  if (!Array.isArray(value)) {
    warn(onWarning, 'key "faq" must be a list of `- q: … a: …` items — ignored')
    return []
  }

  const items = []
  value.forEach((entry, position) => {
    const isMap = entry !== null && typeof entry === 'object' && !Array.isArray(entry)
    const question = isMap ? toText(entry.q).trim() : ''
    const answer = isMap ? toText(entry.a).trim() : ''

    if (question === '' || answer === '') {
      warn(onWarning, `faq item ${position + 1} needs a text "q" and "a" — ignored`)
      return
    }

    items.push({ question, answer })
  })

  return items
}

// ? Public read of a subpage title/description override, shared by the layout,
//   the prerender plugin and the build emitters. Same fallback chain as every
//   other locale map in the engine.
export function resolveSubpageMeta (subpageMeta, subpage, locale) {
  const byLocale = subpageMeta?.[subpage]

  if (!byLocale || typeof byLocale !== 'object') {
    return null
  }

  return byLocale[locale] || byLocale['*'] || byLocale['en-US'] || Object.values(byLocale)[0] || null
}

function liftLocaleMap (value) {
  if (value && typeof value === 'object') return { ...value }
  if (typeof value === 'string' && value !== '') return { '*': value }
  return {}
}

/**
 * Compile parsed frontmatter for one page into a compact patch.
 *
 * `fmBySubpage` is `{ overview?: { locale: data }, showcase?: {...}, vs?: {...} }`.
 * The split matters: compiling runs in Node (build / dev server / registry
 * load), where warnings belong; applying is small enough to inline into the
 * generated `virtual:docsector-books` module, so the client never carries the
 * validation logic.
 *
 * Patch shape (only non-empty slots present):
 *   { titleByLocale, descByLocale, tagsByLocale, configPatch, subpageMeta }
 */
export function compileFrontmatterPatch (fmBySubpage, { defaultLang = 'en-US', onWarning } = {}) {
  if (!fmBySubpage) return null

  const titleByLocale = {}
  const descByLocale = {}
  const tagsByLocale = {}
  const configPatch = {}
  const subpageMeta = {}

  const appendTags = (locale, keys) => {
    const terms = joinTermList(keys)
    if (terms.trim() === '') return
    tagsByLocale[locale] = mergeTagTerms(tagsByLocale[locale], terms)
  }

  // @ overview — localized keys
  for (const [locale, fm] of Object.entries(fmBySubpage.overview || {})) {
    if (!fm) continue

    for (const key of ['title', 'desc']) {
      if (fm[key] === undefined) continue

      const text = toText(fm[key])
      if (text === '') {
        warn(onWarning, `key "${key}" (${locale}) is not text — ignored`)
        continue
      }

      if (key === 'title') titleByLocale[locale] = text
      else descByLocale[locale] = text
    }

    if (fm.keys !== undefined) {
      appendTags(locale, fm.keys)
    }
  }

  // @ overview — page-level keys: the default-language file wins, then the
  //   first locale that defines the key; conflicting values warn
  const pageLevelSources = Object.entries(fmBySubpage.overview || {})
    .sort(([localeA], [localeB]) => {
      if (localeA === defaultLang) return -1
      if (localeB === defaultLang) return 1
      return 0
    })

  for (const [locale, fm] of pageLevelSources) {
    if (!fm) continue

    for (const [key, value] of Object.entries(fm)) {
      if (LOCALIZED_KEYS.has(key)) continue

      if (CONTENT_KEYS.has(key)) {
        // ? validated here only for the build warnings — the page compile renders it
        normalizePageFaq(value, { onWarning: message => warn(onWarning, `${message} (${locale})`) })
        continue
      }

      if (FORBIDDEN_KEYS.has(key)) {
        warn(onWarning, `key "${key}" cannot be set from frontmatter — ignored`)
        continue
      }

      if (OBJECT_ONLY_KEYS.has(key)) {
        warn(onWarning, `key "${key}" needs an object value, which frontmatter cannot express — ignored`)
        continue
      }

      if (key in configPatch) {
        if (JSON.stringify(configPatch[key]) !== JSON.stringify(value)) {
          warn(onWarning, `key "${key}" differs between locale files (${locale}) — the ${defaultLang} value wins`)
        }
        continue
      }

      configPatch[key] = value
    }
  }

  // @ showcase / vs — only their own title/description (+ keys append)
  for (const subpage of ['showcase', 'vs']) {
    for (const [locale, fm] of Object.entries(fmBySubpage[subpage] || {})) {
      if (!fm) continue

      for (const [key, value] of Object.entries(fm)) {
        if (CONTENT_KEYS.has(key)) {
          normalizePageFaq(value, { onWarning: message => warn(onWarning, `${message} (${subpage}, ${locale})`) })
        } else if (key === 'keys') {
          appendTags(locale, value)
        } else if (key === 'title' || key === 'desc') {
          const text = toText(value)
          if (text === '') continue
          const byLocale = subpageMeta[subpage] || (subpageMeta[subpage] = {})
          const slot = byLocale[locale] || (byLocale[locale] = {})
          slot[key === 'desc' ? 'description' : 'title'] = text
        } else {
          warn(onWarning, `key "${key}" in a ${subpage} file only applies from the overview file — ignored`)
        }
      }
    }
  }

  const patch = {}
  if (Object.keys(titleByLocale).length > 0) patch.titleByLocale = titleByLocale
  if (Object.keys(descByLocale).length > 0) patch.descByLocale = descByLocale
  if (Object.keys(tagsByLocale).length > 0) patch.tagsByLocale = tagsByLocale
  if (Object.keys(configPatch).length > 0) patch.configPatch = configPatch
  if (Object.keys(subpageMeta).length > 0) patch.subpageMeta = subpageMeta

  return Object.keys(patch).length > 0 ? patch : null
}

/**
 * Apply a compiled patch to one registry page entry.
 *
 * Returns a NEW page object (the registry entries come from imported modules
 * shared across HMR — they are never mutated), or the same reference when
 * there is nothing to apply. This function is mirrored inline inside the
 * generated `virtual:docsector-books` module — keep the two in sync.
 */
export function applyFrontmatterPatch (page, patch) {
  if (!page || page.config === null || !patch) {
    return page
  }

  const config = { ...page.config, ...(patch.configPatch || {}) }
  const data = { ...page.data }
  const metadata = { ...page.metadata }

  for (const [locale, title] of Object.entries(patch.titleByLocale || {})) {
    data[locale] = { ...(data[locale] || {}), title }
  }

  if (patch.descByLocale) {
    const meta = { ...(config.meta || {}) }
    meta.description = { ...liftLocaleMap(meta.description), ...patch.descByLocale }
    config.meta = meta
  }

  if (patch.tagsByLocale) {
    const tags = { ...(metadata.tags || {}) }
    for (const [locale, terms] of Object.entries(patch.tagsByLocale)) {
      tags[locale] = mergeTagTerms(tags[locale], terms)
    }
    metadata.tags = tags
  }

  const merged = { ...page, config, data, metadata }
  if (patch.subpageMeta) {
    // ? deep merge per subpage per locale — a patch that only sets pt-BR must
    //   not wipe a registry-declared en-US slot (nor its sibling fields)
    const subpageMeta = { ...(page.subpageMeta || {}) }
    for (const [subpage, byLocale] of Object.entries(patch.subpageMeta)) {
      const locales = { ...(subpageMeta[subpage] || {}) }
      for (const [locale, slot] of Object.entries(byLocale)) {
        locales[locale] = { ...(locales[locale] || {}), ...slot }
      }
      subpageMeta[subpage] = locales
    }
    merged.subpageMeta = subpageMeta
  }
  return merged
}

/**
 * Merge parsed frontmatter into one registry page entry (compile + apply).
 */
export function mergePageFrontmatter (page, fmBySubpage, { defaultLang = 'en-US', onWarning } = {}) {
  if (page?.config === null && fmBySubpage && Object.keys(fmBySubpage).length > 0) {
    warn(onWarning, 'frontmatter on a category entry (config: null) — ignored')
    return page
  }

  const patch = compileFrontmatterPatch(fmBySubpage, { defaultLang, onWarning })
  return patch === null ? page : applyFrontmatterPatch(page, patch)
}

/**
 * Apply a collected frontmatter overlay to one book's routes object.
 *
 * `overlayForVersion` is keyed by `/<book><pagePath>` (the same key space as
 * search tags) and holds raw `fmBySubpage` objects. Returns the same object
 * reference when nothing changed.
 */
export function applyFrontmatterOverlayToRoutes (routes, overlayForVersion, fallbackBook, defaultLang, onWarning) {
  if (!routes || !overlayForVersion || Object.keys(overlayForVersion).length === 0) {
    return routes
  }

  let changed = false
  const next = {}

  for (const [pagePath, page] of Object.entries(routes)) {
    const book = page?.config?.book ?? page?.config?.type ?? fallbackBook
    const pageKey = `/${book}${pagePath}`
    const fmBySubpage = overlayForVersion[pageKey]

    if (!fmBySubpage) {
      next[pagePath] = page
      continue
    }

    const pageWarning = typeof onWarning === 'function'
      ? message => onWarning(`${pageKey}: ${message}`)
      : undefined
    const merged = mergePageFrontmatter(page, fmBySubpage, { defaultLang, onWarning: pageWarning })
    next[pagePath] = merged
    if (merged !== page) changed = true
  }

  return changed ? next : routes
}

export const FRONTMATTER_SUBPAGES = SUBPAGES
