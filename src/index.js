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
 * @param {Object} [config.webBotAuth] - Web Bot Auth settings for signed bot identity
 * @param {boolean} [config.webBotAuth.enabled=false] - Enables Web Bot Auth directory publishing and response signature headers
 * @param {string} [config.webBotAuth.directoryPath='/.well-known/http-message-signatures-directory'] - Well-known URI where JWKS directory is exposed
 * @param {string} [config.webBotAuth.jwksEnv='WEB_BOT_AUTH_JWKS'] - Environment variable containing JWKS JSON
 * @param {string} [config.webBotAuth.privateJwkEnv='WEB_BOT_AUTH_PRIVATE_JWK'] - Environment variable containing private Ed25519 JWK JSON used to sign the directory response
 * @param {string} [config.webBotAuth.keyIdEnv='WEB_BOT_AUTH_KEY_ID'] - Environment variable containing signature key identifier (thumbprint or kid)
 * @param {string|null} [config.webBotAuth.keyId=null] - Optional static fallback key identifier when env var is absent
 * @param {number} [config.webBotAuth.signatureMaxAge=300] - Signature validity window in seconds for directory responses
 * @param {string} [config.webBotAuth.signatureLabel='sig1'] - Signature label used in Signature and Signature-Input headers
 * @param {Object} [config.contentSignals] - Content Signals policy for robots.txt
 * @param {boolean} [config.contentSignals.enabled=false] - Enables Content-Signal injection in robots.txt during build
 * @param {'yes'|'no'|boolean} [config.contentSignals.aiTrain='yes'] - Permission for AI model training consumption
 * @param {'yes'|'no'|boolean} [config.contentSignals.search='yes'] - Permission for AI search indexing/discovery consumption
 * @param {'yes'|'no'|boolean} [config.contentSignals.aiInput='yes'] - Permission for AI input/inference-time consumption
 * @param {string} [config.contentSignals.userAgent='*'] - Target User-agent block for directive injection
 * @param {boolean} [config.contentSignals.applyToAllBlocks=false] - When true, applies directive to every User-agent block
 * @param {Object} [config.agentSkills] - Agent Skills discovery index settings
 * @param {boolean} [config.agentSkills.enabled=false] - Enables generation of Agent Skills discovery index
 * @param {string} [config.agentSkills.path='/.well-known/agent-skills/index.json'] - Output URI path for Agent Skills index
 * @param {string} [config.agentSkills.schema='https://schemas.agentskills.io/discovery/0.2.0/schema.json'] - JSON Schema identifier for index payload
 * @param {Array<{name:string,type:'skill-md'|'archive',description:string,url:string,digest?:string}>} [config.agentSkills.skills=[]] - Skills to publish in discovery index
 * @param {Object} [config.mcpServerCard] - MCP Server Card discovery settings
 * @param {boolean} [config.mcpServerCard.enabled=false] - Enables generation of MCP Server Card discovery document
 * @param {string} [config.mcpServerCard.path='/.well-known/mcp/server-card.json'] - Output URI path for MCP Server Card
 * @param {string} [config.mcpServerCard.transportEndpoint='/mcp'] - MCP transport endpoint exposed by the server
 * @param {string} [config.mcpServerCard.transportType='streamable-http'] - Transport type label for discovery metadata
 * @param {string} [config.mcpServerCard.protocolVersion='2025-03-26'] - Protocol version advertised by the server card
 * @param {Object} [config.mcpServerCard.capabilities] - Optional capability overrides for tools/resources/prompts
 * @param {Array<Object>} [config.mcpServerCard.remotes=[]] - Optional additional remotes to include in the server card
 * @param {Object} [config.mcpServerCard.metadata] - Optional additional metadata merged into the server card payload
 * @param {Object} [config.webMcp] - WebMCP browser tools settings
 * @param {boolean} [config.webMcp.enabled=false] - Enables browser-side WebMCP tool registration on page load
 * @param {'registerTool'|'dual'} [config.webMcp.apiMode='dual'] - Registration mode: registerTool only or registerTool + provideContext fallback
 * @param {string} [config.webMcp.toolPrefix='docs'] - Prefix used to build WebMCP tool names (e.g. docs.search_docs)
 * @param {string} [config.webMcp.bridgeEndpoint='/mcp'] - Relative endpoint used to bridge search/get_page to the MCP HTTP server
 * @param {boolean} [config.webMcp.bridgeToMcp=true] - Uses MCP endpoint bridge for search/get_page tools when true
 * @param {Object} [config.webMcp.tools] - Per-tool enable flags
 * @param {boolean} [config.webMcp.tools.searchDocs=true] - Enables tool search_docs
 * @param {boolean} [config.webMcp.tools.getPage=true] - Enables tool get_page
 * @param {boolean} [config.webMcp.tools.navigateTo=true] - Enables tool navigate_to
 * @param {boolean} [config.webMcp.tools.copyCurrentPage=true] - Enables tool copy_current_page
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
    },

    webBotAuth: {
      enabled: false,
      directoryPath: '/.well-known/http-message-signatures-directory',
      jwksEnv: 'WEB_BOT_AUTH_JWKS',
      privateJwkEnv: 'WEB_BOT_AUTH_PRIVATE_JWK',
      keyIdEnv: 'WEB_BOT_AUTH_KEY_ID',
      keyId: null,
      signatureMaxAge: 300,
      signatureLabel: 'sig1',
      ...config.webBotAuth
    },

    contentSignals: {
      enabled: false,
      aiTrain: 'yes',
      search: 'yes',
      aiInput: 'yes',
      userAgent: '*',
      applyToAllBlocks: false,
      ...config.contentSignals
    },

    agentSkills: {
      enabled: false,
      path: '/.well-known/agent-skills/index.json',
      schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
      skills: [],
      ...config.agentSkills
    },

    mcpServerCard: {
      enabled: false,
      path: '/.well-known/mcp/server-card.json',
      transportEndpoint: '/mcp',
      transportType: 'streamable-http',
      protocolVersion: '2025-03-26',
      capabilities: null,
      remotes: [],
      metadata: null,
      ...config.mcpServerCard
    },

    webMcp: {
      enabled: false,
      apiMode: 'dual',
      toolPrefix: 'docs',
      bridgeEndpoint: '/mcp',
      bridgeToMcp: true,
      ...config.webMcp,
      tools: {
        searchDocs: true,
        getPage: true,
        navigateTo: true,
        copyCurrentPage: true,
        ...(config.webMcp?.tools || {})
      }
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
