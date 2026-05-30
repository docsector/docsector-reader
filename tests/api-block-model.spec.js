import { describe, expect, it } from 'vitest'

import {
  createApiBlockModel,
  defaultInnerTabName,
  getApiCount,
  getFilteredApi
} from '../src/components/api-block-model.js'

describe('api-block-model', () => {
  it('builds a Quasar-compatible model and removes internal entries', () => {
    const model = createApiBlockModel('/quasar-api/QBtn.json', {
      meta: {
        docsUrl: 'https://v2.quasar.dev/vue-components/button'
      },
      mixins: ['components/btn/use-btn'],
      props: {
        round: {
          type: 'Boolean',
          desc: 'Makes a circle shaped button',
          category: 'style'
        },
        percentage: {
          type: 'Number',
          desc: 'Display a progress bar on the background',
          category: 'behavior'
        }
      },
      methods: {
        click: {
          desc: 'Emulate click on QBtn',
          params: {
            evt: {
              type: 'Event',
              desc: 'Native event',
              required: true
            }
          },
          returns: {
            type: 'void',
            desc: 'No return value'
          }
        }
      },
      events: {
        click: {
          desc: 'Emitted when the component is clicked'
        },
        mousedown: {
          internal: true,
          desc: 'Internal only'
        }
      },
      internal: {
        hidden: {
          desc: 'Should never render'
        }
      }
    })

    expect(model.title).toBe('QBtn API')
    expect(model.docsUrl).toBe('https://v2.quasar.dev/vue-components/button')
    expect(model.docsLink).toBe('/vue-components/button')
    expect(model.tabs).toEqual(['props', 'methods', 'events'])
    expect(model.innerTabs.props).toEqual(['behavior', 'style'])
    expect(model.api.props.behavior).toEqual({
      percentage: {
        type: 'Number',
        desc: 'Display a progress bar on the background',
        category: 'behavior'
      }
    })
    expect(model.api.events[defaultInnerTabName]).toEqual({
      click: {
        desc: 'Emitted when the component is clicked'
      }
    })
  })

  it('filters entries and keeps counts in sync for grouped and flat tabs', () => {
    const model = createApiBlockModel('QBtn.json', {
      props: {
        percentage: {
          type: 'Number',
          desc: 'Display a progress bar on the background',
          category: 'behavior'
        },
        round: {
          type: 'Boolean',
          desc: 'Makes a circle shaped button',
          category: 'style'
        }
      },
      methods: {
        click: {
          desc: 'Emulate click on QBtn'
        }
      }
    })
    const filtered = getFilteredApi(model.api, 'progress', model.tabs, model.innerTabs)
    const counts = getApiCount(filtered, model.tabs, model.innerTabs)

    expect(filtered.props.behavior).toEqual({
      percentage: {
        type: 'Number',
        desc: 'Display a progress bar on the background',
        category: 'behavior'
      }
    })
    expect(filtered.props.style).toEqual({})
    expect(filtered.methods[defaultInnerTabName]).toEqual({})
    expect(counts.props).toEqual({
      overall: 1,
      category: {
        behavior: 1,
        style: 0
      }
    })
    expect(counts.methods).toEqual({
      overall: 0,
      category: {
        [defaultInnerTabName]: 0
      }
    })
  })

  it('keeps generic APIs compatible without inventing a new schema', () => {
    const model = createApiBlockModel('http-client.json', {
      meta: {
        docsUrl: 'https://example.com/sdk/http-client'
      },
      props: {
        baseUrl: {
          type: 'String',
          desc: 'Base URL used by the client',
          category: 'configuration'
        }
      },
      methods: {
        request: {
          desc: 'Perform an HTTP request',
          params: {
            options: {
              type: 'Object',
              desc: 'Request options'
            }
          }
        }
      }
    })

    expect(model.title).toBe('http-client API')
    expect(model.docsLink).toBe('https://example.com/sdk/http-client')
    expect(model.innerTabs.props).toEqual([defaultInnerTabName])
    expect(model.api.props[defaultInnerTabName]).toEqual({
      baseUrl: {
        type: 'String',
        desc: 'Base URL used by the client',
        category: 'configuration'
      }
    })
    expect(model.nothingToShow).toBe(false)
  })

  it('marks the block as empty when no public sections remain', () => {
    const model = createApiBlockModel('hidden.json', {
      internal: {
        hidden: {
          desc: 'No public API'
        }
      }
    })

    expect(model.tabs).toEqual([])
    expect(model.nothingToShow).toBe(true)
  })

  it('resolves Quasar extends definitions so shared props keep their real type and category', () => {
    const model = createApiBlockModel('QSeparator.json', {
      props: {
        dark: {
          extends: 'dark'
        },
        spaced: {
          type: ['Boolean', 'String'],
          desc: 'Adds separator spacing',
          category: 'content'
        },
        inset: {
          type: ['Boolean', 'String'],
          desc: 'Adds inset spacing',
          category: 'content'
        },
        vertical: {
          type: 'Boolean',
          desc: 'Displays the separator vertically',
          category: 'content'
        },
        size: {
          extends: 'size'
        },
        color: {
          extends: 'color'
        }
      },
      events: {
        click: {
          extends: 'click'
        }
      }
    })

    expect(model.innerTabs.props).toEqual(['content', 'style'])
    expect(model.api.props.style.dark).toEqual({
      type: ['Boolean', 'null'],
      default: 'null',
      desc: 'Notify the component that the background is a dark color',
      category: 'style'
    })
    expect(model.api.props.style.size).toEqual({
      type: 'String',
      desc: 'Size in CSS units, including unit name',
      examples: ["'16px'", "'2rem'"],
      category: 'style'
    })
    expect(model.api.props.style.color).toEqual({
      type: 'String',
      tsType: 'NamedColor',
      desc: 'Color name for component from the Quasar Color Palette',
      examples: ["'primary'", "'teal'", "'teal-10'"],
      category: 'style'
    })
    expect(model.api.events[defaultInnerTabName].click.params.evt).toEqual({
      type: 'Event',
      desc: 'JS event object',
      required: true
    })
  })
})