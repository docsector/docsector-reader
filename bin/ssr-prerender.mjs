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

// ? A neutral desktop UA: Quasar Platform only uses it for body classes, which
//   live outside the Vue app and are re-synced by the client on boot
const PRERENDER_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 DocsectorPrerender'

const jsRE = /\.js$/
const cssRE = /\.css$/
const woffRE = /\.woff$/
const woff2RE = /\.woff2$/

// : Mirrors src-ssr/server.js renderPreloadTag (that module needs the Vite
//   `#q-app` alias and cannot be imported under plain Node)
function preloadTag (file) {
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

  return ''
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

    return renderTemplate(ssrContext)
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
  //   from the first rendered head and expose it as per-book Link rules
  if (config.linkHeaders?.earlyHints !== false && firstHtml !== null) {
    const head = firstHtml.slice(0, firstHtml.indexOf('</head>'))
    const targets = []
    const linkPattern = /<link rel="(modulepreload|stylesheet)"[^>]*href="([^"]+)"[^>]*>/g

    let match
    while ((match = linkPattern.exec(head)) !== null) {
      targets.push(match[1] === 'stylesheet'
        ? `<${match[2]}>; rel=preload; as=style`
        : `<${match[2]}>; rel=modulepreload; crossorigin`)
    }

    if (targets.length > 0) {
      const link = targets.join(', ')
      const bookRoots = [...new Set(routes.map((route) => route.routePath.split('/')[0]))].sort()
      const paths = bookRoots.map((root) => `/${root}/*`).concat(['/', '/index.html'])
      const rules = paths.map((path) => `${path}\n  Link: ${link}`).join('\n\n') + '\n'

      const headersPath = resolve(clientDir, '_headers')
      const currentHeaders = existsSync(headersPath)
        ? readFileSync(headersPath, 'utf-8').trimEnd() + '\n\n'
        : ''

      writeFileSync(headersPath, currentHeaders + rules)
      console.log(`\x1b[36m[docsector]\x1b[0m Added Early Hints Link rules for ${paths.length} path patterns`)
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
