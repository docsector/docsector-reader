export function hasAssistantMessageContent(message) {
  return String(message?.content || '').trim().length > 0
}

export function getAssistantMessageTimestamp(message) {
  const timestamp = Number(message?.timestamp)
  if (Number.isFinite(timestamp) && timestamp > 0) {
    return timestamp
  }

  const id = String(message?.id || '')
  const match = id.match(/^(?:user|assistant)-(\d{12,})-/)
  if (!match) {
    return null
  }

  const legacyTimestamp = Number(match[1])
  return Number.isFinite(legacyTimestamp) && legacyTimestamp > 0 ? legacyTimestamp : null
}

export function formatAssistantMessageTime(message, locale = 'en-US') {
  const timestamp = getAssistantMessageTimestamp(message)
  if (!timestamp) {
    return ''
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(locale || 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function listVisibleAssistantMessages(messages = []) {
  return messages.filter((message) => {
    if (message?.role !== 'assistant') {
      return true
    }

    return hasAssistantMessageContent(message)
  })
}

export function hasVisibleAssistantHistoryAfter(messages = [], messageId = '') {
  const targetId = String(messageId || '')
  if (!targetId) {
    return false
  }

  const targetIndex = messages.findIndex(message => String(message?.id || '') === targetId)
  if (targetIndex === -1) {
    return false
  }

  return messages.slice(targetIndex + 1).some((message) => {
    if (message?.role === 'assistant') {
      return hasAssistantMessageContent(message)
    }

    return hasAssistantMessageContent(message)
  })
}

export const ASSISTANT_MESSAGE_WINDOW_SIZE = 60
export const ASSISTANT_MESSAGE_WINDOW_STEP = 40

export function getAssistantMessageWindow(messages = [], limit = ASSISTANT_MESSAGE_WINDOW_SIZE) {
  const visibleMessages = listVisibleAssistantMessages(messages)
  const safeLimit = Math.max(1, Number(limit) || ASSISTANT_MESSAGE_WINDOW_SIZE)
  const hiddenCount = Math.max(0, visibleMessages.length - safeLimit)

  return {
    messages: hiddenCount > 0 ? visibleMessages.slice(hiddenCount) : visibleMessages,
    hiddenCount,
    total: visibleMessages.length
  }
}

export function isAssistantThinkingState({ loading = false, messages = [] } = {}) {
  if (!loading) {
    return false
  }

  const lastMessage = messages[messages.length - 1]
  return Boolean(lastMessage && lastMessage.role === 'assistant' && !hasAssistantMessageContent(lastMessage))
}
