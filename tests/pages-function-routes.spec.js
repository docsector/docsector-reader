import { describe, expect, it } from 'vitest'

import { mergePagesFunctionRoutes } from '../src/quasar.factory.js'

const EMPTY = Object.freeze({ version: 1, include: [], exclude: [] })

describe('mergePagesFunctionRoutes', () => {
  it('routes each enabled Function by its path', () => {
    const routes = mergePagesFunctionRoutes(EMPTY, {
      mcp: true,
      assistant: true,
      feedback: true,
      webBotAuthPath: '/.well-known/http-message-signatures-directory'
    })

    expect(routes.include).toEqual(['/mcp', '/assistant', '/feedback', '/.well-known/http-message-signatures-directory'])
  })

  it('routes /feedback only when page feedback is enabled', () => {
    expect(mergePagesFunctionRoutes(EMPTY, { feedback: true }).include).toEqual(['/feedback'])
    expect(mergePagesFunctionRoutes(EMPTY, { assistant: true }).include).toEqual(['/assistant'])
  })

  it('collapses to the catch-all under markdown negotiation — Pages rejects overlaps', () => {
    const routes = mergePagesFunctionRoutes({ ...EMPTY, include: ['/feedback'] }, { markdownNegotiation: true, feedback: true, mcp: true })

    expect(routes.include).toEqual(['/*'])
  })

  it('keeps existing rules and fields without duplicating them', () => {
    const existing = { version: 1, include: ['/custom', '/feedback'], exclude: ['/assets/*', '/private/*'], note: 'kept' }
    const routes = mergePagesFunctionRoutes(existing, { feedback: true })

    expect(routes.include).toEqual(['/custom', '/feedback'])
    expect(routes.exclude.filter(path => path === '/assets/*')).toHaveLength(1)
    expect(routes.exclude).toContain('/private/*')
    expect(routes.note).toBe('kept')
    expect(existing.include).toEqual(['/custom', '/feedback'])
  })

  it('excludes static assets from the Functions runtime', () => {
    const { exclude } = mergePagesFunctionRoutes(EMPTY, { feedback: true })

    expect(exclude).toEqual(expect.arrayContaining(['/assets/*', '/*.js', '/*.css', '/*.woff2', '/*.map']))
  })

  it('survives a malformed existing file', () => {
    const routes = mergePagesFunctionRoutes({ include: 'nope' }, { feedback: true })

    expect(routes).toMatchObject({ version: 1, include: ['/feedback'] })
  })
})
