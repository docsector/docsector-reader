import { describe, expect, it } from 'vitest'

import {
  createAssistantRequestPayload,
  normalizeAssistantMessages
} from '../src/ai-assistant/messages.js'

describe('assistant message helpers', () => {
  it('keeps recent non-empty messages with safe roles', () => {
    const messages = normalizeAssistantMessages([
      { role: 'system', content: 'Be helpful' },
      { role: 'invalid', content: 'Question' },
      { role: 'assistant', content: '' },
      { role: 'user', content: 'Another question' }
    ], { maxMessages: 2 })

    expect(messages).toEqual([
      { role: 'user', content: 'Question' },
      { role: 'user', content: 'Another question' }
    ])
  })

  it('creates a route-aware request payload', () => {
    const payload = createAssistantRequestPayload({
      messages: [{ role: 'user', content: 'How does MCP work?' }],
      route: { path: '/manual/basic/agent-skills/overview/', hash: '#mcp' },
      locale: 'pt-BR',
      context: {
        title: 'Agent Skills',
        markdownUrl: 'https://docs.example.com/manual/basic/agent-skills/overview.md',
        selectedText: 'Selected docs text'
      }
    })

    expect(payload).toMatchObject({
      messages: [{ role: 'user', content: 'How does MCP work?' }],
      locale: 'pt-BR',
      route: { path: '/manual/basic/agent-skills/overview/', hash: '#mcp' },
      context: {
        title: 'Agent Skills',
        markdownUrl: 'https://docs.example.com/manual/basic/agent-skills/overview.md',
        selectedText: 'Selected docs text'
      }
    })
  })
})
