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

export function isAssistantThinkingState({ loading = false, messages = [] } = {}) {
  if (!loading) {
    return false
  }

  const lastMessage = messages[messages.length - 1]
  return Boolean(lastMessage && lastMessage.role === 'assistant' && !hasAssistantMessageContent(lastMessage))
}
