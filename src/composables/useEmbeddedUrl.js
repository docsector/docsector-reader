const DEFAULT_EMBED = {
  mode: 'link',
  provider: 'link',
  kind: 'link',
  icon: 'link',
  title: '',
  providerLabel: '',
  canonicalUrl: '',
  displayUrl: '',
  embedSrc: '',
  aspectRatio: '',
  frameHeight: 0,
  allow: '',
  allowFullscreen: false
}

const YOUTUBE_HOSTS = new Set([
  'youtu.be',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com'
])

const VIMEO_HOSTS = new Set([
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com'
])

const SPOTIFY_HOSTS = new Set([
  'spotify.com',
  'www.spotify.com',
  'open.spotify.com'
])

const CODEPEN_HOSTS = new Set([
  'codepen.io',
  'www.codepen.io'
])

const SPOTIFY_PROVIDER_BY_KIND = {
  track: {
    kind: 'audio',
    icon: 'music_note',
    title: 'Spotify track',
    frameHeight: 152
  },
  episode: {
    kind: 'audio',
    icon: 'podcasts',
    title: 'Spotify episode',
    frameHeight: 232
  },
  artist: {
    kind: 'music',
    icon: 'person',
    title: 'Spotify artist',
    frameHeight: 352
  },
  album: {
    kind: 'music',
    icon: 'album',
    title: 'Spotify album',
    frameHeight: 352
  },
  playlist: {
    kind: 'music',
    icon: 'queue_music',
    title: 'Spotify playlist',
    frameHeight: 352
  },
  show: {
    kind: 'podcast',
    icon: 'radio',
    title: 'Spotify show',
    frameHeight: 352
  }
}

const createFallbackResult = (rawUrl = '', title = '') => {
  const trimmed = String(rawUrl || '').trim()
  const normalized = parseHttpUrl(trimmed)

  return {
    ...DEFAULT_EMBED,
    title: title || normalized?.hostname || trimmed,
    providerLabel: normalized?.hostname || '',
    canonicalUrl: normalized?.toString() || trimmed,
    displayUrl: normalized?.toString() || trimmed
  }
}

const parseHttpUrl = (rawUrl = '') => {
  const trimmed = String(rawUrl || '').trim()

  if (!trimmed) {
    return null
  }

  try {
    const url = new URL(trimmed)

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null
    }

    return url
  } catch {
    return null
  }
}

const mergeSearchParams = (url, options = {}) => {
  const params = new URLSearchParams(url.search)

  ;(options.remove || []).forEach((key) => {
    params.delete(key)
  })

  Object.entries(options.set || {}).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      params.delete(key)
      return
    }

    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `?${query}` : ''
}

const parseTimeToSeconds = (value = '') => {
  const trimmed = String(value || '').trim()

  if (!trimmed) {
    return ''
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }

  const match = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i)
  if (!match) {
    return ''
  }

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  const total = (hours * 3600) + (minutes * 60) + seconds

  return total > 0 ? String(total) : ''
}

const resolveYouTubeVideoId = (url) => {
  const segments = url.pathname.split('/').filter(Boolean)

  if (url.hostname === 'youtu.be') {
    return segments[0] || ''
  }

  if (segments[0] === 'watch') {
    return url.searchParams.get('v') || ''
  }

  if (['embed', 'shorts', 'live', 'v'].includes(segments[0])) {
    return segments[1] || ''
  }

  return url.searchParams.get('v') || ''
}

const resolveYouTubeEmbed = (url, title = '') => {
  const videoId = resolveYouTubeVideoId(url)

  if (!videoId) {
    return null
  }

  const start = parseTimeToSeconds(url.searchParams.get('t'))
  const query = mergeSearchParams(url, {
    remove: ['v', 't'],
    set: {
      ...(start ? { start } : {}),
      ...((url.searchParams.get('loop') === '1' || url.searchParams.get('loop') === 'true') && !url.searchParams.get('playlist')
        ? { playlist: videoId }
        : {})
    }
  })

  return {
    ...DEFAULT_EMBED,
    mode: 'embed',
    provider: 'youtube',
    kind: 'video',
    icon: 'smart_display',
    title: title || 'YouTube video',
    providerLabel: 'YouTube',
    canonicalUrl: url.toString(),
    displayUrl: url.toString(),
    embedSrc: `https://www.youtube.com/embed/${videoId}${query}`,
    aspectRatio: '16 / 9',
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    allowFullscreen: true
  }
}

