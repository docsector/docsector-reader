import { describe, expect, it } from 'vitest'

import {
  extractAssistantStreamDelta,
  normalizeAssistantSourceChunks,
  parseServerSentEvents
} from '../src/ai-assistant/stream.js'

describe('assistant stream helpers', () => {
  it('parses SSE events with chunks and streamed deltas', () => {
    const events = parseServerSentEvents([
      'event: chunks',
      'data: [{"id":"1","score":0.8,"text":"Source","item":{"key":"/guide.md","metadata":{"title":"Guide"}}}]',
      '',
      'data: {"choices":[{"delta":{"content":"Hello"}}]}',
      '',
      'data: [DONE]',
      ''
    ].join('\n'))

    expect(events).toHaveLength(3)
    expect(extractAssistantStreamDelta(events[0])).toMatchObject({
      done: false,
      content: '',
      chunks: [{ id: '1', key: '/guide.md', title: 'Guide', score: 0.8 }]
    })
    expect(extractAssistantStreamDelta(events[1])).toMatchObject({ content: 'Hello' })
    expect(extractAssistantStreamDelta(events[2])).toEqual({ done: true, content: '', chunks: [] })
  })

  it('normalizes source chunks from AI Search response shape', () => {
    expect(normalizeAssistantSourceChunks([
      {
        id: 'chunk-a',
        score: 0.72,
        text: '  Use MCP.  ',
        item: {
          key: 'manual/basic/agent-skills/overview.md',
          metadata: { title: 'Agent Skills' }
        }
      }
    ])).toEqual([
      {
        id: 'chunk-a',
        key: 'manual/basic/agent-skills/overview.md',
        title: 'Agent Skills',
        text: 'Use MCP.',
        score: 0.72
      }
    ])
  })
})
