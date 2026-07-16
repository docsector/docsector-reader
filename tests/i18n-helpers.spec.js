import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'

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

  it('provides a brand lockup whose word order is owned by each locale', () => {
    const messages = buildMessages({
      langModules,
      mdModules,
      books: {},
      boot,
      langs: ['en-US', 'pt-BR']
    })

    // The placeholder must survive verbatim — interpolation happens at render time
    expect(messages['en-US'].system.brand).toBe('{name} Documentation')
    // pt-BR fronts the noun instead of suffixing it
    expect(messages['pt-BR'].system.brand).toBe('Documentação {name}')
  })

  it('lets a consumer override the brand lockup', () => {
    const messages = buildMessages({
      langModules: {
        ...langModules,
        './languages/en-US.hjson': {
          ...langModules['./languages/en-US.hjson'],
          system: {
            brand: '{name} Official Documentation'
          }
        }
      },
      mdModules,
      books: {},
      boot,
      langs: ['en-US']
    })

    expect(messages['en-US'].system.brand).toBe('{name} Official Documentation')
  })

  it('interpolates the brand lockup the way the header and sidebar render it', () => {
    const messages = buildMessages({
      langModules,
      mdModules,
      books: {},
      boot,
      langs: ['en-US', 'pt-BR']
    })

    const i18n = createI18n({ legacy: false, locale: 'en-US', messages })
    const { t } = i18n.global

    expect(t('system.brand', { name: 'Bootgly' })).toBe('Bootgly Documentation')

    i18n.global.locale.value = 'pt-BR'
    expect(t('system.brand', { name: 'Bootgly' })).toBe('Documentação Bootgly')
  })

  it('provides the update banner strings in both locales', () => {
    const messages = buildMessages({
      langModules,
      mdModules,
      books: {},
      boot,
      langs: ['en-US', 'pt-BR']
    })

    expect(messages['en-US'].system.update).toEqual({
      message: 'Updated content is available. Please refresh the page.',
      refresh: 'Refresh',
      dismiss: 'Dismiss'
    })
    expect(messages['pt-BR'].system.update).toEqual({
      message: 'Há conteúdo atualizado disponível. Atualize a página.',
      refresh: 'Atualizar',
      dismiss: 'Dispensar'
    })
  })

  it('lets a consumer override the update banner strings', () => {
    const messages = buildMessages({
      langModules: {
        ...langModules,
        './languages/en-US.hjson': {
          ...langModules['./languages/en-US.hjson'],
          system: {
            update: {
              message: 'New docs are live!'
            }
          }
        }
      },
      mdModules,
      books: {},
      boot,
      langs: ['en-US']
    })

    expect(messages['en-US'].system.update.message).toBe('New docs are live!')
    // ? deep-merge keeps the engine defaults the consumer did not touch
    expect(messages['en-US'].system.update.refresh).toBe('Refresh')
  })
})
