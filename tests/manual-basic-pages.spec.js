import { describe, expect, it } from 'vitest'

import manualPages from '../src/pages/manual.index.js'

describe('manual basic pages registry', () => {
  it('moves the remaining technical docs into Basic and removes obsolete pages', () => {
    expect(manualPages['/basic']).toBeDefined()
    expect(manualPages['/basic/d-menu']).toBeDefined()
    expect(manualPages['/basic/search']).toBeDefined()
    expect(manualPages['/basic/branding']).toBeDefined()
    expect(manualPages['/basic/version-switcher']).toBeDefined()
    expect(manualPages['/basic/d-page-anchor']).toBeDefined()
    expect(manualPages['/basic/d-page-meta']).toBeDefined()
    expect(manualPages['/basic/edit-on-github']).toBeDefined()
    expect(manualPages['/basic/translation-progress']).toBeDefined()
    expect(manualPages['/basic/previous-and-next']).toBeDefined()

    expect(manualPages['/basic/d-menu'].config.menu.header).toBeUndefined()
    expect(manualPages['/basic/d-menu'].config.menu.subheader).toBe('.basic')
    expect(manualPages['/basic/d-menu'].data['en-US'].title).toBe('Navigation Menu')
    expect(manualPages['/basic/search'].data['en-US'].title).toBe('Search')
    expect(manualPages['/basic/branding'].data['en-US'].title).toBe('Branding')
    expect(manualPages['/basic/version-switcher'].data['en-US'].title).toBe('Version Switcher')
    expect(manualPages['/basic/d-page-anchor'].data['en-US'].title).toBe('Table of Contents')
    expect(manualPages['/basic/d-page-meta'].data['en-US'].title).toBe('Page Footer')
    expect(manualPages['/basic/edit-on-github'].data['en-US'].title).toBe('Edit on GitHub')
    expect(manualPages['/basic/translation-progress'].data['en-US'].title).toBe('Translation Progress')
    expect(manualPages['/basic/previous-and-next'].data['en-US'].title).toBe('Previous & Next')

    expect(manualPages['/components/d-menu']).toBeUndefined()
    expect(manualPages['/components/d-page-anchor']).toBeUndefined()
    expect(manualPages['/components/d-page-meta']).toBeUndefined()
    expect(manualPages['/components/d-page-section']).toBeUndefined()
    expect(manualPages['/components/q-zoom']).toBeUndefined()
    expect(manualPages['/composables/use-navigator']).toBeUndefined()
    expect(manualPages['/store/modules']).toBeUndefined()
  })
})