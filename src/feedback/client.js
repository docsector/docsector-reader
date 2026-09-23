/* global globalThis */

/**
 * Docsector Page Feedback — client helpers
 *
 * Pure helpers behind DPageFeedback: the rating vocabulary, the vote payload,
 * the per-page storage key and the fire-and-forget send.
 */
import { FEEDBACK_ENDPOINT } from './config.js'

export const FEEDBACK_STORAGE_PREFIX = 'docsector.feedback.'
export const FEEDBACK_PATH_MAX_LENGTH = 256

// ! Each icon name stays on a line mentioning `icon` — the material-icon subset
//   scanner (collectIconTokens in quasar.factory.js) only bundles those
export const RATINGS = Object.freeze([
  Object.freeze({ value: 'positive', icon: 'sentiment_very_satisfied' }),
  Object.freeze({ value: 'neutral', icon: 'sentiment_neutral' }),
  Object.freeze({ value: 'negative', icon: 'sentiment_very_dissatisfied' })
])

const isRating = (value) => RATINGS.some(rating => rating.value === value)

// : a character outside the endpoint's path set, percent-encoded — including
//   `'`, which encodeURIComponent leaves alone
const encodeCharacter = (character) => {
  try {
    const encoded = encodeURIComponent(character)
    if (encoded !== character) return encoded

    return `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`
  } catch {
    // ? lone surrogate — nothing encodable to keep
    return ''
  }
}

// : Route path as the endpoint accepts it — no query, hash, `/index.html` or
//   trailing slash; only RFC 3986 path characters (anything else
//   percent-encoded, so markup never survives); bounded
export function normalizeFeedbackPath (path) {
  const normalized = String(path || '')
    .replace(/[?#].*$/, '')
    .replace(/\/index\.html$/, '')
    .replace(/\/+$/, '')
    .replace(/[^!$%&()*+,\-./0-9:;=@A-Z[\]_a-z~]/gu, encodeCharacter)

  const rooted = normalized.startsWith('/') ? normalized : `/${normalized}`

  return rooted.slice(0, FEEDBACK_PATH_MAX_LENGTH)
}

// : `rating` is the new vote and `previous` the recorded one it replaces —
//   either may be null (a first vote, a cancelled vote)
export function buildFeedbackPayload ({ path, locale, version, rating = null, previous = null }) {
  return {
    path: normalizeFeedbackPath(path),
    locale: String(locale || ''),
    version: String(version || ''),
    rating,
    previous
  }
}

export function buildFeedbackStorageKey ({ path, locale, version }) {
  return `${FEEDBACK_STORAGE_PREFIX}${version || ''}:${locale || ''}:${normalizeFeedbackPath(path)}`
}

// : localStorage, or null where reading it throws (sandboxed frames, blocked
//   site data) or it does not exist (SSR)
export function resolveFeedbackStorage () {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function readStoredRating (key, storage = resolveFeedbackStorage()) {
  try {
    const value = storage?.getItem(key) ?? null
    return isRating(value) ? value : null
  } catch {
    return null
  }
}

// ? a null value forgets the page's vote
export function storeRating (key, value, storage = resolveFeedbackStorage()) {
  try {
    if (value === null) {
      storage?.removeItem(key)
    } else {
      storage?.setItem(key, value)
    }
  } catch {
    // ? quota / private mode — the vote is still sent
  }
}

// : true when the endpoint accepted the vote; never throws — a failed send
//   must not surface to the reader
export async function sendFeedback (payload, fetcher = globalThis.fetch) {
  try {
    const response = await fetcher(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    })

    return response?.ok === true
  } catch {
    return false
  }
}
