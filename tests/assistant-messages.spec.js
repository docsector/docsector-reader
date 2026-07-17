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

  it('leaves the page markdown out of the payload by default', () => {
    const payload = createAssistantRequestPayload({
      messages: [{ role: 'user', content: 'Hi' }],
      context: { title: 'Guide', markdownUrl: 'https://docs.example.com/guide.md' }
    })

    expect(payload.context.includePageMarkdown).toBe(false)
    // The URL still ships when the toggle is off: the client does not encode
    // server policy, and the endpoint short-circuits before reading it.
    expect(payload.context.markdownUrl).toBe('https://docs.example.com/guide.md')
  })

  it('opts in only for a literal true', () => {
    const build = (includePageMarkdown) => createAssistantRequestPayload({
      messages: [{ role: 'user', content: 'Hi' }],
      context: { includePageMarkdown }
    }).context.includePageMarkdown

    expect(build(true)).toBe(true)

    for (const value of ['true', 1, 'yes', {}, undefined]) {
      expect(build(value)).toBe(false)
    }
  })
})
