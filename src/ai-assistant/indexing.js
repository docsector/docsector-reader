function escapeXml (value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function createAiSearchIndexArtifacts ({ siteUrl = '', entries = [], generatedAt = new Date().toISOString() } = {}) {
  const baseUrl = String(siteUrl || '').replace(/\/+$/g, '')

  const pages = (Array.isArray(entries) ? entries : [])
    .filter(entry => entry && entry.path && entry.markdownPath)
    .map(entry => {
      const markdownPath = String(entry.markdownPath).replace(/^\/+/, '')
      const routePath = String(entry.path).replace(/^\/+/, '')
      const markdownUrl = baseUrl ? `${baseUrl}/${markdownPath}` : `/${markdownPath}`
      const url = baseUrl ? `${baseUrl}/${routePath}` : `/${routePath}`
      return {
        title: entry.title || routePath,
        path: routePath,
        markdownUrl,
        url,
        locale: entry.locale || '',
        book: entry.book || '',
        version: entry.version || '',
        subpage: entry.subpage || ''
      }
    })

  const sitemapUrls = pages.map(page => [
    '  <url>',
    `    <loc>${escapeXml(page.markdownUrl)}</loc>`,
    `    <lastmod>${escapeXml(generatedAt.slice(0, 10))}</lastmod>`,
    '  </url>'
  ].join('\n')).join('\n')

  const sitemap = pages.length > 0
    ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`
    : ''

  return {
    manifest: {
      generatedAt,
      pages
    },
    sitemap
  }
}
