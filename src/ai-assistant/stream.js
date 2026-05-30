export function parseServerSentEvents (input = '') {
  const events = []
  const blocks = String(input).split(/\r?\n\r?\n/)

  for (const block of blocks) {
    if (!block.trim()) continue

    let event = 'message'
    const data = []

    for (const line of block.split(/\r?\n/)) {
      if (!line || line.startsWith(':')) continue

      if (line.startsWith('event:')) {
        event = line.slice(6).trim() || 'message'
      } else if (line.startsWith('data:')) {
        data.push(line.slice(5).trimStart())
      }
    }

    if (data.length > 0) {
      events.push({ event, data: data.join('\n') })
    }
  }

  return events
}

function titleCaseSegment (segment = '') {
  return String(segment || '')
    .replace(/\.md$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\p{L}/gu, letter => letter.toUpperCase())
}

function buildAssistantSourceDisplay (key = '') {
  const rawKey = String(key || '').trim()
  if (!rawKey) {
    return { title: '', meta: '' }
  }

  try {
    const url = new URL(rawKey)
    const segments = url.pathname
      .split('/')
      .filter(Boolean)
      .map(segment => titleCaseSegment(decodeURIComponent(segment)))
      .filter(Boolean)

    const title = segments.length === 0
      ? 'Home'
      : segments.slice(-2).join(' / ')

    const metaPath = decodeURIComponent(url.pathname || '/').replace(/\.md$/i, '')
    const meta = `${url.host}${metaPath}${url.search}`

    return { title, meta }
  } catch {
    const cleanPath = decodeURIComponent(rawKey.replace(/^\/+/, '').replace(/\.md$/i, ''))
    const segments = cleanPath
      .split('/')
      .filter(Boolean)
      .map(segment => titleCaseSegment(segment))
      .filter(Boolean)

    return {
      title: segments.length === 0 ? 'Home' : segments.slice(-2).join(' / '),
      meta: cleanPath || '/'
    }
  }
}

function normalizeAssistantSourcePath (path = '') {
  const normalized = String(path || '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/+$/g, '')
    .replace(/\.md$/i, '')

  return normalized || '/'
}

export function normalizeAssistantSourceLinkKey (key = '') {
  const rawKey = String(key || '').trim()
  if (!rawKey) return ''

  try {
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(rawKey)) {
      const url = new URL(rawKey, 'https://docsector.local')
      return [
        url.protocol.toLowerCase(),
        '//',
        url.host.toLowerCase(),
        normalizeAssistantSourcePath(decodeURIComponent(url.pathname || '/')),
        url.search
      ].join('')
    }
  } catch {
    // Fall through to relative-path normalization for malformed URLs.
  }

  const hashless = rawKey.split('#')[0]
  const queryIndex = hashless.indexOf('?')
  const rawPath = queryIndex === -1 ? hashless : hashless.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : hashless.slice(queryIndex)
  const normalizedPath = normalizeAssistantSourcePath(rawPath).replace(/^\/+/, '') || '/'

  return `${normalizedPath}${search}`
}

export function dedupeAssistantSources (sources = []) {
  const byLink = new Map()

  for (const source of Array.isArray(sources) ? sources : []) {
    const dedupeKey = normalizeAssistantSourceLinkKey(source?.key) || `text:${String(source?.text || '').trim()}`
    if (!dedupeKey || dedupeKey === 'text:') continue

    const previous = byLink.get(dedupeKey)
    if (!previous) {
      byLink.set(dedupeKey, source)
      continue
    }

    byLink.set(dedupeKey, {
      ...previous,
      text: previous.text || source.text || '',
      score: Math.max(Number(previous.score || 0), Number(source.score || 0))
    })
  }

  return Array.from(byLink.values())
}

export function extractAssistantStreamDelta (event) {
  if (!event || event.data === '[DONE]') {
    return { done: true, content: '', chunks: [] }
  }

  let payload = null
  try {
    payload = JSON.parse(event.data)
  } catch {
    return { done: false, content: event.data || '', chunks: [] }
  }

  if (event.event === 'chunks') {
    return {
      done: false,
      content: '',
      chunks: normalizeAssistantSourceChunks(payload)
    }
  }

  const content = payload?.choices?.[0]?.delta?.content
    || payload?.choices?.[0]?.message?.content
    || payload?.response
    || ''

  return {
    done: false,
    content: typeof content === 'string' ? content : '',
    chunks: normalizeAssistantSourceChunks(payload?.chunks)
  }
}

export function normalizeAssistantSourceChunks (chunks = []) {
  const sources = (Array.isArray(chunks) ? chunks : [])
    .map((chunk, index) => {
      const key = chunk?.item?.key || chunk?.key || chunk?.url || ''
      const score = Number(chunk?.score ?? chunk?.scoring_details?.vector_score ?? 0)
      const text = typeof chunk?.text === 'string' ? chunk.text.trim() : ''
      const display = buildAssistantSourceDisplay(key)
      const title = chunk?.item?.metadata?.title || chunk?.metadata?.title || display.title

      return {
        id: String(chunk?.id || key || `source-${index + 1}`),
        key: String(key || ''),
        title: String(title || `Source ${index + 1}`),
        meta: String(display.meta || ''),
        text,
        score: Number.isFinite(score) ? score : 0
      }
    })
    .filter(chunk => chunk.key || chunk.text)

  return dedupeAssistantSources(sources)
}
