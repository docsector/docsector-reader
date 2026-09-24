import { readFileSync } from 'node:fs'

import { babelParse, walk } from 'vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

import { list } from '../src/document-headers.js'

const compact = (value) => String(value ?? '').replace(/\s+/g, '')

// : compacted argument lists of every `<object>.<method>(…)` call in `file`
const callsOf = (file, object, method) => {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf-8')
  const calls = []
  walk(babelParse(source, { sourceType: 'module' }), {
    enter (node) {
      if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression' &&
        node.callee.object?.name === object && node.callee.property?.name === method) {
        calls.push(node.arguments.map(argument => compact(source.slice(argument.start, argument.end))))
      }
    }
  })
  return calls
}

describe('DocumentHeaders.list', () => {
  it('adds an exact rule for a single-segment document next to its wildcard', () => {
    expect(list(['guide/getting-started/overview', 'guide/getting-started', 'sponsors/overview', 'sponsors']))
      .toEqual(['/guide/*', '/sponsors', '/sponsors/*', '/', '/index.html'])
  })

  it('keeps one wildcard per book when every document is nested (the pre-standalone output)', () => {
    expect(list(['manual/a/overview', 'manual/a', 'guide/b/overview', 'guide/b/showcase', 'guide/b']))
      .toEqual(['/guide/*', '/manual/*', '/', '/index.html'])
  })

  it('collapses duplicates, ignores blanks and accepts slashes', () => {
    expect(list(['/sponsors/', 'sponsors', '', null, undefined, '/', 'guide/x/overview/']))
      .toEqual(['/guide/*', '/sponsors', '/', '/index.html'])
    expect(list()).toEqual(['/', '/index.html'])
  })
})

describe('both prerenderers write the header rules for every written document', () => {
  it('the SPA meta prerender collects each subpage path and each bare page path', () => {
    expect(callsOf('src/quasar.factory.js', 'DocumentHeaders', 'list')).toEqual([['documentPaths']])
    expect(callsOf('src/quasar.factory.js', 'documentPaths', 'push')).toEqual([['routePath'], ['basePath']])
  })

  it('the SSR prerender passes the bare page paths along with the routes', () => {
    expect(callsOf('bin/ssr-prerender.mjs', 'DocumentHeaders', 'list')).toEqual([
      ['routes.flatMap((route)=>route.basePath?[route.routePath,route.basePath]:[route.routePath])']
    ])
  })
})
