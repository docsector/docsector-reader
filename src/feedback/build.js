/**
 * Docsector Page Feedback — build helpers
 *
 * Turn docsector.config.js and the books registry into the generated
 * functions/feedback.js. Build-time only: nothing here ships to the client.
 */
import { normalizeFeedbackConfig } from './config.js'

// ! The one line of src/feedback/server.js the build rewrites
export const FEEDBACK_SERVER_ANCHOR = 'const FEEDBACK_CONFIG = __FEEDBACK_CONFIG__'

const isFilledString = (value) => typeof value === 'string' && value.length > 0

// : Config baked into functions/feedback.js — the binding plus the locale and
//   version allow-lists the endpoint validates votes against. Values are kept
//   verbatim: the client sends the same strings the router and vue-i18n use.
export function buildFeedbackServerConfig (config = {}, { versions = [] } = {}) {
  const { binding } = normalizeFeedbackConfig(config)

  // ? the locale set the build prerenders: configured languages plus the default one
  const languages = (Array.isArray(config?.languages) ? config.languages : [])
    .map(language => language?.value)
    .filter(isFilledString)
  const defaultLanguage = config?.defaultLanguage || languages[0] || 'en-US'
  if (!languages.includes(defaultLanguage)) {
    languages.push(defaultLanguage)
  }

  const versionIds = [...new Set(
    (Array.isArray(versions) ? versions : [])
      .map(version => (typeof version === 'string' ? version : version?.id))
      .filter(isFilledString)
  )]

  return { binding, languages, versions: versionIds }
}

// : the endpoint source with `serverConfig` baked in; throws unless the
//   template carries the anchor exactly once — a silent no-op would ship a
//   Function that dies on its first line, taking the whole Pages Worker along
export function renderFeedbackServer (template, serverConfig) {
  const source = String(template)
  const occurrences = source.split(FEEDBACK_SERVER_ANCHOR).length - 1
  if (occurrences !== 1) {
    throw new Error(`[docsector] The feedback endpoint template must contain "${FEEDBACK_SERVER_ANCHOR}" exactly once (found ${occurrences}).`)
  }

  // ? Only the assignment is rewritten — the `/* global */` comment keeps the
  //   bare name, so no config value can close it. Replacer function: `$&`,
  //   `` $` `` and `$'` in a config value must stay literal.
  return source.replace(FEEDBACK_SERVER_ANCHOR, () => `const FEEDBACK_CONFIG = ${JSON.stringify(serverConfig, null, 2)}`)
}
