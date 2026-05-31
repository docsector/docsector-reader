import { describe, expect, it, vi } from 'vitest'

import {
  buildSourceCodeLineAnchorId,
  resolveSourceCodeLineHref,
  shouldHandleSourceCodeLineActivation
} from '../src/components/source-code-anchor.js'

describe('source-code-anchor', () => {
  it('builds stable line anchor ids from the block prefix and line number', () => {
    expect(buildSourceCodeLineAnchorId('A', 1)).toBe('A1')
    expect(buildSourceCodeLineAnchorId('BC', 42)).toBe('BC42')
  })

  it('resolves shareable line hrefs from the current route instead of a relative page slug', () => {
    const router = {
      resolve: vi.fn().mockReturnValue({ href: '/docs/manual/content/blocks/code-blocks/overview/?tab=demo#A7' })
    }

    const href = resolveSourceCodeLineHref(
      router,
      '/manual/content/blocks/code-blocks/overview/',
      { tab: 'demo' },
      'A7'
    )

    expect(href).toBe('/docs/manual/content/blocks/code-blocks/overview/?tab=demo#A7')
    expect(router.resolve).toHaveBeenCalledWith({
      path: '/manual/content/blocks/code-blocks/overview/',
      query: { tab: 'demo' },
      hash: '#A7'
    })
  })

  it('only intercepts plain primary activations for line anchors', () => {
    expect(shouldHandleSourceCodeLineActivation({
      defaultPrevented: false,
      button: 0,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false
    })).toBe(true)

    expect(shouldHandleSourceCodeLineActivation({
      defaultPrevented: false,
      button: 0,
      altKey: false,
      ctrlKey: false,
      metaKey: true,
      shiftKey: false
    })).toBe(false)

    expect(shouldHandleSourceCodeLineActivation({
      defaultPrevented: false,
      button: 1,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false
    })).toBe(false)
  })
})