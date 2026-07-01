import pkg from './package.json' with { type: 'json' }

/**
 * Docsector Reader Configuration
 *
 * This file allows you to customize the documentation reader
 * for your specific project. Replace the values below with
 * your project's branding, links, and GitHub configuration.
 */
export default {
  // @ Branding
  branding: {
    // Logo image path (relative to public/)
    logo: '/images/logo.png',
    // Project name displayed in the sidebar
    name: 'Docsector Reader',
    // Version label displayed next to the name
    version: 'v' + pkg.version,
    versions: [
      {
        id: 'v' + pkg.version,
        current: true,
        released: false
      },
      {
        id: 'v0.x',
        released: true,
        status: 'deprecated'
      }
    ]
  },

  // @ Links
  links: {
    github: 'https://github.com/docsector/docsector-reader',
    discussions: 'https://github.com/docsector/docsector-reader/discussions',
    chat: null, // e.g., Discord/Slack invite URL
    email: null, // e.g., 'mailto:contact@example.com'
    changelog: 'https://github.com/docsector/docsector-reader/releases',
    roadmap: null, // e.g., external roadmap URL
    sponsor: null, // e.g., GitHub Sponsors URL
    explore: null // e.g., URL to explore related repos
  },

  // @ GitHub
  github: {
    // Base URL for "Edit on GitHub" links
    // The page path will be appended to this URL
    editBaseUrl: 'https://github.com/docsector/docsector-reader/edit/main/src/pages',
    // Show the repository star count as a badge on the GitHub button in the menu.
    // Opt-in: set to true to enable. The repo is derived from `links.github`.
    // Uses the unauthenticated GitHub API (60 req/hour/IP), cached for 6h in localStorage.
    stars: true
  },

  // @ Site URL
  // Used for absolute sitemap, llms.txt, MCP, and AI Search metadata URLs.
  siteUrl: 'https://docsector.com',

  // @ MCP
  mcp: {
    serverName: 'docsector-docs',
    toolSuffix: 'docsector'
  },

  // @ AI Assistant
  aiAssistant: {
    enabled: true,
    provider: 'aiSearch',
    endpoint: '/assistant',
    ui: {
      title: 'Docsector AI Assistant',
      subtitle: 'Ask, search, or explain the docs.',
      drawerWidth: 380,
      wideBreakpoint: 1280,
      showCitations: true,
      suggestedPrompts: [
        'How do I get started?',
        'Summarize this page.',
        'Where is the related API reference?'
      ]
    },
    aiSearch: {
      binding: 'AI_SEARCH',
      instanceNameEnv: 'AI_SEARCH_INSTANCE_NAME',
      namespace: '',
      accountIdEnv: 'CLOUDFLARE_ACCOUNT_ID',
      apiTokenEnv: 'CLOUDFLARE_API_TOKEN',
      model: '@cf/meta/llama-4-scout-17b-16e-instruct',
      retrievalType: 'vector',
      maxResults: 10,
      matchThreshold: 0.4,
      contextExpansion: 1,
      queryRewrite: {
        enabled: false
      },
      reranking: {
        enabled: false,
        model: '@cf/baai/bge-reranker-base',
        matchThreshold: 0.4
      },
      stream: true
    }
  },

  // @ Agent Skills
  agentSkills: {
    enabled: true,
    path: '/.well-known/agent-skills/index.json',
    schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'docsector-documentation-authoring',
        type: 'skill-md',
        description: 'Author Docsector documentation with Markdown, custom blocks, MCP, and WebMCP.',
        url: '/.well-known/agent-skills/docsector-documentation-authoring/SKILL.md'
      }
    ]
  },

  // @ Home page source
  homePage: {
    source: 'remote-readme',
    layout: 'default',
    remoteReadmeUrl: 'https://raw.githubusercontent.com/docsector/docsector-reader/main/README.md',
    timeoutMs: 8000,
    fallbackToLocal: true
  },

  // @ Languages
  languages: [
    {
      image: '/images/flags/united-states-of-america.png',
      label: 'English (US)',
      value: 'en-US'
    },
    {
      image: '/images/flags/brazil.png',
      label: 'Português (BR)',
      value: 'pt-BR'
    }
  ],

  // @ Default language
  defaultLanguage: 'en-US',
  contentSignals: {
    enabled: true
  }
}