const resolveVimeoVideoId = (url) => {
  const segments = url.pathname.split('/').filter(Boolean)

  if (segments[0] === 'video') {
    return segments[1] || ''
  }

  return segments.find((segment) => /^\d+$/.test(segment)) || ''
}

const resolveVimeoEmbed = (url, title = '') => {
  const videoId = resolveVimeoVideoId(url)

  if (!videoId) {
    return null
  }

  return {
    ...DEFAULT_EMBED,
    mode: 'embed',
    provider: 'vimeo',
    kind: 'video',
    icon: 'movie',
    title: title || 'Vimeo video',
    providerLabel: 'Vimeo',
    canonicalUrl: url.toString(),
    displayUrl: url.toString(),
    embedSrc: `https://player.vimeo.com/video/${videoId}${mergeSearchParams(url)}`,
    aspectRatio: '16 / 9',
    allow: 'autoplay; fullscreen; picture-in-picture',
    allowFullscreen: true
  }
}

const resolveSpotifyParts = (url) => {
  const segments = url.pathname.split('/').filter(Boolean)
  const embedIndex = segments[0] === 'embed' ? 1 : 0
  const type = segments[embedIndex] || ''
  const id = segments[embedIndex + 1] || ''

  if (!SPOTIFY_PROVIDER_BY_KIND[type] || !id) {
    return null
  }

  return { type, id }
}

const resolveSpotifyEmbed = (url, title = '') => {
  const parts = resolveSpotifyParts(url)

  if (parts === null) {
    return null
  }

  const definition = SPOTIFY_PROVIDER_BY_KIND[parts.type]

  return {
    ...DEFAULT_EMBED,
    mode: 'embed',
    provider: 'spotify',
    kind: definition.kind,
    icon: definition.icon,
    title: title || definition.title,
    providerLabel: 'Spotify',
    canonicalUrl: url.toString(),
    displayUrl: url.toString(),
    embedSrc: `https://open.spotify.com/embed/${parts.type}/${parts.id}${mergeSearchParams(url)}`,
    aspectRatio: '',
    frameHeight: definition.frameHeight,
    allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
    allowFullscreen: false
  }
}

const resolveCodePenParts = (url) => {
  const segments = url.pathname.split('/').filter(Boolean)

  if (segments[0] === 'team') {
    const team = segments[1] || ''
    const penType = segments[2] || ''
    const penId = segments[3] || ''

    if (!team || !penId || !['pen', 'full', 'details', 'embed', 'debug'].includes(penType)) {
      return null
    }

    return {
      user: `team/${team}`,
      penId
    }
  }

  const user = segments[0] || ''
  const penType = segments[1] || ''
  const penId = segments[2] || ''

  if (!user || !penId || !['pen', 'full', 'details', 'embed', 'debug'].includes(penType)) {
    return null
  }

  return { user, penId }
}

const resolveCodePenEmbed = (url, title = '') => {
  const parts = resolveCodePenParts(url)

  if (parts === null) {
    return null
  }

  return {
    ...DEFAULT_EMBED,
    mode: 'embed',
    provider: 'codepen',
    kind: 'code',
    icon: 'code',
    title: title || 'CodePen embed',
    providerLabel: 'CodePen',
    canonicalUrl: url.toString(),
    displayUrl: url.toString(),
    embedSrc: `https://codepen.io/${parts.user}/embed/${parts.penId}${mergeSearchParams(url)}`,
    aspectRatio: '16 / 9',
    allow: 'accelerometer; camera; clipboard-write; display-capture; encrypted-media; geolocation; gyroscope; microphone; midi; web-share',
    allowFullscreen: true
  }
}

export const resolveEmbeddedUrl = (rawUrl = '', options = {}) => {
  const title = String(options.title || '').trim()
  const normalized = parseHttpUrl(rawUrl)

  if (normalized === null) {
    return createFallbackResult(rawUrl, title)
  }

  if (YOUTUBE_HOSTS.has(normalized.hostname)) {
    return resolveYouTubeEmbed(normalized, title) || createFallbackResult(rawUrl, title)
  }

  if (VIMEO_HOSTS.has(normalized.hostname)) {
    return resolveVimeoEmbed(normalized, title) || createFallbackResult(rawUrl, title)
  }

  if (SPOTIFY_HOSTS.has(normalized.hostname)) {
    return resolveSpotifyEmbed(normalized, title) || createFallbackResult(rawUrl, title)
  }

  if (CODEPEN_HOSTS.has(normalized.hostname)) {
    return resolveCodePenEmbed(normalized, title) || createFallbackResult(rawUrl, title)
  }

  return createFallbackResult(rawUrl, title)
}