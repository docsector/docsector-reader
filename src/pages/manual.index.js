export default {
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
      book: 'manual',
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
