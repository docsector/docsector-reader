/**
 * Build-time page compiler — turns a raw markdown page into the compiled
 * module shape shipped to the client:
 *
 *   { v, math, heading, tokens }
 *
 * - `tokens` is the DPageTokens block list, serialized as a JSON string (see
 *   page-tokens-support.js for why a string).
 * - `math` marks pages whose KaTeX HTML was pre-rendered here — the client
 *   then loads only the KaTeX stylesheet.
 * - `heading` bakes the value the homepage breadcrumb used to derive from the
 *   raw source (which no longer ships).
 *
 * Runs under plain Node ESM (Vite build) and in the client bundle only inside
 * the lazy dev fallback / assistant chunks — never in the critical path.
 */
import { normalizePageFaq, parseFrontmatter, stripFrontmatter } from '../frontmatter.js'
import { loadMathEngine, sourceHasMath, tokenizePageSectionSource } from './page-section-tokens.js'

export const PAGE_TOKENS_VERSION = 1

/**
 * First page heading, for breadcrumbs: an inline `<h1>` (remote README badges
 * style) or the first ATX `# ` line. Mirrors the former helpers.js extraction.
 */
export const extractPageHeading = (source) => {
  const text = stripFrontmatter(String(source ?? ''))

  const htmlHeadingMatch = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (htmlHeadingMatch) {
    const htmlHeading = htmlHeadingMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (htmlHeading) {
      return htmlHeading
    }
  }

  const match = text.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

export async function compilePageTokens (source, options = {}) {
  // ? metadata never reaches the compiled artifact as content — the heading
  //   reads the stripped text, and the tokenizer strips the block itself,
  //   turning its `faq` into the closing FAQ token
  const raw = String(source ?? '')
  const text = stripFrontmatter(raw)
  const faqAnswers = normalizePageFaq(parseFrontmatter(raw).data?.faq).map(item => item.answer)

  // ? Math pages pre-render KaTeX at build — load the engine first so the
  //   tokenizer emits final HTML instead of raw dollar delimiters. The body and
  //   the FAQ answers count; other metadata (a `$` in `desc`) does not.
  const math = [text, ...faqAnswers].some(part => sourceHasMath(part))
  if (math) {
    await loadMathEngine()
  }

  // ! codeToolbarDefault stays unbaked (null): the per-page default is applied
  //   at render time by DPageTokens, so one compiled artifact serves all pages
  const tokens = tokenizePageSectionSource(raw, { codeToolbarDefault: null, ...options, stripFrontmatter: true })

  return {
    v: PAGE_TOKENS_VERSION,
    math,
    heading: extractPageHeading(text),
    tokens: JSON.stringify(tokens)
  }
}
