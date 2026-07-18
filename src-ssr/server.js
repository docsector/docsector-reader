/**
 * Docsector Reader — minimal SSR webserver surface.
 *
 * Docsector uses Quasar's SSR mode ONLY as a build-time renderer: a post-build
 * step imports the generated server entry, renders every route to static HTML
 * and deploys the client bundle to a static host (Cloudflare Pages). The
 * Node webserver produced by the SSR build is never executed in production —
 * these hooks exist so the build compiles, and double as a tiny local preview
 * server (`node dist/ssr/index.js`) without express/compression dependencies.
 */
import { createServer } from 'node:http'

import {
  defineSsrCreate,
  defineSsrListen,
  defineSsrClose,
  defineSsrServeStaticContent,
  defineSsrRenderPreloadTag
} from '#q-app/wrappers'

export const create = defineSsrCreate(() => {
  // ? A micro connect-style app: routes registered by middlewares/render.js
  const routes = []

  const app = {
    get (_path, handler) {
      routes.push(handler)
    },

    use () { /* static content is served by the host, not this server */ },

    handle (req, res) {
      if (routes.length === 0) {
        res.statusCode = 404
        res.end('Not found')
        return
      }

      res.setHeader = res.setHeader.bind(res)
      res.send = (body) => { res.end(body) }
      res.status = (code) => { res.statusCode = code; return res }
      res.redirect = (codeOrUrl, maybeUrl) => {
        const url = typeof codeOrUrl === 'number' ? maybeUrl : codeOrUrl
        res.statusCode = typeof codeOrUrl === 'number' ? codeOrUrl : 302
        res.setHeader('Location', url)
        res.end()
      }

      routes[0](req, res)
    }
  }

  return app
})

export const listen = defineSsrListen(({ app, devHttpsApp, port }) => {
  const server = createServer((req, res) => app.handle(req, res))
  return server.listen(port, () => {
    console.log(`[docsector] SSR preview listening on http://localhost:${port}`)
  })
})

export const close = defineSsrClose(({ listenResult }) => {
  return listenResult?.close?.()
})

export const serveStaticContent = defineSsrServeStaticContent((/* { app, resolve } */) => {
  // : Static assets are served by the static host (or the preview's 404)
  return () => {}
})

const jsRE = /\.js$/
const cssRE = /\.css$/
const woffRE = /\.woff$/
const woff2RE = /\.woff2$/
const gifRE = /\.gif$/
const jpgRE = /\.jpe?g$/
const pngRE = /\.png$/

export const renderPreloadTag = defineSsrRenderPreloadTag((file /* , { ssrContext } */) => {
  if (jsRE.test(file) === true) {
    return `<link rel="modulepreload" href="${file}" crossorigin>`
  }
  if (cssRE.test(file) === true) {
    return `<link rel="stylesheet" href="${file}" crossorigin>`
  }
  if (woffRE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`
  }
  if (woff2RE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`
  }
  if (gifRE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="image" type="image/gif" crossorigin>`
  }
  if (jpgRE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="image" type="image/jpeg" crossorigin>`
  }
  if (pngRE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="image" type="image/png" crossorigin>`
  }

  return ''
})
