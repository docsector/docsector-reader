/**
 * WebMCP tool metadata — pure and environment-free.
 *
 * Shared by two consumers with one canonical definition:
 * - bin/ssr-prerender.mjs bakes an inline head script that registers the
 *   tools at HTML-parse time (agents see them immediately, before any
 *   bundle download);
 * - src/composables/useWebMcp.js attaches the real execute implementations
 *   and connects them to the early registrations once the app boots.
 */

export function toSafeToolPrefix (prefix) {
  const value = String(prefix || 'docs')
    .trim()
    .replace(/[^A-Za-z0-9_.-]/g, '_')

  if (!value) {
    return 'docs'
  }

  return value.slice(0, 48)
}

// : Tool metadata for the enabled tools — names, descriptions and schemas
//   only; execute callbacks are attached by the consumer.
export function buildWebMcpTools (config) {
  const webMcp = config?.webMcp || {}
  if (!webMcp.enabled) {
    return { enabled: false, prefix: null, mode: 'dual', tools: [] }
  }

  const prefix = toSafeToolPrefix(webMcp.toolPrefix || 'docs')
  // ? 'registerTool' forces the imperative API (no fallback); 'auto' uses
  //   registerTool when available and falls back to provideContext otherwise.
  //   Never both: double registration confuses agent checkers' declarative
  //   verification (the reference implementation on bootgly.com passes with
  //   exactly this either/or shape).
  const mode = webMcp.apiMode === 'registerTool' ? 'registerTool' : 'auto'
  const enabled = {
    searchDocs: webMcp.tools?.searchDocs !== false,
    getPage: webMcp.tools?.getPage !== false,
    navigateTo: webMcp.tools?.navigateTo !== false,
    copyCurrentPage: webMcp.tools?.copyCurrentPage !== false
  }

  const tools = []

  if (enabled.searchDocs) {
    tools.push({
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
      annotations: { readOnlyHint: true }
    })
  }

  if (enabled.getPage) {
    tools.push({
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
      annotations: { readOnlyHint: true }
    })
  }

  if (enabled.navigateTo) {
    tools.push({
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
      annotations: { readOnlyHint: false }
    })
  }

  if (enabled.copyCurrentPage) {
    tools.push({
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
      annotations: { readOnlyHint: true }
    })
  }

  return { enabled: tools.length > 0, prefix, mode, tools }
}

// : The inline registration script. Registers the tool metadata the moment
//   the parser reaches it; each execute forwards to the app through the
//   __DOCSECTOR_WEBMCP_CONNECT bridge (calls made before the app boots are
//   queued and resolved once it connects).
export function buildWebMcpInlineScript (config) {
  const manifest = buildWebMcpTools(config)
  if (!manifest.enabled) {
    return ''
  }

  const payload = JSON.stringify({ mode: manifest.mode, tools: manifest.tools })
    .replace(/</g, '\\u003C')

  return '<script>(function(){' +
    'var mc=navigator.modelContext;if(!mc)return;' +
    `var m=${payload};` +
    'var impl=null,waiters=[];' +
    'window.__DOCSECTOR_WEBMCP_CONNECT=function(fn){impl=fn;while(waiters.length)waiters.shift()(fn)};' +
    'function call(name,input){if(impl)return impl(name,input);' +
    'return new Promise(function(res){waiters.push(res)}).then(function(fn){return fn(name,input)})}' +
    'function entry(t){return{name:t.name,description:t.description,inputSchema:t.inputSchema,annotations:t.annotations,' +
    'execute:function(input){return call(t.name,input)}}}' +
    'try{' +
    'if(typeof mc.registerTool==="function"){m.tools.forEach(function(t){mc.registerTool(entry(t))})}' +
    'else if(m.mode!=="registerTool"&&typeof mc.provideContext==="function"){' +
    'mc.provideContext({tools:m.tools.map(entry)})}else{return}' +
    'window.__DOCSECTOR_WEBMCP_EARLY=true' +
    '}catch(e){}' +
    '})()</' + 'script>'
}
