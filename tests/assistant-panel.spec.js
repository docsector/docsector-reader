import { describe, expect, it } from 'vitest'

import {
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
})
