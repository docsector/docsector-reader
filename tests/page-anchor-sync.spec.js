import { describe, expect, it } from 'vitest'

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
})