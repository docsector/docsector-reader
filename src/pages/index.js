/**
 * Docsector Reader - Pages Registry
 *
 * Define your documentation pages here. Each entry maps a URL path
 * to its configuration, data (titles per language), and optional metadata.
 *
 * config.type: determines the top-level route prefix (e.g., 'manual', 'guide', 'API')
 * config.status: 'done' | 'draft' | 'empty'
 * config.icon: Material Design icon name
 * config.menu: menu display options (header, subheader, separator)
 * config.subpages: { showcase: bool, vs: bool }
 * data: per-language titles (use '*' for all languages)
 * meta: per-language section/translation counts
 *
 * Set config to null for category nodes (non-navigable groupings).
 */
export default {
  // =========================================================================
  // Guides
  // =========================================================================
  '/getting-started': {
    config: {
      icon: 'flag',
      status: 'done',
      type: 'guide',
      menu: {
        header: {
          icon: 'school',
          label: 'Guides'
        }
      },
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Getting Started' },
      'pt-BR': { title: 'Começando' }
    }
  },

  '/configuration': {
    config: {
      icon: 'tune',
      status: 'done',
      type: 'guide',
      menu: {
        separator: ' page'
      },
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Configuration' },
      'pt-BR': { title: 'Configuração' }
    }
  },

  '/pages-and-routing': {
    config: {
      icon: 'route',
      status: 'done',
      type: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Pages & Routing' },
      'pt-BR': { title: 'Páginas & Rotas' }
    }
  },

  '/i18n-and-markdown': {
    config: {
      icon: 'translate',
      status: 'done',
      type: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'i18n & Markdown' },
      'pt-BR': { title: 'i18n & Markdown' }
    }
  },

  '/theming': {
    config: {
      icon: 'palette',
      status: 'done',
      type: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Theming' },
      'pt-BR': { title: 'Temas' }
    }
  },

  '/deployment': {
    config: {
      icon: 'cloud_upload',
      status: 'draft',
      type: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Deployment' },
      'pt-BR': { title: 'Deploy' }
    }
  },

  '/plugins': {
    config: {
      icon: 'extension',
      status: 'empty',
      type: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Plugins' },
      'pt-BR': { title: 'Plugins' }
    }
  },

  // =========================================================================
  // Components — Layout
  // =========================================================================
  '/components': {
    config: null,
    data: {
      'en-US': { title: 'Components' },
      'pt-BR': { title: 'Componentes' }
    }
  },

  '/components/d-page': {
    config: {
      icon: 'web',
      status: 'done',
      type: 'manual',
      menu: {
        header: {
          icon: 'widgets',
          label: 'Components'
        },
        subheader: '.components'
      },
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'DPage' },
      'pt-BR': { title: 'DPage' }
    }
  },

  '/components/d-subpage': {
    config: {
      icon: 'layers',
      status: 'done',
      type: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'DSubpage' },
      'pt-BR': { title: 'DSubpage' }
    }
  },

  '/components/d-page-section': {
    config: {
      icon: 'article',
      status: 'done',
      type: 'manual',
      menu: {
        separator: ' page'
      },
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'DPageSection' },
      'pt-BR': { title: 'DPageSection' }
    }
  },

  // =========================================================================
  // Components — Content
  // =========================================================================
  '/components/d-headings': {
    config: {
      icon: 'title',
      status: 'done',
      type: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'DH1 – DH6 (Headings)' },
      'pt-BR': { title: 'DH1 – DH6 (Títulos)' }
    }
  },

  '/components/d-page-source-code': {
    config: {
      icon: 'code',
      status: 'done',
      type: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'DPageSourceCode' },
      'pt-BR': { title: 'DPageSourceCode' }
    }
  },

  '/components/d-page-blockquote': {
    config: {
      icon: 'format_quote',
      status: 'done',
      type: 'manual',
      menu: {
        separator: ' page'
      },
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'DPageBlockquote' },
      'pt-BR': { title: 'DPageBlockquote' }
    }
  },

  // =========================================================================
  // Components — Navigation
  // =========================================================================
  '/components/d-menu': {
    config: {
      icon: 'menu_open',
      status: 'done',
      type: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'DMenu' },
      'pt-BR': { title: 'DMenu' }
    }
  },

  '/components/d-page-anchor': {
    config: {
      icon: 'account_tree',
      status: 'done',
      type: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'DPageAnchor' },
      'pt-BR': { title: 'DPageAnchor' }
    }
  },

  '/components/d-page-meta': {
    config: {
      icon: 'info',
      status: 'done',
      type: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'DPageMeta' },
      'pt-BR': { title: 'DPageMeta' }
    }
  },

  // =========================================================================
  // Components — Utility
  // =========================================================================
  '/components/q-zoom': {
    config: {
      icon: 'zoom_in',
      status: 'done',
      type: 'manual',
      menu: {
        separator: ' page'
      },
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'QZoom' },
      'pt-BR': { title: 'QZoom' }
    }
  },

  // =========================================================================
  // Composables
  // =========================================================================
  '/composables': {
    config: null,
    data: {
      'en-US': { title: 'Composables' },
      'pt-BR': { title: 'Composables' }
    }
  },

  '/composables/use-navigator': {
    config: {
      icon: 'navigation',
      status: 'done',
      type: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'useNavigator' },
      'pt-BR': { title: 'useNavigator' }
    }
  },

  // =========================================================================
  // Store
  // =========================================================================
  '/store': {
    config: null,
    data: {
      'en-US': { title: 'Store' },
      'pt-BR': { title: 'Store' }
    }
  },

  '/store/modules': {
    config: {
      icon: 'storage',
      status: 'done',
      type: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Vuex Modules' },
      'pt-BR': { title: 'Módulos Vuex' }
    }
  }
}
