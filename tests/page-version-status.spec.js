import { describe, expect, it } from 'vitest'

import { describe as describeChip, latest, normalize, parse, resolve, timeline, upcoming } from '../src/components/page-version-status.js'

describe('page version status — parse', () => {
  it('reads prefixed, short and prerelease ids', () => {
    expect(parse('v1.3.0')).toEqual({ major: 1, minor: 3, patch: 0 })
    expect(parse('1.3')).toEqual({ major: 1, minor: 3, patch: 0 })
    expect(parse('v1.0.0-beta.6')).toEqual({ major: 1, minor: 0, patch: 0 })
    expect(parse(' v0.18.0 ')).toEqual({ major: 0, minor: 18, patch: 0 })
  })

  it('rejects what is not a version', () => {
    expect(parse('latest')).toBeNull()
    expect(parse('1')).toBeNull()
    expect(parse('v1.x')).toBeNull()
    expect(parse('2024-05-01')).toBeNull()
    expect(parse('v1.3.0 beta')).toBeNull()
    expect(parse('')).toBeNull()
    expect(parse(null)).toBeNull()
    expect(parse(130)).toBeNull()
  })
})

describe('page version status — latest', () => {
  it('picks the highest released descriptor, not the list order', () => {
    expect(latest([
      { id: 'v1.0.0', released: true },
      { id: 'v1.3.0', released: true },
      { id: 'v1.3.1', current: true, released: true }
    ])).toBe('v1.3.1')
    expect(latest([
      { id: 'v1.3.1', current: true, released: true },
      { id: 'v1.3.0', released: true }
    ])).toBe('v1.3.1')
  })

  it('skips descriptors the selector marks unreleased', () => {
    // ? Shapes the selector normalizes: released:false, a preview releaseStatus, a draft current
    expect(latest([
      { id: 'v2.0.0', released: false, releaseStatus: 'preview' },
      { id: 'v1.4.0', current: true, released: false },
      { id: 'v1.2.0', released: true, deprecated: true },
      { id: 'v0.x', released: true }
    ])).toBe('v1.2.0')
  })

  it('accepts plain ids and returns null when nothing released parses', () => {
    expect(latest(['v1.1.0', ' v1.2.0 '])).toBe('v1.2.0')
    expect(latest([{ id: 'current', released: true }])).toBeNull()
    expect(latest([])).toBeNull()
    expect(latest()).toBeNull()
  })
})

describe('page version status — upcoming', () => {
  it('is true for any release not out yet, patch included', () => {
    expect(upcoming('v1.4.0', 'v1.3.1')).toBe(true)
    expect(upcoming('v1.3.2', 'v1.3.1')).toBe(true)
    expect(upcoming('v1.3.1', 'v1.3.1')).toBe(false)
    expect(upcoming('v1.2.0', 'v1.3.1')).toBe(false)
    expect(upcoming('v1.4.0', null)).toBe(false)
    expect(upcoming('nope', 'v1.3.1')).toBe(false)
  })
})

describe('page version status — normalize', () => {
  it('sorts, dedupes and drops unparseable ids', () => {
    expect(normalize(['v1.4.0', 'v1.3.0', 'v1.3.0', 'nope', 7, ' v1.2.0 '])).toEqual(['v1.2.0', 'v1.3.0', 'v1.4.0'])
  })

  it('accepts a single id and nothing', () => {
    expect(normalize('v1.3.0')).toEqual(['v1.3.0'])
    expect(normalize(undefined)).toEqual([])
    expect(normalize(null)).toEqual([])
  })
})

