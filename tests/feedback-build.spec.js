/* global globalThis */

import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  FEEDBACK_SERVER_ANCHOR,
  buildFeedbackServerConfig,
  renderFeedbackServer
} from '../src/feedback/build.js'

const TEMPLATE = readFileSync(new URL('../src/feedback/server.js', import.meta.url), 'utf-8')

// : the rendered endpoint as an ES module — no `__FEEDBACK_CONFIG__` global is
//   defined, exactly like the Pages runtime
const importRendered = (source) => import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`)

const vote = (body) => new Request('https://docs.example.com/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})

describe('buildFeedbackServerConfig', () => {
  it('bakes the binding, the configured locales and the registry version ids', () => {
    const config = buildFeedbackServerConfig({
      feedback: { enabled: true, binding: 'VOTES' },
      defaultLanguage: 'en-US',
      languages: [{ value: 'en-US' }, { value: 'pt-BR' }, { label: 'no value' }, null]
    }, {
      versions: [{ id: 'v1.0.0', current: true }, { id: 'v0.x' }, { id: 'v0.x' }, { label: 'no id' }, '2024 Edition']
    })

    expect(config).toEqual({
      binding: 'VOTES',
      languages: ['en-US', 'pt-BR'],
      versions: ['v1.0.0', 'v0.x', '2024 Edition']
    })
  })

  it('adds the default language when `languages` leaves it out, as the build does', () => {
    const config = buildFeedbackServerConfig({ defaultLanguage: 'en-US', languages: [{ value: 'pt-BR' }] })

    expect(config.languages).toEqual(['pt-BR', 'en-US'])
  })

  it('falls back to the first language, then en-US', () => {
    expect(buildFeedbackServerConfig({ languages: [{ value: 'pt-BR' }] }).languages).toEqual(['pt-BR'])
    expect(buildFeedbackServerConfig({}).languages).toEqual(['en-US'])
  })

  it('keeps version ids verbatim — the router uses them untrimmed', () => {
    expect(buildFeedbackServerConfig({}, { versions: [{ id: ' v1 ' }] }).versions).toEqual([' v1 '])
  })
})

describe('renderFeedbackServer', () => {
  it('finds the anchor exactly once in the shipped template', () => {
    expect(TEMPLATE.split(FEEDBACK_SERVER_ANCHOR)).toHaveLength(2)
  })

  it('refuses a template without the anchor, or with it twice', () => {
    expect(() => renderFeedbackServer('export const x = 1', {})).toThrow(/exactly once \(found 0\)/)
    expect(() => renderFeedbackServer(`${FEEDBACK_SERVER_ANCHOR}\n${FEEDBACK_SERVER_ANCHOR}`, {})).toThrow(/found 2/)
  })

  it('renders an endpoint that runs without the build global and records a vote', async () => {
    delete globalThis.__FEEDBACK_CONFIG__

    const source = renderFeedbackServer(TEMPLATE, { binding: 'FEEDBACK', languages: ['en-US'], versions: ['v1.0.0'] })
    const { onRequestPost } = await importRendered(source)
    const points = []
    const response = await onRequestPost({
      env: { FEEDBACK: { writeDataPoint: (point) => points.push(point) } },
      request: vote({ path: '/guide', locale: 'en-US', version: 'v1.0.0', rating: 'positive', previous: null })
    })

    expect(response.status).toBe(204)
    expect(points).toHaveLength(1)
  })

  it('keeps hostile config values inert', async () => {
    const hostile = { binding: "X*/ globalThis.pwned = 1 /*$&$`$'", languages: ["en-US'\"`${1}</script>"], versions: ['v1'] }
    const source = renderFeedbackServer(TEMPLATE, hostile)

    // ? the global comment keeps the bare name, so nothing can close it
    expect(source).toContain('/* global __FEEDBACK_CONFIG__ */')
    await importRendered(source)
    expect(globalThis.pwned).toBeUndefined()
  })
})
