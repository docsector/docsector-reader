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

    defaultLanguage: config.defaultLanguage || 'en-US'
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