describe('page version status — resolve', () => {
  const released = 'v1.3.1'

  it('marks a page shipped after the latest release as soon', () => {
    expect(resolve({ version: 'v1.4.0' }, released)).toEqual({ kind: 'soon', version: 'v1.4.0', reason: 'page' })
  })

  it('marks a page of the latest released minor as new, patch included', () => {
    expect(resolve({ version: 'v1.3.0' }, released)).toEqual({ kind: 'new', version: 'v1.3.0', reason: 'page' })
    expect(resolve({ version: 'v1.3.1' }, released)).toEqual({ kind: 'new', version: 'v1.3.1', reason: 'page' })
  })

  it('drops the new chip once the next minor ships', () => {
    expect(resolve({ version: 'v1.3.0' }, 'v1.4.0')).toEqual({ kind: null, version: null, reason: null })
  })

  it('marks an older page updated in a future release as soon (update)', () => {
    expect(resolve({ version: 'v0.18.0', updated: ['v1.3.0', 'v1.4.0', 'v1.5.0'] }, released))
      .toEqual({ kind: 'soon', version: 'v1.4.0', reason: 'update' })
  })

  it('marks an older page updated in the latest released minor as updated', () => {
    expect(resolve({ version: 'v0.18.0', updated: ['v1.2.0', 'v1.3.0', 'v1.3.1'] }, released))
      .toEqual({ kind: 'updated', version: 'v1.3.1', reason: 'update' })
  })

  it('shows nothing for an older page with older updates only', () => {
    expect(resolve({ version: 'v0.18.0', updated: ['v1.2.0'] }, released)).toEqual({ kind: null, version: null, reason: null })
    expect(resolve({ version: 'v0.18.0' }, released)).toEqual({ kind: null, version: null, reason: null })
  })

  it('lets the page chip win over its updates', () => {
    expect(resolve({ version: 'v1.3.0', updated: ['v1.4.0'] }, released).kind).toBe('new')
  })

  it('ignores a stale manual new status when a version is set', () => {
    expect(resolve({ status: 'new', version: 'v1.0.0' }, released).kind).toBeNull()
  })

  it('reads the updates of a page with no usable version', () => {
    expect(resolve({ updated: ['v1.3.0'] }, released)).toEqual({ kind: 'updated', version: 'v1.3.0', reason: 'update' })
    expect(resolve({ version: 'v0.x', updated: ['v1.4.0'] }, released)).toEqual({ kind: 'soon', version: 'v1.4.0', reason: 'update' })
    expect(resolve({ status: 'new', updated: ['v1.2.0'] }, released)).toEqual({ kind: 'new', version: null, reason: 'page' })
  })

  it('keeps the legacy new chip over recent and future updates', () => {
    expect(resolve({ status: 'new', updated: ['v1.3.0'] }, released)).toEqual({ kind: 'new', version: null, reason: 'page' })
    expect(resolve({ status: 'new', updated: ['v1.4.0'] }, released)).toEqual({ kind: 'new', version: null, reason: 'page' })
  })

  it('keeps the legacy static new chip without a comparable version', () => {
    expect(resolve({ status: 'new' }, released)).toEqual({ kind: 'new', version: null, reason: 'page' })
    expect(resolve({ status: 'new', version: 'v1.0.0' }, null)).toEqual({ kind: 'new', version: 'v1.0.0', reason: 'page' })
    expect(resolve({ status: 'done', version: 'v1.0.0' }, null).kind).toBeNull()
  })

  it('keeps draft and empty above everything', () => {
    expect(resolve({ status: 'draft', version: 'v1.4.0' }, released)).toEqual({ kind: 'draft', version: null, reason: null })
    expect(resolve({ status: 'empty', version: 'v1.3.0' }, released)).toEqual({ kind: 'empty', version: null, reason: null })
  })

  it('compares prerelease releases by their minor', () => {
    expect(resolve({ version: 'v1.0.0' }, 'v1.0.0-beta.6').kind).toBe('new')
    expect(resolve({ version: 'v0.24.0' }, 'v1.0.0-rc.1').kind).toBeNull()
  })
})

