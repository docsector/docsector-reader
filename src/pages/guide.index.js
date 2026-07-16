export default {
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
      book: 'guide',
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
    },
    metadata: {
      tags: {
        'en-US': 'install setup start begin quick project structure',
        'pt-BR': 'instalar configurar iniciar começar rápido projeto estrutura'
      }
    }
  },

  '/configuration': {
    config: {
      icon: 'tune',
      status: 'done',
      version: 'v2.1.0',
      meta: {
        description: {
          'en-US': 'Configuration — Documentation of Docsector Reader',
          'pt-BR': 'Configuração — Documentacao do Docsector Reader'
        }
      },
      book: 'guide',
      menu: {
        separators: {
          lineBottom: 'page'
        }
      },
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Configuration' },
      'pt-BR': { title: 'Configuração' }
    },
    metadata: {
      tags: {
        'en-US': 'config branding logo name version language links github docsector.config.js',
        'pt-BR': 'config branding logo nome versão idioma links github docsector.config.js'
      }
    }
  },

  '/pages-and-routing': {
    config: {
      icon: 'route',
      status: 'new',
      version: 'v2.1.0',
      meta: {
        description: {
          'en-US': 'Pages & Routing — Documentation of Docsector Reader',
          'pt-BR': 'Páginas & Rotas — Documentacao do Docsector Reader'
        }
      },
      book: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Pages & Routing' },
      'pt-BR': { title: 'Páginas & Rotas' }
    },
    metadata: {
      tags: {
        'en-US': 'pages routes routing registry menu navigation path type status subpages',
        'pt-BR': 'páginas rotas roteamento registro menu navegação caminho tipo status subpages'
      }
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
      book: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'i18n & Markdown' },
      'pt-BR': { title: 'i18n & Markdown' }
    },
    metadata: {
      tags: {
        'en-US': 'i18n internationalization language locale hjson markdown content translation',
        'pt-BR': 'i18n internacionalização idioma locale hjson markdown conteúdo tradução'
      }
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
      book: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Theming' },
      'pt-BR': { title: 'Temas' }
    },
    metadata: {
      tags: {
        'en-US': 'theme dark light mode color css sass variables styling',
        'pt-BR': 'tema escuro claro modo cor css sass variáveis estilização'
      }
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
      book: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Deployment' },
      'pt-BR': { title: 'Deploy' }
    },
    metadata: {
      tags: {
        'en-US': 'deploy hosting production build static nginx netlify vercel github pages',
        'pt-BR': 'deploy hospedagem produção build estático nginx netlify vercel github pages'
      }
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
      book: 'guide',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Plugins' },
      'pt-BR': { title: 'Plugins' }
    },
    metadata: {
      tags: {
        'en-US': 'plugins extensions addons customize',
        'pt-BR': 'plugins extensões complementos customizar'
      }
    }
  }
}
