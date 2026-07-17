const VALID_ROLES = new Set(['system', 'developer', 'user', 'assistant', 'tool'])

function cleanContent (value, maxLength) {
  const content = String(value || '').replace(/\s+$/g, '')
  if (!Number.isFinite(maxLength) || maxLength <= 0 || content.length <= maxLength) {
    return content
  }

  return content.slice(0, maxLength).trimEnd()
}

export function normalizeAssistantMessages (messages = [], { maxMessages = 12, maxContentLength = 4000 } = {}) {
  return (Array.isArray(messages) ? messages : [])
    .map(message => {
      const role = VALID_ROLES.has(message?.role) ? message.role : 'user'
      const content = cleanContent(message?.content, maxContentLength)
      return content ? { role, content } : null
    })
    .filter(Boolean)
    .slice(-Math.max(1, maxMessages))
}

export function createAssistantRequestPayload ({ messages = [], route, locale, context } = {}, options = {}) {
  const normalizedMessages = normalizeAssistantMessages(messages, options)
  const path = typeof route?.path === 'string' ? route.path : ''
  const hash = typeof route?.hash === 'string' ? route.hash : ''

  return {
    messages: normalizedMessages,
    locale: typeof locale === 'string' && locale.trim() ? locale.trim() : 'en-US',
    route: {
      path,
      hash
    },
    context: {
      title: typeof context?.title === 'string' ? context.title.trim() : '',
      markdownUrl: typeof context?.markdownUrl === 'string' ? context.markdownUrl.trim() : '',
      selectedText: cleanContent(context?.selectedText, options.maxSelectedTextLength || 1200),
      // Opt-in: only when this is exactly `true` does the endpoint attach the
      // current page markdown. Anything else means off.
      includePageMarkdown: context?.includePageMarkdown === true
    }
  }
}
