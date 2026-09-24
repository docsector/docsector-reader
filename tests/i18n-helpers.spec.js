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
      pageContext: {
        label: 'Page context',
        off: 'Attach this page to your prompt.'
      },
      greeting: {
        afternoon: 'Good afternoon'
      }
    })

    expect(messages['pt-BR'].assistant).toMatchObject({
      placeholder: 'Pergunte, pesquise ou explique...',
      send: 'Enviar',
      pageContext: {
        label: 'Contexto da página',
        off: 'Anexe esta página ao seu prompt.'
      },
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

  it('provides every engine UI string the package language files carry, for a consumer file that predates them', () => {
    const messages = buildMessages({
      langModules: {
        './languages/en-US.hjson': { page: { copyPage: 'Copy page' } },
        './languages/pt-BR.hjson': { page: { copyPage: 'Copiar página' } }
      },
      mdModules,
      books: {},
      boot,
      langs: ['en-US', 'pt-BR']
    })

    // ? Keys the hand-written defaults never listed come from the package files
    expect(messages['en-US'].page.stepper).toEqual({ continue: 'Continue', back: 'Back', finish: 'Finish' })
    expect(messages['pt-BR'].page.stepper).toEqual({ continue: 'Continuar', back: 'Voltar', finish: 'Finalizar' })
    expect(messages['en-US'].page.file.download).toBe('Download')
    expect(messages['en-US'].page.sponsors).toEqual({ title: 'Sponsors', cta: 'Your logo here', example: 'Your sponsor here' })
    expect(messages['pt-BR'].page.sponsors).toEqual({ title: 'Patrocinadores', cta: 'Sua logo aqui', example: 'Seu patrocinador aqui' })
    expect(messages['en-US'].page.ad).toEqual({ label: 'Ad', example: 'Your ad here' })
    expect(messages['pt-BR'].page.ad).toEqual({ label: 'Anúncio', example: 'Seu anúncio aqui' })
    expect(messages['en-US'].system.support).toBe('Sponsor this project')
    expect(messages['pt-BR'].system.support).toBe('Patrocine este projeto')
    // ? The consumer's own value still wins, and the package page texts never leak
    expect(messages['en-US'].page.copyPage).toBe('Copy page')
    expect(messages['pt-BR'].page.copyPage).toBe('Copiar página')
    expect(messages['en-US']._.home).toBeDefined()
    expect(Object.keys(messages['en-US']._)).toEqual(['home'])
  })

  it('provides the settings dialog strings to a consumer that defines none', () => {
    // ? consumers ship their own language files; without engine defaults these
    //   keys would render as raw key paths in every consumer project
    const messages = buildMessages({
      langModules,
      mdModules,
      books: {},
      boot,
      langs: ['en-US', 'pt-BR']
    })

    expect(messages['en-US'].settings.appearance).toEqual({
      _: 'Appearance',
      theme: {
        _: 'Theme',
        auto: 'Auto',
        light: 'Light',
        dark: 'Dark'
      }
    })
    expect(messages['en-US'].settings.general.language._).toBe('Language')

    expect(messages['pt-BR'].settings.appearance.theme).toEqual({
      _: 'Tema',
      auto: 'Automático',
      light: 'Claro',
      dark: 'Escuro'
    })
    expect(messages['pt-BR'].settings.general._).toBe('Configurações gerais')
  })

  it('lets a consumer override a settings label without losing the rest', () => {
    const messages = buildMessages({
      langModules: {
        ...langModules,
        './languages/en-US.hjson': {
          ...langModules['./languages/en-US.hjson'],
          settings: {
            appearance: {
              theme: {
                _: 'Colour Scheme'
              }
            }
          }
        }
      },
      mdModules,
      books: {},
      boot,
      langs: ['en-US']
    })

    expect(messages['en-US'].settings.appearance.theme._).toBe('Colour Scheme')
    // ? the deep merge keeps the engine defaults the consumer did not touch
    expect(messages['en-US'].settings.appearance.theme.auto).toBe('Auto')
    expect(messages['en-US'].settings.appearance._).toBe('Appearance')
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

describe('homepage frontmatter', () => {
  it('extracts the heading from below the frontmatter block', () => {
    const messages = buildMessages({
      langModules,
      mdModules: {
        '../pages/Homepage.en-US.md': '---\ntitle: Meta Title\n---\n\n# Real Home\n\nBody'
      },
      books: {},
      boot,
      langs: ['en-US']
    })

    expect(messages['en-US']._.home._).toBe('Real Home')
  })

  it('extracts the heading from a frontmattered remote README override', () => {
    const messages = buildMessages({
      langModules,
      mdModules,
      homePageOverride: {
        'en-US': '---\ntitle: Repo Meta\n---\n\n# Remote Title\n\nBody'
      },
      books: {},
      boot,
      langs: ['en-US']
    })

    expect(messages['en-US']._.home._).toBe('Remote Title')
  })
})
