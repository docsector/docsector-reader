import { describe, expect, it } from 'vitest'

import {
  isAssistantEnabled,
  normalizeAiAssistantConfig
} from '../src/ai-assistant/config.js'

describe('AI assistant config', () => {
  it('is disabled by default', () => {
    const config = normalizeAiAssistantConfig({})

    expect(isAssistantEnabled({})).toBe(false)
    expect(config.enabled).toBe(false)
    expect(config.provider).toBe('aiSearch')
    expect(config.endpoint).toBe('/assistant')
  })

  it('normalizes UI and AI Search options', () => {
    const config = normalizeAiAssistantConfig({
      aiAssistant: {
        enabled: true,
        ui: {
          title: 'Docs helper',
          drawerWidth: 999,
          suggestedPrompts: ['Explain routing', '', '  Find MCP docs  ']
        },
        aiSearch: {
          instanceName: 'docs-prod',
          instanceNameEnv: 'DOCS_AI_SEARCH_INSTANCE',
          maxResults: 80,
          matchThreshold: 2,
          contextExpansion: 9,
          queryRewrite: { enabled: false },
          reranking: { enabled: true }
        }
      }
    })

    expect(config.enabled).toBe(true)
    expect(config.ui.title).toBe('Docs helper')
    expect(config.ui.drawerWidth).toBe(520)
    expect(config.ui.suggestedPrompts).toEqual([
      { text: 'Explain routing', pageContext: false },
      { text: 'Find MCP docs', pageContext: false }
    ])
    expect(config.aiSearch.instanceName).toBe('docs-prod')
    expect(config.aiSearch.instanceNameEnv).toBe('DOCS_AI_SEARCH_INSTANCE')
    expect(config.aiSearch.maxResults).toBe(50)
    expect(config.aiSearch.matchThreshold).toBe(1)
    expect(config.aiSearch.contextExpansion).toBe(3)
    expect(config.aiSearch.queryRewrite.enabled).toBe(false)
    expect(config.aiSearch.reranking.enabled).toBe(true)
  })

  it('accepts legacy string prompts and the self-describing object form together', () => {
    const config = normalizeAiAssistantConfig({
      aiAssistant: {
        ui: {
          suggestedPrompts: [
            'Legacy string',
            { text: '  Summarize this page.  ', pageContext: true },
            { text: 'Plain object' }
          ]
        }
      }
    })

    expect(config.ui.suggestedPrompts).toEqual([
      { text: 'Legacy string', pageContext: false },
      { text: 'Summarize this page.', pageContext: true },
      { text: 'Plain object', pageContext: false }
    ])
  })

  it('drops prompts without usable text', () => {
    const config = normalizeAiAssistantConfig({
      aiAssistant: {
        ui: {
          suggestedPrompts: ['Keep me', { pageContext: true }, { text: '   ' }, null, 42]
        }
      }
    })

    expect(config.ui.suggestedPrompts).toEqual([{ text: 'Keep me', pageContext: false }])
  })

  it('only treats a literal true as a page-dependent prompt', () => {
    const config = normalizeAiAssistantConfig({
      aiAssistant: {
        ui: {
          suggestedPrompts: [{ text: 'A', pageContext: 'true' }, { text: 'B', pageContext: 1 }]
        }
      }
    })

    expect(config.ui.suggestedPrompts.every(prompt => prompt.pageContext === false)).toBe(true)
  })

  it('caps the prompt list at six', () => {
    const config = normalizeAiAssistantConfig({
      aiAssistant: {
        ui: {
          suggestedPrompts: ['1', '2', '3', '4', '5', '6', '7', '8']
        }
      }
    })

    expect(config.ui.suggestedPrompts).toHaveLength(6)
    expect(config.ui.suggestedPrompts.at(-1)).toEqual({ text: '6', pageContext: false })
  })

  it('falls back to normalized defaults when the list is empty or unusable', () => {
    for (const suggestedPrompts of [undefined, [], ['   ']]) {
      const config = normalizeAiAssistantConfig({ aiAssistant: { ui: { suggestedPrompts } } })

      // The fallback must run through the normalizer too, or the defaults would
      // ship without the pageContext field every consumer of this list expects.
      expect(config.ui.suggestedPrompts).toEqual([
        { text: 'How do I get started?', pageContext: false },
        { text: 'Summarize this page.', pageContext: true },
        { text: 'Where is the related API reference?', pageContext: false }
      ])
    }
  })

  it('defaults instanceNameEnv when omitted', () => {
    const config = normalizeAiAssistantConfig({
      aiAssistant: {
        enabled: true,
        aiSearch: {}
      }
    })

    expect(config.aiSearch.instanceName).toBe('')
    expect(config.aiSearch.instanceNameEnv).toBe('AI_SEARCH_INSTANCE_NAME')
  })
})
