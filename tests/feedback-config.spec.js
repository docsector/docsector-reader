import { describe, expect, it } from 'vitest'

import {
  DEFAULT_FEEDBACK_BINDING,
  FEEDBACK_ENDPOINT,
  isFeedbackVisible,
  normalizeFeedbackConfig
} from '../src/feedback/config.js'

describe('feedback config', () => {
  it('is disabled by default', () => {
    expect(normalizeFeedbackConfig({})).toEqual({ enabled: false, binding: 'FEEDBACK' })
    expect(normalizeFeedbackConfig(undefined).enabled).toBe(false)
    expect(DEFAULT_FEEDBACK_BINDING).toBe('FEEDBACK')
    expect(FEEDBACK_ENDPOINT).toBe('/feedback')
  })

  it('enables only on a literal true', () => {
    expect(normalizeFeedbackConfig({ feedback: { enabled: true } }).enabled).toBe(true)
    expect(normalizeFeedbackConfig({ feedback: { enabled: 'true' } }).enabled).toBe(false)
    expect(normalizeFeedbackConfig({ feedback: { enabled: 1 } }).enabled).toBe(false)
  })

  it('trims a custom binding and falls back on blank or non-string values', () => {
    expect(normalizeFeedbackConfig({ feedback: { binding: '  DOCS_VOTES ' } }).binding).toBe('DOCS_VOTES')
    expect(normalizeFeedbackConfig({ feedback: { binding: '   ' } }).binding).toBe('FEEDBACK')
    expect(normalizeFeedbackConfig({ feedback: { binding: 42 } }).binding).toBe('FEEDBACK')
  })
})

describe('isFeedbackVisible', () => {
  const enabled = { feedback: { enabled: true } }

  it('hides the prompt from every page of a site that never opted in', () => {
    for (const status of ['done', 'new', 'draft', 'empty', undefined]) {
      expect(isFeedbackVisible({}, status)).toBe(false)
    }
  })

  it('shows it on every page with content once enabled', () => {
    for (const status of ['done', 'new', 'draft', undefined]) {
      expect(isFeedbackVisible(enabled, status)).toBe(true)
    }
  })

  it('hides it on empty pages', () => {
    expect(isFeedbackVisible(enabled, 'empty')).toBe(false)
  })
})
