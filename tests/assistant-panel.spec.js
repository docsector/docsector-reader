import { describe, expect, it } from 'vitest'

import {
  formatAssistantMessageTime,
  getAssistantMessageWindow,
  hasVisibleAssistantHistoryAfter,
  hasAssistantMessageContent,
  isAssistantThinkingState,
  listVisibleAssistantMessages
} from '../src/ai-assistant/panel.js'

describe('assistant panel helpers', () => {
  it('treats only non-empty assistant content as visible', () => {
    expect(hasAssistantMessageContent({ role: 'assistant', content: '  ' })).toBe(false)
    expect(hasAssistantMessageContent({ role: 'assistant', content: 'Hello' })).toBe(true)
  })

  it('hides empty assistant placeholders while keeping user messages', () => {
    const visible = listVisibleAssistantMessages([
      { id: '1', role: 'user', content: 'Summarize this page.' },
      { id: '2', role: 'assistant', content: '' },
      { id: '3', role: 'assistant', content: 'Here is the summary.' }
    ])

    expect(visible.map(message => message.id)).toEqual(['1', '3'])
  })

  it('detects visible history after a message for retry warnings', () => {
    const messages = [
      { id: 'user-1', role: 'user', content: 'First question' },
      { id: 'assistant-1', role: 'assistant', content: 'First answer' },
      { id: 'user-2', role: 'user', content: 'Second question' }
    ]

    expect(hasVisibleAssistantHistoryAfter(messages, 'user-1')).toBe(true)
    expect(hasVisibleAssistantHistoryAfter(messages, 'user-2')).toBe(false)
  })

  it('ignores empty assistant placeholders after a failed retry target', () => {
    expect(hasVisibleAssistantHistoryAfter([
      { id: 'user-1', role: 'user', content: 'Where is the related API reference?' },
      { id: 'assistant-1', role: 'assistant', content: '   ' }
    ], 'user-1')).toBe(false)
  })

  it('marks the panel as thinking only for the trailing empty assistant message', () => {
    expect(isAssistantThinkingState({
      loading: true,
      messages: [
        { role: 'user', content: 'What can I do?' },
        { role: 'assistant', content: '' }
      ]
    })).toBe(true)

    expect(isAssistantThinkingState({
      loading: true,
      messages: [
        { role: 'user', content: 'What can I do?' },
        { role: 'assistant', content: 'A lot.' }
      ]
    })).toBe(false)
  })

  it('returns a recent visible message window for long conversations', () => {
    const messages = Array.from({ length: 5 }, (_, index) => ({
      id: `message-${index + 1}`,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${index + 1}`
    }))

    const window = getAssistantMessageWindow([
      ...messages,
      { id: 'empty-assistant', role: 'assistant', content: '   ' }
    ], 2)

    expect(window.hiddenCount).toBe(3)
    expect(window.total).toBe(5)
    expect(window.messages.map(message => message.id)).toEqual(['message-4', 'message-5'])
  })

  it('formats valid message timestamps as localized short times', () => {
    const timestamp = 1717243200000

    expect(formatAssistantMessageTime({ timestamp }, 'en-US')).toBe(new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp)))
    expect(formatAssistantMessageTime({ timestamp }, 'pt-BR')).toBe(new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp)))
  })

  it('ignores missing or invalid message timestamps', () => {
    expect(formatAssistantMessageTime({ timestamp: 'bad' }, 'en-US')).toBe('')
    expect(formatAssistantMessageTime({ id: 'assistant-not-a-time-abcd' }, 'en-US')).toBe('')
  })
})
