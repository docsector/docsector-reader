import docsectorConfig from 'docsector.config.js'
import { pageValueI18nPath } from '../i18n/path'
import { buildWebMcpTools } from '../webmcp-tools'

let activeCleanup = null

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

// : Execute implementations, keyed by full tool name — the metadata lives in
//   ../webmcp-tools.js (one canonical definition for prerender and runtime)
function createToolExecutes ({
  prefix,
  mcpToolSuffix,
  bridgeEndpoint,
  bridgeToMcp,
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

  const executes = {}

  executes[`${prefix}.search_docs`] = async (input) => {
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

  executes[`${prefix}.get_page`] = async (input) => {
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

  executes[`${prefix}.navigate_to`] = async (input) => {
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

  executes[`${prefix}.copy_current_page`] = async (input) => {
        const locale = getLocale() || 'en-US'
        const currentPath = getCurrentPath()
        const path = currentPath === '/' ? '/Homepage' : currentPath.replace(/\/+$/, '')
        const markdownUrl = `${window.location.origin}${path}.md`

        const includeContent = input?.includeContent !== false
        const absolute = getAbsoluteI18nPath()

        let content = ''
        if (includeContent && absolute) {
          const sourcePath = pageValueI18nPath(absolute, 'source')
          const source = translate(sourcePath)
          // ? t() echoes the key when the message is a compiled token module —
          //   only a real raw string (dev) can be decoded directly
          if (typeof source === 'string' && source.length > 0 && source !== sourcePath) {
            content = decodeMarkdownSource(source)
          }
        }

        // @ Compiled build: the raw source doesn't ship — fetch the static .md
        if (includeContent && !content) {
          const candidates = currentPath === '/'
            ? [`/homepage.${locale}.md`, '/homepage.md']
            : [`${path}.${locale}.md`, `${path}.md`]

          for (const candidate of candidates) {
            try {
              const response = await fetch(candidate)
              if (!response.ok) continue

              content = await response.text()
              break
            } catch {
              // ? Unreachable file — try the next candidate
            }
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

  return executes
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

  const manifest = buildWebMcpTools(docsectorConfig)
  if (!manifest.enabled) return () => {}

  const mcpToolSuffix = String(docsectorConfig.mcp?.toolSuffix || 'docs')
    .replace(/[^A-Za-z0-9_]/g, '_')

  const executes = createToolExecutes({
    prefix: manifest.prefix,
    mcpToolSuffix,
    bridgeEndpoint: webMcp.bridgeEndpoint || '/mcp',
    bridgeToMcp: webMcp.bridgeToMcp !== false,
    router,
    getCurrentPath: () => route.path,
    getCurrentHash: () => route.hash,
    getLocale: () => locale.value,
    getAbsoluteI18nPath: () => store?.state?.i18n?.absolute,
    translate
  })

  const definitions = manifest.tools
    .map((tool) => ({ ...tool, execute: executes[tool.name] }))
    .filter((tool) => typeof tool.execute === 'function')

  if (definitions.length === 0) return () => {}

  // ? SSR pages ship an inline head script that already registered these
  //   tools at parse time (agents see them before any bundle downloads) —
  //   here we only connect the real implementations to that bridge
  if (typeof window.__DOCSECTOR_WEBMCP_CONNECT === 'function' && window.__DOCSECTOR_WEBMCP_EARLY === true) {
    const byName = new Map(definitions.map((tool) => [tool.name, tool.execute]))
    window.__DOCSECTOR_WEBMCP_CONNECT((name, input) => {
      const execute = byName.get(name)
      if (typeof execute !== 'function') {
        throw new Error(`Unknown WebMCP tool: ${name}`)
      }
      return execute(input)
    })

    const cleanup = () => {}
    activeCleanup = cleanup
    return cleanup
  }

  const supportsRegisterTool = typeof modelContext.registerTool === 'function'
  const supportsProvideContext = typeof modelContext.provideContext === 'function'
  const mode = manifest.mode

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
