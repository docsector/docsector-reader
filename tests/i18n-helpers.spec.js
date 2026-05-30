import { describe, expect, it } from 'vitest'

import { buildMessages } from '../src/i18n/helpers.js'

const langModules = {
  './languages/en-US.hjson': {
    _: {
      home: {
        texts: ['Docs']
      }
    },
    menu: {
      home: 'Home',
      settings: 'Settings'
    }
  },
  './languages/pt-BR.hjson': {
    _: {
      home: {
        texts: ['Docs']
      }
    },
    menu: {
      home: 'Início',
      settings: 'Configurações'
    }
  }
}

const mdModules = {
  '../pages/Homepage.en-US.md': '# Home\n\nBody',
  '../pages/Homepage.pt-BR.md': '# Início\n\nCorpo'
}

const boot = {
  meta: {
    'en-US': {},
    'pt-BR': {}
  }
}

describe('i18n message builder', () => {
  it('injects assistant defaults for older scaffolds that lack assistant keys', () => {
    const messages = buildMessages({
      langModules,
      mdModules,
      books: {},
      boot,
      langs: ['en-US', 'pt-BR']
    })

    expect(messages['en-US'].assistant).toMatchObject({
      placeholder: 'Ask, search, or explain...',
      send: 'Send',
      context: 'Based on your context',
      greeting: {
        afternoon: 'Good afternoon'
      }
    })

    expect(messages['pt-BR'].assistant).toMatchObject({
      placeholder: 'Pergunte, pesquise ou explique...',
      send: 'Enviar',
      context: 'Com base no seu contexto',
      greeting: {
        afternoon: 'Boa tarde'
      }
    })
  })

  it('preserves consumer overrides when assistant keys already exist', () => {
    const messages = buildMessages({
      langModules: {
        ...langModules,
        './languages/en-US.hjson': {
          ...langModules['./languages/en-US.hjson'],
          assistant: {
            title: 'Bootgly AI Assistant',
            placeholder: 'Custom placeholder'
          }
        }
      },
      mdModules,
      books: {},
      boot,
      langs: ['en-US']
    })

    expect(messages['en-US'].assistant.title).toBe('Bootgly AI Assistant')
    expect(messages['en-US'].assistant.placeholder).toBe('Custom placeholder')
    expect(messages['en-US'].assistant.send).toBe('Send')
  })
})
