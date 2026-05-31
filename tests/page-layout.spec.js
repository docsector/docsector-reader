import { describe, expect, it } from 'vitest'

import {
  HOME_PAGE_FULLWIDTH_LAYOUT,
  PAGE_LAYOUT_DEFAULT,
  PAGE_LAYOUT_FULLWIDTH,
  resolveHomePageLayout,
  resolvePageLayout,
  resolveRoutePageLayout
} from '../src/page-layout.js'

describe('page layout resolution', () => {
  it('keeps the default documentation chrome enabled', () => {
    expect(resolvePageLayout()).toEqual({
      mode: PAGE_LAYOUT_DEFAULT,
      sidebar: true,
      submenu: true,
      toc: true,
      footer: true,
      contentWidth: 'contained'
    })
  })

  it('resolves fullwidth into explicit chrome flags', () => {
    expect(resolvePageLayout(PAGE_LAYOUT_FULLWIDTH)).toEqual({
      mode: PAGE_LAYOUT_FULLWIDTH,
      sidebar: false,
      submenu: false,
      toc: false,
      footer: true,
      contentWidth: 'fullwidth'
    })
  })

  it('lets explicit layout flags override a preset', () => {
    expect(resolvePageLayout(PAGE_LAYOUT_FULLWIDTH, { footer: false, toc: true })).toEqual({
      mode: PAGE_LAYOUT_FULLWIDTH,
      sidebar: false,
      submenu: false,
      toc: true,
      footer: false,
      contentWidth: 'fullwidth'
    })
  })

  it('keeps the homepage on the default layout unless it opts into fullwidth', () => {
    expect(resolveHomePageLayout()).toEqual({
      mode: PAGE_LAYOUT_DEFAULT,
      sidebar: true,
      submenu: true,
      toc: true,
      footer: true,
      contentWidth: 'contained'
    })

    expect(resolveRoutePageLayout({
      meta: {
        book: 'home'
      }
    })).toEqual({
      mode: PAGE_LAYOUT_DEFAULT,
      sidebar: true,
      submenu: true,
      toc: true,
      footer: true,
      contentWidth: 'contained'
    })
  })

  it('uses fullwidth without footer when the homepage opts in', () => {
    expect(HOME_PAGE_FULLWIDTH_LAYOUT).toEqual({
      mode: PAGE_LAYOUT_FULLWIDTH,
      sidebar: false,
      submenu: false,
      toc: false,
      footer: false,
      contentWidth: 'fullwidth'
    })

    expect(resolveHomePageLayout({ layout: PAGE_LAYOUT_FULLWIDTH })).toEqual(HOME_PAGE_FULLWIDTH_LAYOUT)
  })

  it('falls back to default for unsupported homepage layout values', () => {
    expect(resolveHomePageLayout({ layout: 'wide' })).toEqual(resolvePageLayout(PAGE_LAYOUT_DEFAULT))
  })

  it('lets route layouts opt the homepage into fullwidth', () => {
    expect(resolveRoutePageLayout({
      meta: {
        book: 'home',
        layouts: HOME_PAGE_FULLWIDTH_LAYOUT
      }
    })).toEqual(HOME_PAGE_FULLWIDTH_LAYOUT)
  })
})
