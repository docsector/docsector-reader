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
    },
    metadata: {
      tags: {
        'en-US': 'page container scroll toolbar drawer layout subpage tabs',
        'pt-BR': 'página container scroll toolbar drawer layout subpágina abas'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'subpage wrapper composition dh1 section hash',
        'pt-BR': 'subpágina wrapper composição dh1 seção hash'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'section markdown renderer tokenizer parser heading paragraph list table code',
        'pt-BR': 'seção markdown renderizador tokenizador parser título parágrafo lista tabela código'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'h1 h2 h3 h4 h5 h6 heading title anchor navigation toc',
        'pt-BR': 'h1 h2 h3 h4 h5 h6 título heading âncora navegação toc'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'code syntax highlight prism php bash html copy clipboard line numbers',
        'pt-BR': 'código sintaxe highlight prism php bash html copiar clipboard números linha'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'blockquote important warning note quote',
        'pt-BR': 'blockquote importante aviso nota citação'
      }
    }
  },

  '/components/d-page-expandable': {
    config: {
      icon: 'unfold_more',
      status: 'done',
      meta: {
        description: {
          'en-US': 'DPageExpandable — Documentation of Docsector Reader',
          'pt-BR': 'DPageExpandable — Documentacao do Docsector Reader'
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
      'en-US': { title: 'DPageExpandable' },
      'pt-BR': { title: 'DPageExpandable' }
    },
    metadata: {
      tags: {
        'en-US': 'expandable collapsible accordion disclosure details markdown toggle',
        'pt-BR': 'expansível colapsável acordeão detalhes markdown alternância'
      }
    }
  },

  // =========================================================================
  // Components — Navigation
  // =========================================================================
  '/components/d-menu': {
    config: {
      icon: 'menu_open',
      status: 'new',
      version: 'v2.1.0',
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
    },
    metadata: {
      tags: {
        'en-US': 'menu sidebar navigation search branding links tree expansion',
        'pt-BR': 'menu lateral navegação busca branding links árvore expansão'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'anchor toc table contents tree drawer navigation scroll',
        'pt-BR': 'âncora toc índice conteúdo árvore drawer navegação scroll'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'meta footer edit github translation progress prev next navigation',
        'pt-BR': 'meta rodapé editar github tradução progresso anterior próximo navegação'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'zoom overlay fullscreen scale mouse wheel escape',
        'pt-BR': 'zoom overlay tela cheia escala roda mouse escape'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'navigator composable anchor scroll register navigate toc',
        'pt-BR': 'navegador composable âncora scroll registro navegar toc'
      }
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
    },
    metadata: {
      tags: {
        'en-US': 'vuex store state mutations getters actions app i18n page layout settings',
        'pt-BR': 'vuex store estado mutations getters actions app i18n page layout settings'
      }
    }
  }
}
