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
    expect(config.ui.suggestedPrompts).toEqual(['Explain routing', 'Find MCP docs'])
    expect(config.aiSearch.instanceName).toBe('docs-prod')
    expect(config.aiSearch.instanceNameEnv).toBe('DOCS_AI_SEARCH_INSTANCE')
    expect(config.aiSearch.maxResults).toBe(50)
    expect(config.aiSearch.matchThreshold).toBe(1)
    expect(config.aiSearch.contextExpansion).toBe(3)
    expect(config.aiSearch.queryRewrite.enabled).toBe(false)
    expect(config.aiSearch.reranking.enabled).toBe(true)
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
