function escapeXml (value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizeBaseUrl (siteUrl) {
  return String(siteUrl || '').replace(/\/+$/g, '')
}

function normalizeLocalUrl (value) {
  const path = String(value || '').trim()
  if (!path || path === '/') return '/'
  if (/^https?:\/\//i.test(path)) return path
  return `/${path.replace(/^\/+/, '')}`
}

function resolveSitemapUrl (path, siteUrl) {
  const localUrl = normalizeLocalUrl(path)
  if (/^https?:\/\//i.test(localUrl)) return localUrl

  const baseUrl = normalizeBaseUrl(siteUrl)
  return baseUrl ? `${baseUrl}${localUrl}` : localUrl
}

function normalizeSitemapIdentity (value) {
  const normalized = normalizeLocalUrl(String(value || '').trim())
  if (!/^https?:\/\//i.test(normalized)) return normalized.toLowerCase()

  try {
    const url = new URL(normalized)
    return `${url.pathname}${url.search}`.toLowerCase()
  } catch {
    return normalized.toLowerCase()
  }
}

function normalizeSitemapEntry (entry) {
  if (typeof entry === 'string') return { path: entry }
  return entry && typeof entry === 'object' ? entry : null
}

export function createSitemap ({ entries = [], siteUrl = '', generatedAt = new Date().toISOString() } = {}) {
  const lastmod = String(generatedAt || new Date().toISOString()).slice(0, 10)
  const urls = (Array.isArray(entries) ? entries : [])
    .map(normalizeSitemapEntry)
    .filter(entry => entry?.path)
    .map(entry => {
      const lines = [
        '  <url>',
        `    <loc>${escapeXml(resolveSitemapUrl(entry.path, siteUrl))}</loc>`,
        `    <lastmod>${escapeXml(entry.lastmod || lastmod)}</lastmod>`
      ]

      if (entry.changefreq) {
        lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`)
      }

      if (entry.priority !== undefined && entry.priority !== null) {
        lines.push(`    <priority>${escapeXml(entry.priority)}</priority>`)
      }

      lines.push('  </url>')
      return lines.join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls ? `${urls}\n` : ''}</urlset>\n`
}

export function appendSitemapsToRobots (robotsContent, { sitemaps = [], siteUrl = '' } = {}) {
  const input = typeof robotsContent === 'string' && robotsContent.trim()
    ? robotsContent
    : 'User-agent: *\nAllow: /\n'

  const existingIdentities = new Set(
    input
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.match(/^\s*Sitemap\s*:\s*(.+?)\s*$/i)?.[1])
      .filter(Boolean)
      .map(normalizeSitemapIdentity)
  )

  const addedIdentities = new Set()
  const sitemapLines = (Array.isArray(sitemaps) ? sitemaps : [sitemaps])
    .filter(Boolean)
    .map(sitemap => resolveSitemapUrl(sitemap, siteUrl))
    .filter(sitemap => {
      const identity = normalizeSitemapIdentity(sitemap)
      if (existingIdentities.has(identity) || addedIdentities.has(identity)) return false
      addedIdentities.add(identity)
      return true
    })
    .map(sitemap => `Sitemap: ${sitemap}`)

  if (sitemapLines.length === 0) return input

  return `${input.replace(/\s+$/g, '')}\n${sitemapLines.join('\n')}\n`
}