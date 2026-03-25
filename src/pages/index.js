/**
 * Docsector Reader - Pages Registry
 *
 * Define your documentation pages here. Each entry maps a URL path
 * to its configuration, data (titles per language), and optional metadata.
 *
 * config.type: determines the top-level route prefix (e.g., 'manual', 'guide', 'API')
 * config.status: 'done' | 'draft' | 'empty'
 * config.meta.description: string or localized object for SEO/social description
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
      meta: {
        description: {
          'en-US': 'Getting Started — Documentation of Docsector Reader',
          'pt-BR': 'Começando — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'Configuration — Documentation of Docsector Reader',
          'pt-BR': 'Configuração — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'Pages & Routing — Documentation of Docsector Reader',
          'pt-BR': 'Páginas & Rotas — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'i18n & Markdown — Documentation of Docsector Reader',
          'pt-BR': 'i18n & Markdown — Documentacao do Docsector Reader'
        }
      },
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

  '/alerts-and-blockquotes': {
    config: {
      icon: 'notification_important',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Alerts & Blockquotes — Documentation of Docsector Reader',
          'pt-BR': 'Alertas & Blockquotes — Documentacao do Docsector Reader'
        }
      },
      type: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Alerts & Blockquotes' },
      'pt-BR': { title: 'Alertas & Blockquotes' }
    }
  },

  '/theming': {
    config: {
      icon: 'palette',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Theming — Documentation of Docsector Reader',
          'pt-BR': 'Temas — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'Deployment — Documentation of Docsector Reader',
          'pt-BR': 'Deploy — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'Plugins — Documentation of Docsector Reader',
          'pt-BR': 'Plugins — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'DPage — Documentation of Docsector Reader',
          'pt-BR': 'DPage — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'DSubpage — Documentation of Docsector Reader',
          'pt-BR': 'DSubpage — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'DPageSection — Documentation of Docsector Reader',
          'pt-BR': 'DPageSection — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'DH1 – DH6 (Headings) — Documentation of Docsector Reader',
          'pt-BR': 'DH1 – DH6 (Títulos) — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'DPageSourceCode — Documentation of Docsector Reader',
          'pt-BR': 'DPageSourceCode — Documentacao do Docsector Reader'
        }
      },
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

  '/components/d-mermaid-diagram': {
    config: {
      icon: 'account_tree',
      status: 'done',
      meta: {
        description: {
          'en-US': 'DMermaidDiagram — Documentation of Docsector Reader',
          'pt-BR': 'DMermaidDiagram — Documentacao do Docsector Reader'
        }
      },
      type: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'DMermaidDiagram' },
      'pt-BR': { title: 'DMermaidDiagram' }
    }
  },

  '/components/d-page-blockquote': {
    config: {
      icon: 'format_quote',
      status: 'done',
      meta: {
        description: {
          'en-US': 'DPageBlockquote — Documentation of Docsector Reader',
          'pt-BR': 'DPageBlockquote — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'DMenu — Documentation of Docsector Reader',
          'pt-BR': 'DMenu — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'DPageAnchor — Documentation of Docsector Reader',
          'pt-BR': 'DPageAnchor — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'DPageMeta — Documentation of Docsector Reader',
          'pt-BR': 'DPageMeta — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'QZoom — Documentation of Docsector Reader',
          'pt-BR': 'QZoom — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'useNavigator — Documentation of Docsector Reader',
          'pt-BR': 'useNavigator — Documentacao do Docsector Reader'
        }
      },
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
      meta: {
        description: {
          'en-US': 'Vuex Modules — Documentation of Docsector Reader',
          'pt-BR': 'Módulos Vuex — Documentacao do Docsector Reader'
        }
      },
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
