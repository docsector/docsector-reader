/**
 * Page FAQ — the representations of a page's `faq` frontmatter outside the
 * rendered page: schema.org FAQPage JSON-LD for search engines, and a readable
 * `## FAQ` section in the Markdown served to agents.
 *
 * Pure: shared by the client (JSON-LD through useMeta) and the build (static
 * `.md` files, llms-full.txt, SSG heads) — no Markdown renderer in here.
 */
import { extractFrontmatterBlock, normalizePageFaq, parseFrontmatter } from './frontmatter.js'

// ! Marks the JSON-LD the SSG prerender writes — the client drops it on mount,
//   because Quasar Meta (SPA mode) never adopts tags it did not render
export const FAQ_STATIC_JSON_LD_ATTRIBUTE = 'data-docsector-faq'

const isBlankOrComment = (line) => line.trim() === '' || line.trim().startsWith('#')

// : FAQPage JSON-LD for `[{ question, text }]` (plain text), or '' when there
//   is nothing to describe — `<` is escaped so the payload can never close
//   its <script> element
export function buildFaqJsonLd (items) {
  const entries = (Array.isArray(items) ? items : [])
    .filter(item => item?.question && item?.text)

  if (entries.length === 0) return ''

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map(({ question, text }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text
      }
    }))
  }).replace(/</g, '\\u003c')
}

// : `html` with the FAQPage JSON-LD in its head — unchanged when `jsonLd` is ''
export function injectFaqJsonLd (html, jsonLd) {
  if (!jsonLd || !String(html).includes('</head>')) return html

  return String(html).replace('</head>', () => `<script type="application/ld+json" ${FAQ_STATIC_JSON_LD_ATTRIBUTE}>${jsonLd}</script></head>`)
}

// : `[{ question, answer }]` (Markdown) as a readable section — a question
//   written over several lines still makes one `###` heading
export function renderFaqMarkdown (items) {
  const sections = items.map(({ question, answer }) => `### ${question.replace(/\s+/g, ' ').trim()}\n\n${answer}`)

  return `## FAQ\n\n${sections.join('\n\n')}\n`
}

// : the FAQ item a URL hash points at (`#faq-…`), or null — vue-router hands
//   the hash over already decoded, so a second decode may fail (`#100%`)
export function resolveFaqHash (hash, items) {
  let id = String(hash || '').replace(/^#/, '')
  try {
    id = decodeURIComponent(id)
  } catch {
    // ? not percent-encoded — keep it as is
  }

  return Array.isArray(items) && items.some(item => item?.anchorId === id) ? id : null
}

// : a compiled page's tokens JSON without its closing FAQ — the FAQ is not
//   searchable content. It is the last top-level token and the only `faq` one;
//   inside JSON string values the quotes are escaped, so the marker can only
//   match the token itself.
export function omitFaqTokens (tokensJson) {
  const text = String(tokensJson ?? '')
  const start = text.indexOf('{"tag":"faq"')

  return start === -1 ? text : `${text.slice(0, start).replace(/,$/, '')}]`
}

// : a page source as agents read it — the `faq` key leaves the frontmatter
//   (dropping the block when nothing else is left) and returns as a `## FAQ`
//   section at the end; sources without a `faq` key pass through untouched
export function buildAgentMarkdown (source) {
  const text = String(source ?? '')
  const parsed = parseFrontmatter(text)
  // ? every occurrence — a duplicated `faq:` must not leave one behind
  const faqRanges = (parsed.ranges || []).filter(range => range.key === 'faq')
  if (faqRanges.length === 0) return text

  const block = extractFrontmatterBlock(text)
  const bodyLines = block.bodyLines.filter((_, index) => !faqRanges.some(range => index >= range.start && index <= range.end))
  const closeLine = block.raw.split('\n').at(-1).replace(/\r$/, '')
  const keepsBlock = bodyLines.some(line => !isBlankOrComment(line))

  const head = keepsBlock ? `${['---', ...bodyLines, closeLine].join('\n')}\n` : ''
  const body = keepsBlock ? block.content : block.content.replace(/^(?:[ \t]*\r?\n)+/, '')
  const items = normalizePageFaq(parsed.data.faq)

  if (items.length === 0) return `${head}${body}`

  return `${head}${body.trimEnd()}\n\n${renderFaqMarkdown(items)}`
}
