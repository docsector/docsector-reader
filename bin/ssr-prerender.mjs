/**
 * Docsector Reader — SSR prerender loop.
 *
 * Runs after `quasar build -m ssr`: imports the generated server entry, renders
 * every documented route to a static, hydration-ready HTML file (fragment
 * anchors included) inside dist/ssr/client, emits the Early Hints Link rules,
 * and finally moves the client bundle to dist/spa so static hosts keep their
 * configured output directory. The Node webserver is never deployed.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { buildWebMcpInlineScript } from '../src/webmcp-tools.js'

// ? A neutral desktop UA: Quasar Platform only uses it for body classes, which
//   live outside the Vue app and are re-synced by the client on boot
const PRERENDER_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 DocsectorPrerender'

const cssRE = /\.css$/

// : Mirrors src-ssr/server.js renderPreloadTag (that module needs the Vite
//   `#q-app` alias and cannot be imported under plain Node) — reduced to
//   stylesheets only. JS: the first paint is server-rendered, so preloading
//   chunks only steals slow-link bandwidth from the render-blocking CSS
//   (measured −1s FCP on slow-4G). Fonts: font-display: optional paints the
//   metric-matched fallback regardless, while a preloaded font is chained
//   into the text LCP dependency graph by Lighthouse's simulator (measured
//   −600ms LCP without it); the @font-face fetch still warms the cache.
function preloadTag (file) {
  if (cssRE.test(file) === true) {
    return `<link rel="stylesheet" href="${file}" crossorigin>`
  }

  return ''
}

// : Content first, interactivity second: drop every JS modulepreload the
//   bundler emitted and demote the entry module fetch, so the render-blocking
//   CSS owns the pipe until the server-rendered page has painted
function prioritizePaint (html) {
  return html
    .replace(/<link rel="?modulepreload"?[^>]*>/g, '')
    .replace(/(<script type="?module"?)(?=[^>]*\bsrc=)/, '$1 fetchpriority=low')
}

// : useMeta renders the per-route <title> + description/OG/Twitter tags, but
//   the template's static defaults stay behind them — duplicated tags in
//   every head. Keep the rendered (data-qmeta) tag and drop its static twin;
//   statics without a rendered counterpart survive as fallbacks.
function dedupeMeta (html) {
  const headEnd = html.indexOf('</head>')
  if (headEnd === -1) {
    return html
  }

  let head = html.slice(0, headEnd)
  const rest = html.slice(headEnd)

  // # <title>: the rendered one comes first — drop later twins
  const titles = [...head.matchAll(/<title>[\s\S]*?<\/title>/g)]
  for (const extra of titles.slice(1)) {
    head = head.replace(extra[0], '')
  }

  // # meta: drop static tags whose name/property has a rendered counterpart
  const metaRE = /<meta [^>]*?(?:name|property)=("?)([^">\s]+)\1[^>]*>/g
  const rendered = new Set()
  for (const match of head.matchAll(metaRE)) {
    if (match[0].includes('data-qmeta')) {
      rendered.add(match[2])
    }
  }
  if (rendered.size > 0) {
    head = head.replace(metaRE, (tag, _quote, key) =>
      rendered.has(key) && !tag.includes('data-qmeta') ? '' : tag)
  }

  return head + rest
}

export async function prerenderSsr ({ projectRoot, packageRoot }) {
  const ssrDir = resolve(projectRoot, 'dist', 'ssr')
  const clientDir = resolve(ssrDir, 'client')
  const serverEntryPath = resolve(ssrDir, 'server', 'server-entry.js')
  const renderTemplatePath = resolve(ssrDir, 'render-template.js')
  const manifestPath = resolve(ssrDir, 'quasar.manifest.json')

  for (const required of [clientDir, serverEntryPath, renderTemplatePath, manifestPath]) {
    if (!existsSync(required)) {
      throw new Error(`SSR prerender: missing build artifact ${required}`)
    }
  }

  const { renderToString } = await import('vue/server-renderer')
  const { default: serverEntry } = await import(pathToFileURL(serverEntryPath).href)
  const { default: renderTemplate } = await import(pathToFileURL(renderTemplatePath).href)
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  const factoryUrl = pathToFileURL(resolve(packageRoot, 'src', 'quasar.factory.js')).href
  const { buildPageRoutePath, loadBooksRegistry } = await import(factoryUrl)

  const configUrl = pathToFileURL(resolve(projectRoot, 'docsector.config.js')).href
  const { default: config } = await import(configUrl)

  // ! WebMCP tools register at HTML-parse time via this inline script — the
  //   low-priority entry bundle arrives seconds later on slow links, and
  //   agent checkers time out waiting for a runtime-only registration. The
  //   app connects the real implementations once it boots (empty when the
  //   webMcp feature is disabled).
  const webMcpInline = buildWebMcpInlineScript(config)
  const injectWebMcp = (html) => (
    webMcpInline === '' ? html : html.replace('<head>', `<head>${webMcpInline}`)
  )

  // @ Preload tags for the modules a render actually used (webserver parity)
  const renderPreloads = (modules) => {
    let output = ''
    const seen = new Set()

    for (const mod of modules || []) {
      const files = manifest[mod]
      if (files === undefined) continue

      for (const file of files) {
        if (seen.has(file)) continue
        seen.add(file)

        const base = file.split('/').pop()
        if (manifest[base] !== undefined) {
          for (const dependency of manifest[base]) {
            if (!seen.has(dependency)) {
              output += preloadTag(dependency)
              seen.add(dependency)
            }
          }
        }

        output += preloadTag(file)
      }
    }

    return output
  }

  const render = async (url) => {
    const onRendered = []
    const ssrContext = {
      req: {
        url,
        headers: {
          'user-agent': PRERENDER_USER_AGENT,
          accept: 'text/html'
        }
      },
      res: {
        setHeader () {},
        getHeader () { return undefined }
      },
      _meta: {},
      onRendered: (fn) => { onRendered.push(fn) }
    }

    const app = await serverEntry(ssrContext)
    const runtimePageContent = await renderToString(app, ssrContext)

    onRendered.forEach((fn) => { fn() })
    if (typeof ssrContext.rendered === 'function') {
      ssrContext.rendered()
    }

    ssrContext._meta.runtimePageContent = runtimePageContent
    ssrContext._meta.endingHeadTags += renderPreloads(ssrContext.modules)

    return injectWebMcp(dedupeMeta(prioritizePaint(renderTemplate(ssrContext))))
  }

  // ! Route worklist — same predicate the meta prerenderer used; internal-link
  //   pages get a static redirect document instead of a render
  const { pageEntries } = await loadBooksRegistry(projectRoot)
  const routes = []
  const linkRoutes = []

  for (const entry of pageEntries) {
    const { page } = entry
    if (page.config === null) continue
    if (page.config.status === 'empty') continue

    const linkTarget = typeof page.config?.link?.to === 'string' ? page.config.link.to.trim() : ''
    if (linkTarget.length > 0) {
      linkRoutes.push({
        routePath: buildPageRoutePath(entry, ''),
        target: linkTarget
      })
      continue
    }

    const subpages = ['overview']
    if (page.config.subpages?.showcase) subpages.push('showcase')
    if (page.config.subpages?.vs) subpages.push('vs')

    for (const subpage of subpages) {
      routes.push({
        routePath: buildPageRoutePath(entry, subpage),
        basePath: subpage === 'overview' ? buildPageRoutePath(entry, '') : null
      })
    }
  }

  // @@ Render every route (CPU-bound — sequential is as fast as a pool here)
  let rendered = 0
  let failed = 0
  let firstHtml = null

  for (const route of routes) {
    try {
      const html = await render(`/${route.routePath}`)
      if (firstHtml === null) firstHtml = html

      const dir = resolve(clientDir, route.routePath)
      mkdirSync(dir, { recursive: true })
      writeFileSync(resolve(dir, 'index.html'), html)
      // Slash-less twin: Cloudflare Pages serves <route>.html without a 308
      writeFileSync(resolve(clientDir, `${route.routePath}.html`), html)

      // The bare page path client-redirects to /overview — same document
      if (route.basePath) {
        const baseDir = resolve(clientDir, route.basePath)
        mkdirSync(baseDir, { recursive: true })
        writeFileSync(resolve(baseDir, 'index.html'), html)
        writeFileSync(resolve(clientDir, `${route.basePath}.html`), html)
      }

      rendered++
      if (rendered % 50 === 0) {
        console.log(`\x1b[36m[docsector]\x1b[0m SSR prerender: ${rendered}/${routes.length} routes`)
      }
    } catch (error) {
      failed++
      console.warn(`\x1b[33m[docsector]\x1b[0m SSR prerender failed for /${route.routePath}: ${error?.message || error}`)
    }
  }

  // @ Homepage
  try {
    const html = await render('/')
    writeFileSync(resolve(clientDir, 'index.html'), html)
    rendered++
  } catch (error) {
    failed++
    console.warn(`\x1b[33m[docsector]\x1b[0m SSR prerender failed for /: ${error?.message || error}`)
  }

  // @ Internal-link pages: a static redirect keeps deep links working without
  //   shipping an app shell (the SPA used to client-redirect these)
  for (const linkRoute of linkRoutes) {
    const escaped = linkRoute.target.replace(/"/g, '&quot;')
    const redirectHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${escaped}"><link rel="canonical" href="${escaped}"><meta name="robots" content="noindex"><title>Redirecting…</title></head><body><a href="${escaped}">Continue</a></body></html>\n`

    const dir = resolve(clientDir, linkRoute.routePath)
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, 'index.html'), redirectHtml)
    writeFileSync(resolve(clientDir, `${linkRoute.routePath}.html`), redirectHtml)
  }

  console.log(`\x1b[36m[docsector]\x1b[0m SSR prerender: ${rendered} routes rendered (${failed} failed, ${linkRoutes.length} link redirects)`)

  // @ Early Hints: the critical wave is identical for every route — lift it
  //   from the first rendered head and expose it as per-book Link rules.
  //   Stylesheets only: hinting JS/fonts would refill the pipe the
  //   modulepreload strip just cleared for the render-blocking CSS
  if (config.linkHeaders?.earlyHints !== false && firstHtml !== null) {
    const head = firstHtml.slice(0, firstHtml.indexOf('</head>'))
    const targets = []
    // ? the bundler emits minified (quote-less) attributes, the SSR preloads
    //   emit quoted ones — match both
    const linkPattern = /<link rel="?stylesheet"?[^>]*href="?([^">\s]+)"?[^>]*>/g

    let match
    while ((match = linkPattern.exec(head)) !== null) {
      targets.push(`<${match[1]}>; rel=preload; as=style`)
    }

    if (targets.length > 0) {
      const link = targets.join(', ')
      const bookRoots = [...new Set(routes.map((route) => route.routePath.split('/')[0]))].sort()
      const paths = bookRoots.map((root) => `/${root}/*`).concat(['/', '/index.html'])

      // ? Cloudflare Pages lets the LAST rule matching a path own a header
      //   name — appending a second "/" block here would clobber the
      //   homepage's agent-discovery Link headers (api-catalog, service-doc,
      //   ...). Merge into the existing path block instead.
      const headersPath = resolve(clientDir, '_headers')
      const blocks = []
      const byPath = new Map()
      if (existsSync(headersPath)) {
        for (const chunk of readFileSync(headersPath, 'utf-8').split(/\n{2,}/)) {
          const trimmed = chunk.trimEnd()
          if (trimmed === '') continue

          const [pathLine, ...headerLines] = trimmed.split('\n')
          const block = { path: pathLine.trim(), lines: headerLines }
          blocks.push(block)
          byPath.set(block.path, block)
        }
      }

      const push = (path, lines) => {
        const existing = byPath.get(path)
        if (existing !== undefined) {
          existing.lines.push(...lines)
          return
        }

        const block = { path, lines: [...lines] }
        blocks.push(block)
        byPath.set(path, block)
      }

      // ! must-revalidate on the documents: after a redeploy a cached HTML
      //   would reference hashed chunks that no longer exist (dead first
      //   paint); the hashed assets themselves are immutable forever
      for (const path of paths) {
        push(path, [`  Link: ${link}`, '  Cache-Control: public, max-age=0, must-revalidate'])
      }
      push('/assets/*', ['  Cache-Control: public, max-age=31536000, immutable'])

      writeFileSync(headersPath, blocks.map((block) => `${block.path}\n${block.lines.join('\n')}`).join('\n\n') + '\n')
      console.log(`\x1b[36m[docsector]\x1b[0m Added Early Hints Link + cache rules for ${paths.length} path patterns`)
    }
  }

  // : Deployable output goes back to dist/spa — static hosts keep their
  //   configured output directory; the Node server pieces are build-only
  const spaDir = resolve(projectRoot, 'dist', 'spa')
  rmSync(spaDir, { recursive: true, force: true })
  renameSync(clientDir, spaDir)
  rmSync(ssrDir, { recursive: true, force: true })
  console.log('\x1b[36m[docsector]\x1b[0m SSR client bundle moved to dist/spa (deploy-ready)')

  return { rendered, failed }
}
