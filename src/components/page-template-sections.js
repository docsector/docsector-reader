const stripHtml = (value) => String(value ?? '').replace(/<[^>]*>/g, '')

/**
 * Normalize a heading/key into a comparable slug: strip HTML and diacritics,
 * lowercase, and collapse non-alphanumerics into single hyphens.
 */
const normalizeKey = (value) => stripHtml(value)
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const warnUnknownSection = (templateName, heading, allowed) => {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(
      `[docsector] Unknown "${templateName}" template section: "${heading}". ` +
      `Allowed sections: ${allowed.join(', ')}.`
    )
  }
}

// ? Comparison marks colorized in rendered content (✓ yes, ✗ no, ➕ add-on)
const MARK_CLASS = { '✓': 'vs-mark--yes', '✗': 'vs-mark--no', '➕': 'vs-mark--dep' }
const MARKABLE_TAGS = new Set(['p', 'table', 'ul', 'ol'])
const MARK_PATTERN = /[✓✗➕]/

const colorizeMarks = (html) => String(html ?? '').replace(
  /[✓✗➕]/g,
  (glyph) => `<span class="vs-mark ${MARK_CLASS[glyph]}">${glyph}</span>`
)

// ? Detect tables whose 2nd header matches the consumer-configured highlight column
const isHighlightColumnTable = (html, label) => {
  if (!label) {
    return false
  }

  const header = html.match(/<thead[\s\S]*?<\/thead>/i)?.[0] ?? html.match(/<tr[\s\S]*?<\/tr>/i)?.[0] ?? ''
  const cells = [...header.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(cell => cell[1].replace(/<[^>]*>/g, '').trim())

  return cells[1] === label
}

// ? Class flagging the body row whose first cell matches the highlight label (horizontal)
const HIGHLIGHT_ROW_CLASS = 'vs-row'

// @ Inject the highlight class into the body <tr> whose first cell equals the label.
//   Header rows (containing <th>) are skipped, so this composes with column highlight
//   without overlapping. The class is added into token.content because the <tr> lives
//   there (unlike the <table> element, which DPageTokens creates).
const highlightMatchingRow = (html, label) => {
  if (!label) {
    return html
  }

  return String(html).replace(/<tr(\s[^>]*)?>([\s\S]*?)<\/tr>/gi, (row, attrs = '', inner) => {
    if (/<th[\s>]/i.test(inner)) {
      return row
    }

    const firstCell = inner.match(/<td[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? ''
    if (stripHtml(firstCell).trim() !== label) {
      return row
    }

    return /\bclass\s*=/.test(attrs)
      ? `<tr${attrs.replace(/class\s*=\s*(["'])([\s\S]*?)\1/i, (m, quote, value) => `class=${quote}${value} ${HIGHLIGHT_ROW_CLASS}${quote}`)}>${inner}</tr>`
      : `<tr${attrs} class="${HIGHLIGHT_ROW_CLASS}">${inner}</tr>`
  })
}

const transformToken = (token, highlightColumn, highlightRow) => {
  if (!token || typeof token.content !== 'string') {
    return token
  }

  let content = token.content
  if (MARKABLE_TAGS.has(token.tag) && MARK_PATTERN.test(content)) {
    content = colorizeMarks(content)
  }

  if (token.tag === 'table' && highlightRow) {
    content = highlightMatchingRow(content, highlightRow)
  }

  // ? Flag (not inject) — the <table> element is created by DPageTokens, not in token.content
  const highlight = token.tag === 'table' && isHighlightColumnTable(token.content, highlightColumn)

  if (content === token.content && !highlight) {
    return token
  }

  return highlight ? { ...token, content, highlight: true } : { ...token, content }
}

/**
 * Apply a structured subpage template to a flat token stream (managed/strict).
 *
 * The template owns the section structure: each canonical section is rendered in
 * the template's declared order, with the template's localized title overriding
 * the markdown heading. Sections absent from the markdown are gracefully omitted.
 * Markdown content before the first `h2` is kept as an intro. Unknown top-level
 * `h2` sections are warned about and appended after the canonical sections so no
 * authored content is lost.
 *
 * Freestyle templates (no `sections`) return the tokens unchanged.
 *
 * @param {Array} tokens - Tokenized page section source.
 * @param {Object} template - Resolved template preset.
 * @param {string} [locale] - Active locale for section titles.
 * @param {Object} [options] - Render options.
 * @param {string} [options.highlightColumn] - Header label whose comparison column is emphasized (consumer-provided, e.g. the project name).
 * @param {string} [options.highlightRow] - First-cell label whose comparison row is emphasized (consumer-provided, e.g. the project name).
 * @returns {Array} Reordered/relabeled token stream.
 */
export function applyTemplateSections (tokens, template, locale = 'en-US', options = {}) {
  const sections = template?.sections
  const highlightColumn = options.highlightColumn
  const highlightRow = options.highlightRow

  if (!Array.isArray(sections) || sections.length === 0) {
    return Array.isArray(tokens) ? tokens : []
  }

  // ? Map every accepted slug (canonical key + each localized title) to its section index
  const indexBySlug = new Map()
  sections.forEach((section, index) => {
    indexBySlug.set(normalizeKey(section.key), index)

    for (const title of Object.values(section.title || {})) {
      const slug = normalizeKey(title)
      if (slug && !indexBySlug.has(slug)) {
        indexBySlug.set(slug, index)
      }
    }
  })

  // ! Partition tokens into intro, canonical buckets and unknown sections
  const intro = []
  const buckets = sections.map(() => null)
  const unknowns = []
  let current = null

  // @ Walk the flat stream, splitting at h2 boundaries
  for (const token of Array.isArray(tokens) ? tokens : []) {
    if (token?.tag === 'h2') {
      const slug = normalizeKey(token.anchorId ?? token.content)
      const index = indexBySlug.has(slug) ? indexBySlug.get(slug) : -1

      if (index >= 0) {
        if (buckets[index] === null) {
          buckets[index] = []
        }
        current = { type: 'section', index }
      } else {
        const unknown = { token, body: [] }
        unknowns.push(unknown)
        current = { type: 'unknown', unknown }
      }

      continue
    }

    if (current === null) {
      intro.push(token)
    } else if (current.type === 'section') {
      buckets[current.index].push(token)
    } else {
      current.unknown.body.push(token)
    }
  }

  // @@ Rebuild in canonical order
  const output = [...intro]

  sections.forEach((section, index) => {
    const body = buckets[index]
    if (body === null) {
      return
    }

    output.push({
      tag: 'h2',
      anchorId: section.key,
      content: section.title?.[locale] || section.title?.['en-US'] || section.key,
      icon: section.icon
    })
    output.push(...body)
  })

  // ? Append unknown sections (non-destructive) after warning
  if (unknowns.length > 0) {
    const allowed = sections.map(section => section.key)

    for (const unknown of unknowns) {
      warnUnknownSection(template.name, stripHtml(unknown.token.content), allowed)
      output.push(unknown.token, ...unknown.body)
    }
  }

  // : colorize comparison marks (✓/✗/➕) + highlight the configured column and row
  return output.map(token => transformToken(token, highlightColumn, highlightRow))
}
