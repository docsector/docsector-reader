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
    version: 'v' + pkg.version
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
    editBaseUrl: 'https://github.com/docsector/docsector-reader/tree/main/src/pages'
  },

  // @ MCP
  mcp: {
    serverName: 'docsector-docs',
    toolSuffix: 'docsector'
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
