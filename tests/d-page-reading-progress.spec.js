import { describe, expect, it } from 'vitest'

import {
  DEFAULT_READING_PROGRESS_THRESHOLD,
  getReadingProgressState
} from '../src/composables/useReadingProgress.js'

describe('getReadingProgressState', () => {
  it('returns a hidden zero state when the page does not overflow', () => {
    expect(getReadingProgressState({
      scrollTop: 120,
      scrollHeight: 800,
      clientHeight: 800
    })).toEqual({
      hasOverflow: false,
      maxScrollTop: 0,
      scrollTop: 0,
      progressPercent: 0,
      visibleOffset: 0,
      isVisible: false
    })
  })

  it('keeps the control hidden at the top even when content overflows', () => {
    const state = getReadingProgressState({
      scrollTop: 0,
      scrollHeight: 1600,
      clientHeight: 800
    })

    expect(state.hasOverflow).toBe(true)
    expect(state.progressPercent).toBe(0)
    expect(state.visibleOffset).toBe(Math.round(800 * DEFAULT_READING_PROGRESS_THRESHOLD))
    expect(state.isVisible).toBe(false)
  })

  it('rounds progress percentage from the current scroll position', () => {
    const state = getReadingProgressState({
      scrollTop: 300,
      scrollHeight: 1400,
      clientHeight: 800
    })

    expect(state.maxScrollTop).toBe(600)
    expect(state.progressPercent).toBe(50)
  })

  it('shows the control once the configured threshold is crossed', () => {
    const state = getReadingProgressState({
      scrollTop: 96,
      scrollHeight: 1600,
      clientHeight: 800,
      visibilityThreshold: 0.12
    })

    expect(state.visibleOffset).toBe(96)
    expect(state.isVisible).toBe(true)
  })

  it('caps progress at the bottom of the page', () => {
    const state = getReadingProgressState({
      scrollTop: 9999,
      scrollHeight: 1600,
      clientHeight: 800
    })

    expect(state.scrollTop).toBe(800)
    expect(state.progressPercent).toBe(100)
    expect(state.isVisible).toBe(true)
  })

  it('normalizes invalid numeric values into a hidden zero state', () => {
    expect(getReadingProgressState({
      scrollTop: 'NaN',
      scrollHeight: -10,
      clientHeight: null,
      visibilityThreshold: 3
    })).toEqual({
      hasOverflow: false,
      maxScrollTop: 0,
      scrollTop: 0,
      progressPercent: 0,
      visibleOffset: 0,
      isVisible: false
    })
  })
})