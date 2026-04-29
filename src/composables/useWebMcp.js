import docsectorConfig from 'docsector.config.js'
import { pageValueI18nPath } from '../i18n/path'

let activeCleanup = null

function toSafeToolPrefix (prefix) {
  const value = String(prefix || 'docs')
    .trim()
    .replace(/[^A-Za-z0-9_.-]/g, '_')

  if (!value) {
    return 'docs'
  }

  return value.slice(0, 48)
}

function decodeMarkdownSource (source) {
  return String(source || '')
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/\{'([^']+)'\}/g, '$1')
    .replace(/&amp;/g, '&')
}

function isSecurePageContext () {
  if (typeof window === 'undefined') return false

  if (window.isSecureContext) return true

  const protocol = window.location?.protocol || ''
  const host = window.location?.hostname || ''
  return protocol === 'https:' || host === 'localhost' || host === '127.0.0.1'
}

function buildMcpEndpoint (bridgeEndpoint) {
  if (typeof window === 'undefined') return '/mcp'

  const endpoint = bridgeEndpoint || '/mcp'
  try {
    return new URL(endpoint, window.location.origin).toString()
  } catch {
    return `${window.location.origin}/mcp`
  }
}

async function callMcpTool ({ endpoint, toolName, args }) {
  const requestId = `${toolName}:${Date.now()}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args || {}
      }
    })
  })

  if (!response.ok) {
    throw new Error(`MCP endpoint responded with ${response.status}`)
  }

  const payload = await response.json()
  if (payload.error) {
    throw new Error(payload.error.message || 'MCP tool call failed')
  }

  return payload.result || null
}

function normalizePath (inputPath) {
  const value = String(inputPath || '').trim()
  if (!value) return '/'

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value)
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return '/'
    }
  }

  if (value.startsWith('/')) {
    return value
  }

  return `/${value}`
}

function createToolDefinitions ({
  prefix,
  mcpToolSuffix,
  bridgeEndpoint,
  bridgeToMcp,
  tools,
  router,
  getCurrentPath,
  getCurrentHash,
  getLocale,
  getAbsoluteI18nPath,
  translate
}) {
  const endpoint = buildMcpEndpoint(bridgeEndpoint)

  const maybeCallMcp = async (toolName, args) => {
    if (!bridgeToMcp) {
      throw new Error('MCP bridge disabled in webMcp configuration')
    }

    return callMcpTool({ endpoint, toolName, args })
  }

  const definitions = []

  if (tools.searchDocs) {
    definitions.push({
      name: `${prefix}.search_docs`,
      description: 'Search documentation pages by keyword and return top matches.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term or phrase.'
          }
        },
        required: ['query']
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const query = String(input?.query || '').trim()
        if (!query) {
          return {
            ok: false,
            error: 'Missing required field: query'
          }
        }

        const toolName = `search_${mcpToolSuffix}`
        const result = await maybeCallMcp(toolName, { query })

        return {
          ok: true,
          query,
          mcpTool: toolName,
          endpoint,
          result
        }
      }
    })
  }

  if (tools.getPage) {
    definitions.push({
      name: `${prefix}.get_page`,
      description: 'Fetch a documentation page in markdown format by its path.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Documentation page path without trailing .md.'
          }
        },
        required: ['path']
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const path = String(input?.path || '').trim()
        if (!path) {
          return {
            ok: false,
            error: 'Missing required field: path'
          }
        }

        const toolName = `get_page_${mcpToolSuffix}`
        const result = await maybeCallMcp(toolName, { path })

        return {
          ok: true,
          path,
          mcpTool: toolName,
          endpoint,
          result
        }
      }
    })
  }

  if (tools.navigateTo) {
    definitions.push({
      name: `${prefix}.navigate_to`,
      description: 'Navigate to a docs route and optional anchor hash in the current session.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Target path (absolute or relative).'
          },
          hash: {
            type: 'string',
            description: 'Optional hash fragment, with or without leading #.'
          }
        }
      },
      annotations: { readOnlyHint: false },
      execute: async (input) => {
        const path = normalizePath(input?.path || getCurrentPath())
        const hashInput = String(input?.hash || '').trim()
        const hash = hashInput ? (hashInput.startsWith('#') ? hashInput : `#${hashInput}`) : ''

        await router.push({ path, hash })

        return {
          ok: true,
          path,
          hash,
          currentPath: getCurrentPath(),
          currentHash: getCurrentHash()
        }
      }
    })
  }

  if (tools.copyCurrentPage) {
    definitions.push({
      name: `${prefix}.copy_current_page`,
      description: 'Return markdown URL and markdown source for the current page context.',
      inputSchema: {
        type: 'object',
        properties: {
          includeContent: {
            type: 'boolean',
            description: 'When false, return metadata and URL only.'
          }
        }
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const locale = getLocale() || 'en-US'
        const currentPath = getCurrentPath()
        const path = currentPath === '/' ? '/Homepage' : currentPath.replace(/\/+$/, '')
        const markdownUrl = `${window.location.origin}${path}.md`

        const includeContent = input?.includeContent !== false
        const absolute = getAbsoluteI18nPath()

        let content = ''
        if (includeContent && absolute) {
          const source = translate(pageValueI18nPath(absolute, 'source'))
          if (source) {
            content = decodeMarkdownSource(source)
          }
        }

        return {
          ok: true,
          locale,
          path: currentPath,
          markdownUrl,
          content
        }
      }
    })
  }

  return definitions
}

