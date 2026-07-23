import { describe, expect, it } from 'vitest'

import { buildWebMcpInlineScript, buildWebMcpTools, toSafeToolPrefix } from '../src/webmcp-tools.js'

describe('webmcp tool manifest', () => {
  it('builds the four default tools with the configured prefix', () => {
    const manifest = buildWebMcpTools({ webMcp: { enabled: true, toolPrefix: 'bootgly.docs' } })

    expect(manifest.enabled).toBe(true)
    expect(manifest.prefix).toBe('bootgly.docs')
    expect(manifest.mode).toBe('dual')
    expect(manifest.tools.map((tool) => tool.name)).toEqual([
      'bootgly.docs.search_docs',
      'bootgly.docs.get_page',
      'bootgly.docs.navigate_to',
      'bootgly.docs.copy_current_page'
    ])

    for (const tool of manifest.tools) {
      expect(tool.description.length).toBeGreaterThan(10)
      expect(tool.inputSchema.type).toBe('object')
      expect(tool.annotations).toBeDefined()
      // metadata only — executes are attached by the runtime consumer
      expect(tool.execute).toBeUndefined()
    }
  })

  it('honors per-tool toggles and the registerTool api mode', () => {
    const manifest = buildWebMcpTools({
      webMcp: {
        enabled: true,
        apiMode: 'registerTool',
        tools: { navigateTo: false, copyCurrentPage: false }
      }
    })

    expect(manifest.mode).toBe('registerTool')
    expect(manifest.tools.map((tool) => tool.name)).toEqual(['docs.search_docs', 'docs.get_page'])
  })

  it('is disabled without the webMcp flag', () => {
    expect(buildWebMcpTools({}).enabled).toBe(false)
    expect(buildWebMcpTools({ webMcp: { enabled: false } }).enabled).toBe(false)
    expect(buildWebMcpInlineScript({})).toBe('')
  })

  it('sanitizes tool prefixes', () => {
    expect(toSafeToolPrefix('  weird prefix!! ')).toBe('weird_prefix__')
    expect(toSafeToolPrefix('')).toBe('docs')
  })
})

describe('webmcp inline registration script', () => {
  it('registers the metadata immediately and queues execute calls until the app connects', async () => {
    const script = buildWebMcpInlineScript({ webMcp: { enabled: true, toolPrefix: 'bootgly.docs' } })
    expect(script.startsWith('<script>')).toBe(true)
    expect(script.endsWith('</script>')).toBe(true)
    expect(script).not.toMatch(/<\/script>.+<\/script>/)

    // # emulate the browser: modelContext present before the script runs
    const registered = []
    const provided = []
    const sandbox = {
      navigator: { modelContext: {
        registerTool: (tool) => registered.push(tool),
        provideContext: (payload) => provided.push(payload)
      } },
      window: {}
    }
    const body = script.replace(/^<script>/, '').replace(/<\/script>$/, '')
    // eslint-disable-next-line no-new-func
    new Function('navigator', 'window', body)(sandbox.navigator, sandbox.window)

    expect(registered.map((tool) => tool.name)).toContain('bootgly.docs.navigate_to')
    expect(provided[0].tools).toHaveLength(4)
    expect(sandbox.window.__DOCSECTOR_WEBMCP_EARLY).toBe(true)

    // @ execute before the app boots — queued, then resolved on connect
    const pending = registered[0].execute({ query: 'boot' })
    let called = null
    sandbox.window.__DOCSECTOR_WEBMCP_CONNECT((name, input) => { called = { name, input }; return 'ok' })
    await expect(pending).resolves.toBe('ok')
    expect(called.name).toBe('bootgly.docs.search_docs')
    expect(called.input).toEqual({ query: 'boot' })
  })
})
