import { describe, expect, it, vi } from 'vitest'

import { reportSponsorshipWarnings } from '../src/quasar.factory.js'

describe('reportSponsorshipWarnings', () => {
  it('prints each distinct problem once, even when both sections hit it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      reportSponsorshipWarnings({
        links: { sponsor: 'https://github.com/sponsors/x' },
        sponsors: { enabled: true, fallbackUrl: 'javascript:void(0)', tiers: [{ id: 'gold', layout: 'square' }], items: [] },
        ads: { enabled: true, items: [] }
      })

      const messages = warn.mock.calls.map(call => call.join(' '))
      expect(messages.filter(message => message.includes('sponsors.fallbackUrl must be'))).toHaveLength(1)
      expect(messages).toHaveLength(1)
    } finally {
      warn.mockRestore()
    }
  })

  it('stays silent for a valid or disabled config', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      reportSponsorshipWarnings({})
      reportSponsorshipWarnings({ sponsors: { enabled: false, items: 'broken' }, ads: { enabled: false } })
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })
})
