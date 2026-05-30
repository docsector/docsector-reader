import { describe, expect, it } from 'vitest'

import { buildPageAnchorTree } from '../src/components/page-anchor-tree.js'
import { DEFAULT_ACTIVE_ANCHOR_OFFSET, getActiveAnchorId } from '../src/composables/useActiveAnchor.js'
import PageModule from '../src/store/Page.js'

const createPageState = () => JSON.parse(JSON.stringify(PageModule.state))

describe('getActiveAnchorId', () => {
  it('keeps the root anchor selected before the first heading crosses the threshold', () => {
    expect(getActiveAnchorId({
      anchors: ['intro', 'details'],
      scrollTop: 20,
      getAnchorOffsetTop: (anchorId) => ({
        intro: 120,
        details: 340
      })[anchorId]
    })).toBe(0)
  })

  it('selects the last heading that crossed the threshold when offsets are valid', () => {
    expect(getActiveAnchorId({
      anchors: ['intro', 'details', 'api'],
      scrollTop: 275,
      getAnchorOffsetTop: (anchorId) => ({
        intro: 120,
        details: 260,
        api: 500
      })[anchorId]
    })).toBe('details')
  })

  it('ignores anchors whose DOM node is missing instead of falling through to the last entry', () => {
    expect(getActiveAnchorId({
      anchors: ['intro', 'details', 'api'],
      scrollTop: 85,
      getAnchorOffsetTop: (anchorId) => ({
        intro: 120,
        details: undefined,
        api: undefined
      })[anchorId]
    })).toBe('intro')
  })

  it('supports custom thresholds without skipping back to the root anchor', () => {
    expect(getActiveAnchorId({
      anchors: ['intro', 'details'],
      scrollTop: 40,
      scrollOffset: 10,
      getAnchorOffsetTop: (anchorId) => ({
        intro: 50,
        details: 300
      })[anchorId]
    })).toBe('intro')
  })

  it('exports the default active-anchor offset used by scroll tracking', () => {
    expect(DEFAULT_ACTIVE_ANCHOR_OFFSET).toBe(50)
  })
})

describe('buildPageAnchorTree', () => {
  it('builds anchors and nodes from heading tokens in source order', () => {
    const tree = buildPageAnchorTree([
      { tag: 'p', content: 'Intro text' },
      { tag: 'h2', anchorId: 'how-it-works', content: 'How It Works' },
      { tag: 'h2', anchorId: 'store-integration', content: 'Store Integration' },
      { tag: 'h2', anchorId: 'tree-rendering', content: 'Tree Rendering' },
      { tag: 'h2', anchorId: 'scroll-synchronization', content: 'Scroll Synchronization' }
    ])

    expect(tree.anchors).toEqual([
      'how-it-works',
      'store-integration',
      'tree-rendering',
      'scroll-synchronization'
    ])
    expect(tree.nodes[0].children.map(node => node.id)).toEqual([
      'how-it-works',
      'store-integration',
      'tree-rendering',
      'scroll-synchronization'
    ])
  })

  it('nests h3 tokens under the nearest preceding h2 token', () => {
    const tree = buildPageAnchorTree([
      { tag: 'h2', anchorId: 'store-integration', content: 'Store Integration' },
      { tag: 'h3', anchorId: 'state', content: 'State' },
      { tag: 'h3', anchorId: 'mutations', content: 'Mutations' },
      { tag: 'h2', anchorId: 'styling', content: 'Styling' }
    ])

    expect(tree.nodes).toEqual([
      {
        id: 0,
        children: [
          {
            id: 'store-integration',
            label: 'Store Integration',
            children: [
              { id: 'state', label: 'State', children: [] },
              { id: 'mutations', label: 'Mutations', children: [] }
            ]
          },
          { id: 'styling', label: 'Styling', children: [] }
        ]
      }
    ])
  })
})

describe('page store anchor registration', () => {
  it('deduplicates repeated anchor registrations while preserving source order', () => {
    const state = createPageState()

    PageModule.mutations.pushAnchors(state, 'intro')
    PageModule.mutations.pushAnchors(state, 'intro')
    PageModule.mutations.pushAnchors(state, 'details')

    expect(state.anchors).toEqual(['intro', 'details'])
  })

  it('deduplicates expanded nodes to keep tree selection stable', () => {
    const state = createPageState()

    PageModule.mutations.pushNodesExpanded(state, 'intro')
    PageModule.mutations.pushNodesExpanded(state, 'intro')
    PageModule.mutations.pushNodesExpanded(state, 'details')

    expect(state.nodesExpanded).toEqual([0, 'intro', 'details'])
  })

  it('expands ancestor nodes when a child section becomes active first', () => {
    const state = createPageState()

    PageModule.mutations.pushNodes(state, {
      id: 'chapter-a',
      label: 'Chapter A',
      child: false,
      children: []
    })
    PageModule.mutations.pushNodes(state, {
      id: 'chapter-a-step-1',
      label: 'Step 1',
      child: true,
      children: []
    })

    PageModule.mutations.pushNodesExpanded(state, 'chapter-a-step-1')

    expect(state.nodesExpanded).toEqual([0, 'chapter-a', 'chapter-a-step-1'])
  })

  it('replaces stale navigation state with a source-ordered tree for the next subpage', () => {
    const state = createPageState()

    PageModule.mutations.pushAnchors(state, 'stale-third')
    PageModule.mutations.pushAnchors(state, 'stale-first')
    PageModule.mutations.pushNodes(state, {
      id: 'stale-third',
      label: 'Stale Third',
      child: false,
      children: []
    })

    PageModule.mutations.setAnchorTree(state, {
      anchors: ['how-it-works', 'store-integration', 'tree-rendering', 'scroll-synchronization'],
      nodes: [
        {
          id: 0,
          children: [
            { id: 'how-it-works', label: 'How It Works', children: [] },
            { id: 'store-integration', label: 'Store Integration', children: [] },
            { id: 'tree-rendering', label: 'Tree Rendering', children: [] },
            { id: 'scroll-synchronization', label: 'Scroll Synchronization', children: [] }
          ]
        }
      ]
    })

    expect(state.anchors).toEqual([
      'how-it-works',
      'store-integration',
      'tree-rendering',
      'scroll-synchronization'
    ])
    expect(state.nodes[0].children.map(node => node.id)).toEqual([
      'how-it-works',
      'store-integration',
      'tree-rendering',
      'scroll-synchronization'
    ])
  })

  it('does not duplicate child nodes after the source-ordered tree is already in place', () => {
    const state = createPageState()

    state.nodes = [
      {
        id: 0,
        children: [
          {
            id: 'store-integration',
            label: 'Store Integration',
            children: [
              { id: 'api-state', label: 'API State', children: [] }
            ]
          }
        ]
      }
    ]

    PageModule.mutations.pushNodes(state, {
      id: 'api-state',
      label: 'API State',
      child: true,
      children: []
    })

    expect(state.nodes[0].children[0].children).toEqual([
      { id: 'api-state', label: 'API State', children: [] }
    ])
  })
})