describe('page version status — describe (menu chip)', () => {
  const released = 'v1.3.1'
  // ? Route meta also carries the DOCS version under `version`: it must never drive the chip
  const meta = (fields) => ({ status: 'done', version: 'v1.3.1', ...fields })

  it('reads pageVersion and pageUpdated, not the docs version', () => {
    expect(describeChip(meta({ pageVersion: 'v0.18.0' }), released)).toBeNull()
    expect(describeChip(meta({ pageVersion: 'v0.18.0', pageUpdated: ['v1.3.0'] }), released).kind).toBe('updated')
  })

  it('gives each kind its colours, label and tooltip key', () => {
    expect(describeChip(meta({ pageVersion: 'v1.3.0' }), released)).toEqual({
      kind: 'new', color: 'positive', textColor: 'white', label: 'menu.status.new._', tooltip: 'menu.status.new.tooltipVersion', version: 'v1.3.0'
    })
    expect(describeChip(meta({ pageVersion: 'v1.4.0' }), released)).toEqual({
      kind: 'soon', color: 'warning', textColor: 'dark', label: 'menu.status.soon._', tooltip: 'menu.status.soon.tooltipVersion', version: 'v1.4.0'
    })
    expect(describeChip(meta({ pageVersion: 'v0.18.0', pageUpdated: ['v1.4.0'] }), released)).toEqual({
      kind: 'soon', color: 'warning', textColor: 'dark', label: 'menu.status.soon._', tooltip: 'menu.status.soon.tooltipUpdated', version: 'v1.4.0'
    })
    expect(describeChip(meta({ pageVersion: 'v0.18.0', pageUpdated: ['v1.3.0'] }), released)).toEqual({
      kind: 'updated', color: 'info', textColor: 'white', label: 'menu.status.updated._', tooltip: 'menu.status.updated.tooltipVersion', version: 'v1.3.0'
    })
    expect(describeChip(meta({ status: 'draft' }), released)).toMatchObject({ color: 'orange', textColor: 'dark', tooltip: 'menu.status.draft.tooltip' })
    expect(describeChip(meta({ status: 'empty' }), released)).toMatchObject({ color: 'red', textColor: 'white', tooltip: 'menu.status.empty.tooltip' })
    expect(describeChip(meta({ status: 'new' }), released)).toMatchObject({ kind: 'new', tooltip: 'menu.status.new.tooltip', version: null })
  })

  it('speaks in the future tense for an unreleased patch of the released minor', () => {
    expect(describeChip(meta({ pageVersion: 'v1.3.2' }), released)).toMatchObject({ kind: 'new', tooltip: 'menu.status.soon.tooltipVersion' })
    expect(describeChip(meta({ pageVersion: 'v0.18.0', pageUpdated: ['v1.3.2'] }), released)).toMatchObject({ kind: 'updated', tooltip: 'menu.status.soon.tooltipUpdated' })
  })

  it('shows only the legacy chip with nothing released to compare', () => {
    expect(describeChip(meta({ pageVersion: 'v1.3.0' }), null)).toBeNull()
    expect(describeChip(null, released)).toBeNull()
  })
})

describe('page version status — timeline (page bar)', () => {
  const released = 'v1.3.1'

  it('splits the updates into the ones out and the ones to come', () => {
    expect(timeline({ pageVersion: 'v0.18.0', pageUpdated: ['v1.2.0', 'v1.3.0', 'v1.3.2', 'v1.4.0'] }, released)).toEqual({
      version: 'v0.18.0', versionLabel: 'page.newVersion', past: 'v1.2.0, v1.3.0', future: 'v1.3.2, v1.4.0'
    })
  })

  it('announces a page release that is not out yet', () => {
    expect(timeline({ pageVersion: 'v1.3.2' }, released)).toMatchObject({ versionLabel: 'page.comingVersion', past: '', future: '' })
    expect(timeline({ pageVersion: 'v1.3.1' }, released).versionLabel).toBe('page.newVersion')
  })

  it('keeps everything in the past tense with nothing released to compare', () => {
    expect(timeline({ pageVersion: 'v9.0.0', pageUpdated: ['v9.1.0'] }, null)).toEqual({
      version: 'v9.0.0', versionLabel: 'page.newVersion', past: 'v9.1.0', future: ''
    })
    expect(timeline(undefined, released)).toEqual({ version: '', versionLabel: 'page.newVersion', past: '', future: '' })
  })
})
