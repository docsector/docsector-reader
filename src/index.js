/**
 * Docsector Reader — Main Entry Point
 *
 * This module exports the core configuration and utilities
 * needed to use Docsector Reader as an NPM package.
 *
 * Usage:
 *   import { createDocsector } from '@docsector/docsector-reader'
 *
 *   const docsector = createDocsector({
 *     branding: { name: 'My Project', version: 'v1.0.0', logo: '/images/logo.png' },
 *     links: { github: 'https://github.com/org/repo' },
 *     languages: [
 *       { image: '/images/flags/united-states-of-america.png', label: 'English (US)', value: 'en-US' },
 *       { image: '/images/flags/brazil.png', label: 'Português (BR)', value: 'pt-BR' }
 *     ],
 *     defaultLanguage: 'en-US'
 *   })
 */

/**
 * Create a Docsector Reader configuration object.
 *
 * @param {Object} config - User configuration
 * @param {Object} config.branding - Branding settings
 * @param {string} config.branding.logo - Logo image path (relative to public/)
 * @param {string} config.branding.name - Project name displayed in sidebar
 * @param {string} config.branding.version - Version label
 * @param {string} [config.branding.description] - Project description (used in llms.txt)
 * @param {string[]} [config.branding.versions] - Available versions for dropdown
 * @param {Object} config.links - External links
 * @param {string} [config.links.github] - GitHub repository URL
 * @param {string} [config.links.discussions] - GitHub discussions URL
 * @param {string} [config.links.chat] - Chat/Discord invite URL
 * @param {string} [config.links.email] - Contact email
 * @param {string} [config.links.changelog] - Changelog path or URL
 * @param {string} [config.links.roadmap] - Roadmap URL
 * @param {string} [config.links.sponsor] - Sponsor URL
 * @param {Array} [config.links.explore] - Related links array [{label, url}]
 * @param {Object} config.github - GitHub integration settings
 * @param {string} config.github.editBaseUrl - Base URL for "Edit on GitHub" links
 * @param {Array} config.languages - Available languages [{image, label, value}]
 * @param {string} [config.defaultLanguage='en-US'] - Default language code
 * @param {Object} [config.mcp] - MCP (Model Context Protocol) server settings
 * @param {string} config.mcp.serverName - Server name for MCP identification (e.g. 'my-docs')
 * @param {string} config.mcp.toolSuffix - Suffix for tool names (e.g. 'my_docs' → search_my_docs)
 * @param {Object} [config.linkHeaders] - Homepage Link headers for agent discovery
 * @param {boolean} [config.linkHeaders.enabled=true] - Enables homepage Link headers generation
 * @param {string|null|false} [config.linkHeaders.serviceDoc='/'] - Target URI for rel="service-doc"
 * @param {string|null|false} [config.linkHeaders.apiCatalog='/.well-known/api-catalog'] - Target URI for rel="api-catalog"
 * @param {string|null|false} [config.linkHeaders.serviceDesc='/mcp'] - Target URI for rel="service-desc" (only emitted when MCP is enabled)
 * @param {string|null|false} [config.linkHeaders.describedBy='/llms.txt'] - Target URI for rel="describedby" (only emitted when llms.txt is generated)
 * @param {Object} [config.apiCatalog] - API catalog generation settings
 * @param {boolean} [config.apiCatalog.enabled=true] - Enables generation of API catalog artifact
 * @param {string} [config.apiCatalog.path='/.well-known/api-catalog'] - Output URI path for API catalog artifact
 * @param {Array<string|{href: string}>} [config.apiCatalog.items=[]] - Additional API endpoint links to include as item relations
 * @param {Object} [config.markdownNegotiation] - Markdown content negotiation settings for agents
 * @param {boolean} [config.markdownNegotiation.enabled=true] - Enables markdown negotiation by Accept header in production runtime
 * @param {boolean} [config.markdownNegotiation.agentFallback=true] - Enables markdown fallback for known AI bot user agents when Accept is absent
 * @returns {Object} Resolved Docsector configuration
 */
export function createDocsector (config = {}) {
  return {
    branding: {
      logo: '/images/logo.png',
      name: 'My Project',
      version: 'v0.0.1',
      versions: ['v0.0.1'],
      ...config.branding
    },

    links: {
      github: null,
      discussions: null,
      chat: null,
      email: null,
      changelog: '/changelog',
      roadmap: null,
      sponsor: null,
      explore: null,
      ...config.links
    },

    github: {
      editBaseUrl: '',
      ...config.github
    },

    languages: config.languages || [
      {
        image: '/images/flags/united-states-of-america.png',
        label: 'English (US)',
        value: 'en-US'
      }
    ],

    defaultLanguage: config.defaultLanguage || 'en-US',

    mcp: config.mcp || null,

    linkHeaders: {
      enabled: true,
      serviceDoc: '/',
      apiCatalog: '/.well-known/api-catalog',
      serviceDesc: '/mcp',
      describedBy: '/llms.txt',
      ...config.linkHeaders
    },

    apiCatalog: {
      enabled: true,
      path: '/.well-known/api-catalog',
      items: [],
      ...config.apiCatalog
    },

    markdownNegotiation: {
      enabled: true,
      agentFallback: true,
      ...config.markdownNegotiation
    }
  }
}

/**
 * Define a Docsector page entry for the pages registry.
 *
 * @param {Object} options - Page options
 * @param {Object} options.config - Page configuration (icon, status, type, menu, subpages)
 * @param {Object} options.data - Per-language titles { 'en-US': { title: '...' } }
 * @returns {Object} Page definition
 */
export function definePage (options) {
  return {
    config: options.config || null,
    data: options.data || {}
  }
}

export default { createDocsector, definePage }
