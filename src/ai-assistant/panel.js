export function hasAssistantMessageContent(message) {
  return String(message?.content || '').trim().length > 0
}

export function listVisibleAssistantMessages(messages = []) {
  return messages.filter((message) => {
    if (message?.role !== 'assistant') {
      return true
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
