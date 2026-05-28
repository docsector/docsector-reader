export default {
  // =========================================================================
  // Basic
  // =========================================================================
  '/basic': {
    config: null,
    data: {
      'en-US': { title: 'Basic' },
      'pt-BR': { title: 'Básico' }
    }
  },

  '/basic/d-menu': {
    config: {
      icon: 'menu_open',
      status: 'new',
      version: 'v2.1.0',
      meta: {
        description: {
          'en-US': 'Navigation Menu — Documentation of Docsector Reader',
          'pt-BR': 'Menu de Navegação — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {
        subheader: '.basic'
      },
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Navigation Menu' },
      'pt-BR': { title: 'Menu de Navegação' }
    },
    metadata: {
      tags: {
        'en-US': 'menu sidebar navigation search branding links tree expansion',
        'pt-BR': 'menu lateral navegação busca branding links árvore expansão'
      }
    }
  },

  '/basic/search': {
    config: {
      icon: 'search',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Search — Documentation of Docsector Reader',
          'pt-BR': 'Busca — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Search' },
      'pt-BR': { title: 'Busca' }
    },
    metadata: {
      tags: {
        'en-US': 'search sidebar filter tags markdown locale fallback results',
        'pt-BR': 'busca lateral filtro tags markdown locale fallback resultados'
      }
    }
  },

  '/basic/branding': {
    config: {
      icon: 'branding_watermark',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Branding — Documentation of Docsector Reader',
          'pt-BR': 'Branding — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Branding' },
      'pt-BR': { title: 'Branding' }
    },
    metadata: {
      tags: {
        'en-US': 'branding logo project name links changelog roadmap sponsor menu',
        'pt-BR': 'branding logo nome do projeto links changelog roadmap sponsor menu'
      }
    }
  },

  '/basic/version-switcher': {
    config: {
      icon: 'swap_horiz',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Version Switcher — Documentation of Docsector Reader',
          'pt-BR': 'Seletor de Versão — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Version Switcher' },
      'pt-BR': { title: 'Seletor de Versão' }
    },
    metadata: {
      tags: {
        'en-US': 'version switcher releases draft deprecated archived routes selector badge',
        'pt-BR': 'versão seletor releases draft deprecated rotas arquivadas badge'
      }
    }
  },

  '/basic/d-page-anchor': {
    config: {
      icon: 'account_tree',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Table of Contents — Documentation of Docsector Reader',
          'pt-BR': 'Índice da Página — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Table of Contents' },
      'pt-BR': { title: 'Índice da Página' }
    },
    metadata: {
      tags: {
        'en-US': 'anchor toc table contents tree drawer navigation scroll',
        'pt-BR': 'âncora toc índice conteúdo árvore drawer navegação scroll'
      }
    }
  },

  '/basic/d-page-meta': {
    config: {
      icon: 'info',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Page Footer — Documentation of Docsector Reader',
          'pt-BR': 'Rodapé da Página — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Page Footer' },
      'pt-BR': { title: 'Rodapé da Página' }
    },
    metadata: {
      tags: {
        'en-US': 'meta footer edit github translation progress prev next navigation',
        'pt-BR': 'meta rodapé editar github tradução progresso anterior próximo navegação'
      }
    }
  },

  '/basic/edit-on-github': {
    config: {
      icon: 'edit_note',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Edit on GitHub — Documentation of Docsector Reader',
          'pt-BR': 'Editar no GitHub — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Edit on GitHub' },
      'pt-BR': { title: 'Editar no GitHub' }
    },
    metadata: {
      tags: {
        'en-US': 'edit github source markdown status draft empty done footer',
        'pt-BR': 'editar github fonte markdown status draft empty done rodapé'
      }
    }
  },

  '/basic/translation-progress': {
    config: {
      icon: 'translate',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Translation Progress — Documentation of Docsector Reader',
          'pt-BR': 'Progresso de Tradução — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Translation Progress' },
      'pt-BR': { title: 'Progresso de Tradução' }
    },
    metadata: {
      tags: {
        'en-US': 'translation progress locales sections i18n footer chips',
        'pt-BR': 'tradução progresso locales seções i18n rodapé chips'
      }
    }
  },

  '/basic/previous-and-next': {
    config: {
      icon: 'last_page',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Previous & Next — Documentation of Docsector Reader',
          'pt-BR': 'Anterior e Próximo — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Previous & Next' },
      'pt-BR': { title: 'Anterior e Próximo' }
    },
    metadata: {
      tags: {
        'en-US': 'previous next navigation adjacent routes footer sequence',
        'pt-BR': 'anterior próximo navegação rotas adjacentes rodapé sequência'
      }
    }
  },

  // =========================================================================
  // Content
  // =========================================================================
  '/content': {
    config: null,
    data: {
      'en-US': { title: 'Content' },
      'pt-BR': { title: 'Conteúdo' }
    }
  },

  '/content/blocks': {
    config: null,
    data: {
      'en-US': { title: 'Blocks' },
      'pt-BR': { title: 'Blocos' }
    }
  },

  '/content/blocks/paragraphs': {
    config: {
      icon: 'subject',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Paragraphs — Documentation of Docsector Reader',
          'pt-BR': 'Parágrafos — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {
        header: {
          icon: 'notes',
          label: 'Content'
        },
        subheader: '.content.blocks'
      },
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Paragraphs' },
      'pt-BR': { title: 'Parágrafos' }
    },
    metadata: {
      tags: {
        'en-US': 'paragraph text prose emphasis bold italic links inline code markdown',
        'pt-BR': 'parágrafo texto prosa ênfase negrito itálico links código inline markdown'
      }
    }
  },

  '/content/blocks/headings': {
    config: {
      icon: 'title',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Headings — Documentation of Docsector Reader',
          'pt-BR': 'Títulos — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Headings' },
      'pt-BR': { title: 'Títulos' }
    },
    metadata: {
      tags: {
        'en-US': 'h1 h2 h3 h4 h5 h6 heading title anchor navigation toc',
        'pt-BR': 'h1 h2 h3 h4 h5 h6 título heading âncora navegação toc'
      }
    }
  },

  '/content/blocks/unordered-lists': {
    config: {
      icon: 'format_list_bulleted',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Unordered lists — Documentation of Docsector Reader',
          'pt-BR': 'Listas não ordenadas — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Unordered lists' },
      'pt-BR': { title: 'Listas não ordenadas' }
    },
    metadata: {
      tags: {
        'en-US': 'unordered list bullets nested markdown items',
        'pt-BR': 'lista não ordenada marcadores aninhada markdown itens'
      }
    }
  },

  '/content/blocks/ordered-lists': {
    config: {
      icon: 'format_list_numbered',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Ordered lists — Documentation of Docsector Reader',
          'pt-BR': 'Listas ordenadas — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Ordered lists' },
      'pt-BR': { title: 'Listas ordenadas' }
    },
    metadata: {
      tags: {
        'en-US': 'ordered list numbered nested markdown items',
        'pt-BR': 'lista ordenada numerada aninhada markdown itens'
      }
    }
  },

  '/content/blocks/task-lists': {
    config: {
      icon: 'check_box',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Task lists — Documentation of Docsector Reader',
          'pt-BR': 'Listas de tarefas — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Task lists' },
      'pt-BR': { title: 'Listas de tarefas' }
    },
    metadata: {
      tags: {
        'en-US': 'task list checklist checkbox todo done pending nested markdown gitbook',
        'pt-BR': 'lista de tarefas checklist checkbox todo concluído pendente aninhada markdown gitbook'
      }
    }
  },

  '/content/blocks/hints': {
    config: {
      icon: 'lightbulb',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Hints — Documentation of Docsector Reader',
          'pt-BR': 'Dicas — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Hints' },
      'pt-BR': { title: 'Dicas' }
    },
    metadata: {
      tags: {
        'en-US': 'hint alerts note tip important warning caution callout blockquote',
        'pt-BR': 'dica alertas nota tip importante aviso cautela callout blockquote'
      }
    }
  },

  '/content/blocks/quotes': {
    config: {
      icon: 'format_quote',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Quote — Documentation of Docsector Reader',
          'pt-BR': 'Citação — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Quote' },
      'pt-BR': { title: 'Citação' }
    },
    metadata: {
      tags: {
        'en-US': 'quote blockquote citation pull quote markdown',
        'pt-BR': 'citação blockquote quote markdown destaque'
      }
    }
  },

  '/content/blocks/code-blocks': {
    config: {
      icon: 'code',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Code blocks — Documentation of Docsector Reader',
          'pt-BR': 'Blocos de código — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Code blocks' },
      'pt-BR': { title: 'Blocos de código' }
    },
    metadata: {
      tags: {
        'en-US': 'code syntax highlight prism php bash html copy clipboard line numbers',
        'pt-BR': 'código sintaxe highlight prism php bash html copiar clipboard números linha'
      }
    }
  },

  '/content/blocks/mermaid-diagrams': {
    config: {
      icon: 'account_tree',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Mermaid diagrams — Documentation of Docsector Reader',
          'pt-BR': 'Diagramas Mermaid — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Mermaid diagrams' },
      'pt-BR': { title: 'Diagramas Mermaid' }
    },
    metadata: {
      tags: {
        'en-US': 'mermaid diagram flowchart sequence graph chart markdown',
        'pt-BR': 'mermaid diagrama fluxograma sequência grafo gráfico markdown'
      }
    }
  },

  '/content/blocks/images': {
    config: {
      icon: 'image',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Images — Documentation of Docsector Reader',
          'pt-BR': 'Imagens — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Images' },
      'pt-BR': { title: 'Imagens' }
    },
    metadata: {
      tags: {
        'en-US': 'images media markdown alt text captions zoom',
        'pt-BR': 'imagens mídia markdown texto alternativo legendas zoom'
      }
    }
  },

  '/content/blocks/files': {
    config: {
      icon: 'attach_file',
      status: 'new',
      version: 'v3.3.0',
      meta: {
        description: {
          'en-US': 'Files — Documentation of Docsector Reader',
          'pt-BR': 'Arquivos — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Files' },
      'pt-BR': { title: 'Arquivos' }
    },
    metadata: {
      tags: {
        'en-US': 'files download attachments markdown assets public r2 cloudflare github',
        'pt-BR': 'arquivos download anexos markdown assets public r2 cloudflare github'
      }
    }
  },

  '/content/blocks/embedded-urls': {
    config: {
      icon: 'link',
      status: 'new',
      meta: {
        description: {
          'en-US': 'Embedded URLs — Documentation of Docsector Reader',
          'pt-BR': 'URLs embutidas — Documentação do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Embedded URLs' },
      'pt-BR': { title: 'URLs embutidas' }
    },
    metadata: {
      tags: {
        'en-US': 'embed embedded url youtube vimeo spotify codepen iframe preview external link gitbook',
        'pt-BR': 'embed url embutida youtube vimeo spotify codepen iframe preview link externo gitbook'
      }
    }
  },

  '/content/blocks/math-and-tex': {
    config: {
      icon: 'functions',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Math & TeX — Documentation of Docsector Reader',
          'pt-BR': 'Math & TeX — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Math & TeX' },
      'pt-BR': { title: 'Math & TeX' }
    },
    metadata: {
      tags: {
        'en-US': 'math tex katex latex equations formulas inline display',
        'pt-BR': 'matemática tex katex latex equações fórmulas inline display'
      }
    }
  },

  '/content/blocks/expandable': {
    config: {
      icon: 'unfold_more',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Expandable — Documentation of Docsector Reader',
          'pt-BR': 'Expansível — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Expandable' },
      'pt-BR': { title: 'Expansível' }
    },
    metadata: {
      tags: {
        'en-US': 'expandable collapsible accordion disclosure details markdown toggle',
        'pt-BR': 'expansível colapsável acordeão detalhes markdown alternância'
      }
    }
  },

  '/content/blocks/tables': {
    config: {
      icon: 'table_chart',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Tables — Documentation of Docsector Reader',
          'pt-BR': 'Tabelas — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Tables' },
      'pt-BR': { title: 'Tabelas' }
    },
    metadata: {
      tags: {
        'en-US': 'table markdown rows columns alignment data',
        'pt-BR': 'tabela markdown linhas colunas alinhamento dados'
      }
    }
  },

  '/content/blocks/raw-html': {
    config: {
      icon: 'html',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Raw HTML — Documentation of Docsector Reader',
          'pt-BR': 'HTML bruto — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Raw HTML' },
      'pt-BR': { title: 'HTML bruto' }
    },
    metadata: {
      tags: {
        'en-US': 'raw html markup inline block custom elements markdown',
        'pt-BR': 'html bruto marcação inline bloco elementos customizados markdown'
      }
    }
  },

  '/content/blocks/quick-links': {
    config: {
      icon: 'dashboard',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Quick Links — Documentation of Docsector Reader',
          'pt-BR': 'Quick Links — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: true
      }
    },
    data: {
      'en-US': { title: 'Quick Links' },
      'pt-BR': { title: 'Quick Links' }
    },
    metadata: {
      tags: {
        'en-US': 'quick links cards navigation callout homepage links',
        'pt-BR': 'quick links cards navegação callout homepage links'
      }
    }
  },

  '/content/structures': {
    config: null,
    data: {
      'en-US': { title: 'Structures' },
      'pt-BR': { title: 'Estruturas' }
    }
  },

  '/content/structures/books': {
    config: {
      icon: 'menu_book',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Books — Documentation of Docsector Reader',
          'pt-BR': 'Books — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {
        subheader: '.content.structures'
      },
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Books' },
      'pt-BR': { title: 'Books' }
    },
    metadata: {
      tags: {
        'en-US': 'book books tabs manual guide registry definebook label icon order color',
        'pt-BR': 'book books abas manual guide registro definebook label ícone ordem cor'
      }
    }
  },

  '/content/structures/page': {
    config: {
      icon: 'web',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Page — Documentation of Docsector Reader',
          'pt-BR': 'Página — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Page' },
      'pt-BR': { title: 'Página' }
    },
    metadata: {
      tags: {
        'en-US': 'page container scroll toolbar drawer layout subpage tabs',
        'pt-BR': 'página container scroll toolbar drawer layout subpágina abas'
      }
    }
  },

  '/content/structures/subpage': {
    config: {
      icon: 'layers',
      status: 'done',
      meta: {
        description: {
          'en-US': 'Subpage — Documentation of Docsector Reader',
          'pt-BR': 'Subpágina — Documentacao do Docsector Reader'
        }
      },
      book: 'manual',
      menu: {},
      subpages: {
        showcase: false
      }
    },
    data: {
      'en-US': { title: 'Subpage' },
      'pt-BR': { title: 'Subpágina' }
    },
    metadata: {
      tags: {
        'en-US': 'subpage wrapper composition dh1 section hash',
        'pt-BR': 'subpágina wrapper composição dh1 seção hash'
      }
    }
  }
}
