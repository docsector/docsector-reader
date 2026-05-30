export const ASSISTANT_SESSION_STORAGE_KEY = 'docsector.assistant.session.v1'

const MAX_PERSISTED_MESSAGES = 40
const MAX_PERSISTED_SOURCES = 20
const MAX_MESSAGE_CONTENT_LENGTH = 12000
const VALID_ROLES = new Set(['user', 'assistant'])

function getStorage (storage = null) {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage || null
}

function cleanString (value = '', maxLength = Number.MAX_SAFE_INTEGER) {
  return String(value || '').slice(0, maxLength)
}

export function normalizeAssistantSession (session = {}) {
  const messages = (Array.isArray(session?.messages) ? session.messages : [])
    .map((message, index) => {
      const role = String(message?.role || '')
      const content = cleanString(message?.content, MAX_MESSAGE_CONTENT_LENGTH)
      if (!VALID_ROLES.has(role) || !content.trim()) return null

      return {
        id: cleanString(message?.id || `${role}-${index + 1}`, 160),
        role,
        content
      }
    })
    .filter(Boolean)
    .slice(-MAX_PERSISTED_MESSAGES)

  const sources = (Array.isArray(session?.sources) ? session.sources : [])
    .map((source, index) => {
      const key = cleanString(source?.key || '')
      const text = cleanString(source?.text || '')
      if (!key && !text) return null

      const score = Number(source?.score ?? 0)

      return {
        id: cleanString(source?.id || key || `source-${index + 1}`, 240),
        key,
        title: cleanString(source?.title || `Source ${index + 1}`, 240),
        meta: cleanString(source?.meta || ''),
        text,
        score: Number.isFinite(score) ? score : 0
      }
    })
    .filter(Boolean)
    .slice(0, MAX_PERSISTED_SOURCES)

  return { messages, sources }
}

export function loadAssistantSession ({ storage = null, key = ASSISTANT_SESSION_STORAGE_KEY } = {}) {
  const target = getStorage(storage)
  if (!target) return normalizeAssistantSession()

  try {
    const raw = target.getItem(key)
    if (!raw) return normalizeAssistantSession()
    return normalizeAssistantSession(JSON.parse(raw))
  } catch {
    return normalizeAssistantSession()
  }
}

export function saveAssistantSession (session = {}, { storage = null, key = ASSISTANT_SESSION_STORAGE_KEY } = {}) {
  const target = getStorage(storage)
  if (!target) return

  const normalized = normalizeAssistantSession(session)
  try {
    target.setItem(key, JSON.stringify(normalized))
  } catch {
    // Storage can be unavailable or full; chat should keep working in memory.
  }
}

export function clearAssistantSession ({ storage = null, key = ASSISTANT_SESSION_STORAGE_KEY } = {}) {
  const target = getStorage(storage)
  if (!target) return

  try {
    target.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}