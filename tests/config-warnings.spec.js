import { describe, expect, it, vi } from 'vitest'

import { reportConfigWarnings } from '../src/quasar.factory.js'

describe('reportConfigWarnings', () => {
  it('prints each distinct problem once, even when both sections hit it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      reportConfigWarnings({
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
      reportConfigWarnings({})
      reportConfigWarnings({ sponsors: { enabled: false, items: 'broken' }, ads: { enabled: false } })
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('prints each header problem once, next to the sponsors and ads ones', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      reportConfigWarnings({
        header: { links: [{ label: 'Docs', url: '/guide/' }, { href: '/x/' }] },
        sponsors: { enabled: 'yes' }
      })

      const messages = warn.mock.calls.map(call => call.join(' '))
      expect(messages.filter(message => message.includes('header.links[0] (Docs) needs an href or children (write href, not url) — ignored'))).toHaveLength(1)
      expect(messages.filter(message => message.includes('header.links[1] needs a label'))).toHaveLength(1)
      expect(messages.filter(message => message.includes('sponsors.enabled must be the boolean true'))).toHaveLength(1)
      expect(messages).toHaveLength(3)
    } finally {
      warn.mockRestore()
    }
  })

  it('stays silent for a valid header', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      reportConfigWarnings({ header: { links: [{ label: 'Sponsors', icon: 'favorite', href: '/sponsors/' }] } })
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })
})
