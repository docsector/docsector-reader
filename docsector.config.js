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
  // changelog, roadmap, sponsor and explore[].url take a URL (new tab) or the
  // path of a page of this site, e.g. '/sponsors/' (same tab, highlighted)
  links: {
    website: null, // e.g., project website URL
    github: 'https://github.com/docsector/docsector-reader',
    discussions: 'https://github.com/docsector/docsector-reader/discussions',
    chat: null, // e.g., Discord/Slack invite URL
    email: null, // e.g., 'mailto:contact@example.com'
    changelog: 'https://github.com/docsector/docsector-reader/releases',
    roadmap: null, // e.g., external roadmap URL
    sponsor: null, // e.g., GitHub Sponsors URL, or '/sponsors/' for a standalone page
    explore: null // e.g., URL to explore related repos
  },

  // @ Footer
  // Legal / compliance links rendered in a row above the "Powered by" line.
  // Opt-in: leave `legalLinks` empty (or omit `footer`) to hide the row entirely.
  // Each item: { href: string, label?: string | { 'en-US': string, 'pt-BR': string } }
  // Absolute http(s) URLs open in a new tab automatically (or force it with `external: true`).
  // `copyright` renders on its own line below the "Powered by" credit — a plain
  // string or a per-locale map, shown exactly as written; omit it to hide the line.
  footer: {
    legalLinks: [
      { href: 'https://github.com/docsector/docsector-reader/blob/main/LICENSE.md', label: { 'en-US': 'License', 'pt-BR': 'Licença' } }
    ]
    // copyright: 'Copyright (c) 2024-present Example Corp. and contributors'
  },

  // @ Page feedback
  // Opt-in "Was this helpful?" prompt in the page footer. Votes are written to
  // the Workers Analytics Engine binding `binding` by the generated
  // functions/feedback.js — add that binding to the Cloudflare Pages project.
  feedback: {
    enabled: true
    // binding: 'FEEDBACK'
  },

  // @ Header links
  // Centered in the header where they fit; elsewhere (phones, or a narrow
  // header next to the sidebar) they open from an arrow attached to the brand. href: a URL (new tab) or the path of a page of the
  // site (in place, highlighted while open). A link with children is a
  // dropdown (one level).
  // header: {
  //   links: [
  //     { label: 'Guide', icon: 'school', href: '/guide/getting-started/' },
  //     { label: { 'en-US': 'More', 'pt-BR': 'Mais' }, icon: 'menu_book', children: [
  //       { label: 'Changelog', href: 'https://github.com/docsector/docsector-reader/releases' }
  //     ] }
  //   ]
  // },

  // @ Sponsors
  // Opt-in sponsor logos under the Table of Contents (desktop rail, tablet
  // overlay and the mobile ToC dialog); they follow the ToC's visibility.
  // Tiers are listed highest first: 'wide' = one 3:1 logo per row, 'square' =
  // two 1:1 logos per row. An empty tier shows a "Your sponsor here" example
  // slot, and the panel ends with a "Your logo here" button; both open
  // fallbackUrl, which defaults to links.sponsor.
  // sponsors: {
  //   enabled: true,
  //   fallbackUrl: null,
  //   tiers: [{ id: 'platinum', layout: 'wide' }, { id: 'gold', layout: 'square' }],
  //   items: [
  //     { name: 'Acme', tier: 'platinum', href: 'https://acme.example',
  //       logo: '/images/sponsors/acme.svg', logoDark: '/images/sponsors/acme-dark.svg' }
  //   ]
  // },

  // @ Page ad
  // Opt-in ad with your own creatives above the content of every overview,
  // showcase and vs page (never the home page). Each page shows one creative
  // chosen from its path; with no creative, an example "Your ad here" ad opens
  // the sponsors fallback URL.
  // ads: {
  //   enabled: true,
  //   items: [
  //     { href: 'https://example.com/course', image: '/images/promo/course.png',
  //       title: { 'en-US': 'Official course', 'pt-BR': 'Curso oficial' },
  //       text: { 'en-US': 'Learn it in a weekend.', 'pt-BR': 'Aprenda em um fim de semana.' } }
  //   ]
  // },

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
        { text: 'Summarize this page.', pageContext: true },
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
