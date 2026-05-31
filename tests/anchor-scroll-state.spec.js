import { describe, expect, it } from 'vitest'

import { getAnchorScrollExtraBottom, getAnchorScrollMaxTop } from '../src/composables/anchor-scroll-state.js'

describe('anchor scroll state', () => {
  it('calculates the maximum scroll top from content and viewport height', () => {
    expect(getAnchorScrollMaxTop({ scrollHeight: 1400, clientHeight: 800 })).toBe(600)
    expect(getAnchorScrollMaxTop({ scrollHeight: 500, clientHeight: 800 })).toBe(0)
  })

  it('does not add extra bottom space when the anchor fits inside the current scroll range', () => {
    expect(getAnchorScrollExtraBottom({
      offsetTop: 520,
      scrollHeight: 1400,
      clientHeight: 800
    })).toBe(0)
  })

  it('adds only the missing bottom space when an anchor is beyond the current max scroll top', () => {
    expect(getAnchorScrollExtraBottom({
      offsetTop: 860.4,
      scrollHeight: 1400,
      clientHeight: 800
    })).toBe(261)
  })

  it('keeps existing extra bottom space when recalculating the same anchor', () => {
    expect(getAnchorScrollExtraBottom({
      offsetTop: 860.4,
      scrollHeight: 1661,
      clientHeight: 800,
      currentExtraBottom: 261
    })).toBe(261)
  })
})