function registerWithProvideContext (modelContext, toolDefinitions) {
  if (typeof modelContext.provideContext !== 'function') return null

  const payload = {
    tools: toolDefinitions.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: tool.execute
    }))
  }

  const result = modelContext.provideContext(payload)

  if (typeof result === 'function') {
    return result
  }

  if (result && typeof result.dispose === 'function') {
    return () => result.dispose()
  }

  if (result && typeof result.unregister === 'function') {
    return () => result.unregister()
  }

  return null
}

export function setupWebMcp ({ router, route, store, translate, locale }) {
  const webMcp = docsectorConfig.webMcp || {}
  if (!webMcp.enabled) return () => {}

  if (!isSecurePageContext()) return () => {}

  const modelContext = navigator?.modelContext
  if (!modelContext) return () => {}

  if (activeCleanup) {
    activeCleanup()
    activeCleanup = null
  }

  const prefix = toSafeToolPrefix(webMcp.toolPrefix || 'docs')
  const mcpToolSuffix = String(docsectorConfig.mcp?.toolSuffix || 'docs')
    .replace(/[^A-Za-z0-9_]/g, '_')

  const tools = {
    searchDocs: webMcp.tools?.searchDocs !== false,
    getPage: webMcp.tools?.getPage !== false,
    navigateTo: webMcp.tools?.navigateTo !== false,
    copyCurrentPage: webMcp.tools?.copyCurrentPage !== false
  }

  const definitions = createToolDefinitions({
    prefix,
    mcpToolSuffix,
    bridgeEndpoint: webMcp.bridgeEndpoint || '/mcp',
    bridgeToMcp: webMcp.bridgeToMcp !== false,
    tools,
    router,
    getCurrentPath: () => route.path,
    getCurrentHash: () => route.hash,
    getLocale: () => locale.value,
    getAbsoluteI18nPath: () => store?.state?.i18n?.absolute,
    translate
  })

  if (definitions.length === 0) return () => {}

  const supportsRegisterTool = typeof modelContext.registerTool === 'function'
  const supportsProvideContext = typeof modelContext.provideContext === 'function'
  const mode = webMcp.apiMode === 'registerTool' ? 'registerTool' : 'dual'

  const abortController = new AbortController()
  const cleanups = [() => abortController.abort()]

  try {
    if (supportsRegisterTool) {
      for (const tool of definitions) {
        modelContext.registerTool({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
          execute: tool.execute
        }, { signal: abortController.signal })
      }
    } else if (mode === 'registerTool') {
      return () => {}
    }

    if ((!supportsRegisterTool || mode === 'dual') && supportsProvideContext) {
      const provideCleanup = registerWithProvideContext(modelContext, definitions)
      if (provideCleanup) {
        cleanups.push(provideCleanup)
      }
    }
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn('[docsector:webmcp] Failed to register tools', error)
    }
    return () => {}
  }

  const cleanup = () => {
    while (cleanups.length > 0) {
      const fn = cleanups.pop()
      try {
        fn()
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  activeCleanup = cleanup
  return cleanup
}

export default {
  setupWebMcp
}
