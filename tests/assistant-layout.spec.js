import { describe, expect, it } from 'vitest'

import { getAssistantRightRailState } from '../src/ai-assistant/layout.js'

describe('assistant right rail layout', () => {
  it('adds ToC and assistant widths on wide desktop', () => {
    expect(getAssistantRightRailState({
      tocOpen: true,
      assistantOpen: true,
      screenWidth: 1600,
      tocWidth: 308,
      assistantWidth: 380
    })).toMatchObject({
      isMobile: false,
      showToc: true,
      showAssistant: true,
      totalWidth: 688,
      backToTopRightOffset: '712px'
    })
  })

  it('prioritizes the assistant when medium screens cannot fit both panels', () => {
    expect(getAssistantRightRailState({
      tocOpen: true,
      assistantOpen: true,
      screenWidth: 1024,
      tocWidth: 308,
      assistantWidth: 380,
      minContentWidth: 680
    })).toMatchObject({
      showToc: false,
      showAssistant: true,
      totalWidth: 380,
      backToTopRightOffset: '404px'
    })
  })

  it('keeps side panel widths out of mobile layout', () => {
    expect(getAssistantRightRailState({
      tocOpen: true,
      assistantOpen: true,
      screenWidth: 500
    })).toMatchObject({
      isMobile: true,
      tocWidth: 0,
      assistantWidth: 0,
      totalWidth: 0,
      backToTopRightOffset: '24px'
    })
  })
})
