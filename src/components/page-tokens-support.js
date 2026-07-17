/**
 * Client-side support for pre-compiled page tokens — deliberately tiny.
 *
 * Pages compiled at build time ship their KaTeX HTML already rendered, so the
 * client only ever needs the KaTeX stylesheet — never the engine. DPageSection
 * imports THIS module statically; the markdown-it tokenizer graph stays out of
 * its chunk (it is lazy-loaded only for raw string sources, i.e. dev mode).
 */
let mathCssPromise = null

export const loadMathCss = () => {
  if (mathCssPromise === null) {
    mathCssPromise = import('katex/dist/katex.min.css').catch((error) => {
      mathCssPromise = null
      console.warn('[docsector] Failed to load math stylesheet', error)
    })
  }

  return mathCssPromise
}

/**
 * Whether a page source value is a build-time compiled tokens module
 * (`{ v, math, headers, heading, tokens }`) instead of a raw markdown string.
 */
export const isCompiledPageSource = (value) => {
  return typeof value === 'object' && value !== null &&
    typeof value.tokens === 'string' && typeof value.v === 'number'
}

/**
 * Parse the token list of a compiled page source. The tokens travel as a JSON
 * string so vue-i18n never deep-proxies hundreds of token objects reactively.
 */
export const parseCompiledPageTokens = (compiled) => {
  try {
    const tokens = JSON.parse(compiled.tokens)
    return Array.isArray(tokens) ? tokens : []
  } catch (error) {
    console.warn('[docsector] Failed to parse compiled page tokens', error)
    return []
  }
}
