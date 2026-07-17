export const ASSISTANT_PAGE_CONTEXT_STORAGE_KEY = 'docsector.assistant.context.v1'

function getStorage (storage = null) {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage || null
}

export function loadPersistedPageContext ({ storage = null, key = ASSISTANT_PAGE_CONTEXT_STORAGE_KEY } = {}) {
  const target = getStorage(storage)
  if (!target) return false

  try {
    return target.getItem(key) === 'true'
  } catch {
    return false
  }
}

export function savePersistedPageContext (value, { storage = null, key = ASSISTANT_PAGE_CONTEXT_STORAGE_KEY } = {}) {
  const target = getStorage(storage)
  if (!target) return

  try {
    target.setItem(key, value ? 'true' : 'false')
  } catch {
    // Ignore storage failures so the toggle keeps working in memory.
  }
}
