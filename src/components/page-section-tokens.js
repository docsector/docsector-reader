import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import GithubSlugger from 'github-slugger'
import katex from 'katex'
import texmath from 'markdown-it-texmath'

const ALERT_MESSAGE_TYPES = new Set([
  'note',
  'tip',
  'important',
  'warning',
  'caution'
])

const QUICK_LINKS_MARKER_PREFIX = '@@DOCSECTOR_QUICK_LINKS_'
const EXPANDABLE_MARKER_PREFIX = '@@DOCSECTOR_EXPANDABLE_'
const CODE_SEGMENT_MARKER_PREFIX = '@@DOCSECTOR_CODE_SEGMENT_'
const MATH_KATEX_OPTIONS = {
  throwOnError: false,
  strict: 'ignore'
}

const parseAlertMarker = (rawContent = '') => {
  const match = String(rawContent).trim().match(/^\[!\s*([A-Za-z]+)\s*\]\s*(.*)$/s)
  if (!match) {
    return null
  }

  const type = match[1].toLowerCase()
  if (!ALERT_MESSAGE_TYPES.has(type)) {
    return null
  }

  return {
    type,
    content: (match[2] || '').trim()
  }
}

export const parseCustomTagAttributes = (raw = '') => {
  const parsed = {}
  const pattern = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g

  let match = pattern.exec(String(raw))
  while (match !== null) {
    const key = match[1]
    const value = match[2] || match[3] || match[4] || ''
    parsed[key] = value
    match = pattern.exec(String(raw))
  }

  return parsed
}

const shieldInlineCodeSegments = (line = '', createMarker, codeSegmentsMap) => {
  return String(line).replace(/(`+)([^`\n]*?)\1/g, (match) => {
    const marker = createMarker()
    codeSegmentsMap.set(marker, match)
    return marker
  })
}

const shieldMarkdownCodeSegments = (source = '') => {
  const codeSegmentsMap = new Map()
  const output = []
  const lines = String(source).split(/\r?\n/)
  let index = 0

  const createMarker = () => `${CODE_SEGMENT_MARKER_PREFIX}${index++}@@`

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    const fenceMatch = line.match(/^( {0,3})(`{3,}|~{3,})(.*)$/)

    if (fenceMatch) {
      const fenceToken = fenceMatch[2]
      const fenceChar = fenceToken[0]
      const closingPattern = new RegExp(`^( {0,3})${fenceChar}{${fenceToken.length},}\\s*$`)
      const blockLines = [line]

      while (lineIndex + 1 < lines.length) {
        lineIndex++
        const nextLine = lines[lineIndex]
        blockLines.push(nextLine)

        if (closingPattern.test(nextLine)) {
          break
        }
      }

      const marker = createMarker()
      codeSegmentsMap.set(marker, blockLines.join('\n'))
      output.push(marker)
      continue
    }

    output.push(shieldInlineCodeSegments(line, createMarker, codeSegmentsMap))
  }

  return {
    source: output.join('\n'),
    codeSegmentsMap
  }
}

const restoreShieldedCodeSegments = (source = '', codeSegmentsMap = new Map()) => {
  let restored = String(source)

  codeSegmentsMap.forEach((content, marker) => {
    restored = restored.replaceAll(marker, () => content)
  })

  return restored
}

const extractQuickLinksBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const blockPattern = /<d-quick-links\b([^>]*)>([\s\S]*?)<\/d-quick-links>/gi
  const replaced = String(source).replace(blockPattern, (_, blockAttrsRaw, inner) => {
    const blockAttrs = parseCustomTagAttributes(blockAttrsRaw)
    const items = []
    const itemPattern = /<d-quick-link\b([^>]*)\/?\s*>/gi

    let itemMatch = itemPattern.exec(inner)
    while (itemMatch !== null) {
      const itemAttrs = parseCustomTagAttributes(itemMatch[1])
      const title = itemAttrs.title || ''
      const description = itemAttrs.description || ''
      const to = itemAttrs.to || ''
      const href = itemAttrs.href || ''

      if (title && description && (to || href)) {
        items.push({
          icon: itemAttrs.icon || 'link',
          title,
          description,
          to,
          href
        })
      }

      itemMatch = itemPattern.exec(inner)
    }

    const marker = `${QUICK_LINKS_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      title: blockAttrs.title || '',
      items
    })

    return `\n${marker}\n`
  })

  return {
    source: replaced,
    quickLinksMap: map
  }
}

const parseExpandableOpenState = (raw = '') => {
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase())
}

const extractExpandableBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const blockPattern = /<d-expandable\b([^>]*)>([\s\S]*?)<\/d-expandable>/gi
  const replaced = String(source).replace(blockPattern, (_, rawAttrs, inner) => {
    const attrs = parseCustomTagAttributes(rawAttrs)
    const marker = `${EXPANDABLE_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      title: attrs.title || '',
      open: parseExpandableOpenState(attrs.open),
      content: inner
    })

    return `\n${marker}\n`
  })

  return {
    source: replaced,
    expandableMap: map
  }
}

const parseFenceAttributes = (raw = '') => {
  const parsed = {}
  const pattern = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s;]+))/g

  let match = pattern.exec(String(raw))
  while (match !== null) {
    const key = match[1]
    const value = match[2] || match[3] || match[4] || ''
    parsed[key] = value
    match = pattern.exec(String(raw))
  }

  return parsed
}

const parseTokenAttributes = (element) => {
  const parsed = {}

  ;(element.attrs || []).forEach(([key, value]) => {
    parsed[key] = value || ''
  })

  return parsed
}

const decodeHtmlEntities = (value = '') => {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const extractTagAttributes = (html = '', tagName = '') => {
  const match = String(html).match(new RegExp(`<${tagName}\\b([^>]*)\\/?>(?![\\s\\S]*<${tagName}\\b)`, 'i'))

  if (!match) {
    return {}
  }

  return parseCustomTagAttributes(match[1])
}

const createImageTokenData = (mediaHtml = '', options = {}) => {
  const {
    captionHtml = '',
    fallbackCaptionFromAlt = false
  } = options
  const attrs = extractTagAttributes(mediaHtml, 'img')
  const alt = decodeHtmlEntities(attrs.alt || '')
  const title = decodeHtmlEntities(attrs.title || '')

  return {
    tag: 'image',
    content: String(mediaHtml).trim(),
    alt,
    title,
    captionHtml: captionHtml !== ''
      ? captionHtml
      : (fallbackCaptionFromAlt ? escapeHtml(alt) : '')
  }
}

const parseStandaloneImageToken = (content = '') => {
  const trimmed = String(content).trim()

  if (!trimmed.match(/^<img\b[^>]*\/?>(?:\s*)$/i)) {
    return null
  }

  return createImageTokenData(trimmed, {
    fallbackCaptionFromAlt: true
  })
}

const parseFigureImageToken = (content = '') => {
  const trimmed = String(content).trim()

  if (!trimmed.match(/^<figure\b[\s\S]*<\/figure>$/i)) {
    return null
  }

  const figureBody = trimmed
    .replace(/^<figure\b[^>]*>/i, '')
    .replace(/<\/figure>$/i, '')
    .trim()
  const figcaptionMatch = figureBody.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)
  const mediaBody = figcaptionMatch
    ? figureBody.replace(figcaptionMatch[0], '').trim()
    : figureBody
  const pictureMatch = mediaBody.match(/^<picture\b[\s\S]*?<\/picture>$/i)
  const imgMatch = pictureMatch
    ? pictureMatch[0].match(/<img\b[^>]*\/?>/i)
    : mediaBody.match(/^<img\b[^>]*\/?>$/i)

  if (!imgMatch) {
    return null
  }

  const mediaHtml = pictureMatch ? pictureMatch[0] : imgMatch[0]

  return createImageTokenData(mediaHtml, {
    captionHtml: figcaptionMatch ? figcaptionMatch[1].trim() : ''
  })
}

const parseFenceLanguage = (raw = '') => {
  const cleaned = String(raw)
    .replace(/:[^;]*;/g, ' ')
    .replace(/[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s;]+)/g, ' ')
    .replace(/[;:]/g, ' ')
    .trim()

  return cleaned.split(/\s+/)[0] || ''
}

const parseFenceMeta = (element) => {
  const rawInfo = String(element.info || '')
  const meta = {
    ...parseFenceAttributes(rawInfo),
    ...parseTokenAttributes(element)
  }

  return {
    ...meta,
    language: parseFenceLanguage(rawInfo) || meta.language || 'html'
  }
}

const parseBreadcrumb = (raw = '') => {
  const value = String(raw).trim()

  if (!value) {
    return []
  }

  const separator = value.includes('>') ? '>' : '/'

  return value
    .split(separator)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

const createSourceCodeTab = (element, meta) => ({
  label: meta.tab || meta.filename || meta.language || 'Code',
  language: meta.language || 'html',
  text: element.content,
  filename: meta.filename || '',
  breadcrumbs: parseBreadcrumb(meta.breadcrumb)
})

const pushSourceCodeToken = (tokens, element, parserState) => {
  const meta = parseFenceMeta(element)

  if (meta.language === 'mermaid') {
    tokens.push({
      tag: 'mermaid',
      content: element.content
    })
    return
  }

  const tab = createSourceCodeTab(element, meta)

  if (meta.group) {
    const previous = tokens[tokens.length - 1]

    if (previous?.tag === 'code' && previous.group === meta.group && Array.isArray(previous.tabs)) {
      previous.tabs.push(tab)
      return
    }

    tokens.push({
      tag: 'code',
      codeIndex: parserState.codeIndex++,
      group: meta.group,
      content: tab.text,
      info: tab.language,
      filename: tab.filename,
      breadcrumbs: tab.breadcrumbs,
      tabs: [tab]
    })
    return
  }

  tokens.push({
    tag: 'code',
    codeIndex: parserState.codeIndex++,
    content: tab.text,
    info: tab.language,
    filename: tab.filename,
    breadcrumbs: tab.breadcrumbs,
    tabs: []
  })
}

const installMathSupport = (markdown) => {
  markdown.use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: MATH_KATEX_OPTIONS
  })

  return markdown
}

const renderBlockToken = (markdown, element, env) => {
  return markdown.renderer.render([element], markdown.options, env).trim()
}

const createMarkdownBlockParser = () => {
  const markdown = installMathSupport(new MarkdownIt({
    html: true
  }))

  markdown.use(attrs, {
    leftDelimiter: ':',
    rightDelimiter: ';',
    allowedAttributes: ['filename', 'group', 'tab', 'breadcrumb']
  })

  return markdown
}

const createMarkdownInlineParser = () => {
  return installMathSupport(new MarkdownIt({
    html: true
  }))
}

const normalizePageSectionSource = (source = '') => {
  return String(source)
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&amp;/g, '&')
}

const createParserState = () => ({
  codeIndex: 0,
  headingSlugger: new GithubSlugger()
})

const getHeadingAnchorId = (markdown, currentTag, element, env, parserState) => {
  if (!currentTag || !currentTag.match(/^h[2-6]$/)) {
    return ''
  }

  const headingText = markdown.renderer.renderInlineAsText(element.children || [], markdown.options, env).trim()
  return parserState.headingSlugger.slug(headingText)
}

export const tokenizePageSectionSource = (source = '', options = {}) => {
  const {
    allowHeadingTokens = true,
    parserState = createParserState()
  } = options
  const normalizedSource = normalizePageSectionSource(source)
  const { source: sourceWithShieldedCode, codeSegmentsMap } = shieldMarkdownCodeSegments(normalizedSource)
  const { source: sourceWithExpandables, expandableMap } = extractExpandableBlocks(sourceWithShieldedCode)

  expandableMap.forEach((data, marker) => {
    expandableMap.set(marker, {
      ...data,
      content: restoreShieldedCodeSegments(data.content, codeSegmentsMap)
    })
  })

  const { source: sourceWithQuickLinks, quickLinksMap } = extractQuickLinksBlocks(sourceWithExpandables)
  const markdown = createMarkdownBlockParser()
  const markdownInline = createMarkdownInlineParser()
  const markdownEnv = {}
  const parsed = markdown.parse(restoreShieldedCodeSegments(sourceWithQuickLinks, codeSegmentsMap), markdownEnv)
  const tokens = []

  let level = 0
  let tag = ''

  const blockquote = {
    depth: 0,
    content: '',
    alertType: '',
    firstInline: true
  }

  const resetBlockquote = () => {
    blockquote.content = ''
    blockquote.alertType = ''
    blockquote.firstInline = true
  }

  const flushBlockquote = () => {
    const content = blockquote.content
      .replace(/<p>\s*<\/p>/g, '')
      .trim()

    tokens.push({
      tag: 'blockquote',
      content,
      alertType: blockquote.alertType
    })

    resetBlockquote()
  }

  const appendBlockquoteTag = (element, open) => {
    if (!element.tag || element.tag === 'blockquote') {
      return
    }

    blockquote.content += open
      ? `<${element.tag}>`
      : `</${element.tag}>`
  }

  parsed.forEach((element) => {
    if (element.type === 'blockquote_open') {
      if (blockquote.depth === 0) {
        resetBlockquote()
      }

      blockquote.depth++
      return
    }

    if (element.type === 'blockquote_close' && blockquote.depth > 0) {
      blockquote.depth--

      if (blockquote.depth === 0) {
        flushBlockquote()
      }

      return
    }

    if (blockquote.depth > 0) {
      if (element.type === 'inline') {
        const rawInline = element.content

        if (blockquote.firstInline) {
          blockquote.firstInline = false

          const alert = parseAlertMarker(rawInline)
          if (alert !== null) {
            blockquote.alertType = alert.type

            if (alert.content !== '') {
              blockquote.content += markdownInline.renderInline(alert.content, markdownEnv)
            }

            return
          }
        }

        blockquote.content += markdownInline.renderInline(rawInline, markdownEnv)
        return
      }

      if (element.type === 'fence') {
        const language = parseFenceLanguage(element.info)
        const escaped = String(element.content)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')

        const languageClass = language ? ` class="language-${language}"` : ''
        blockquote.content += `<pre><code${languageClass}>${escaped}</code></pre>`
        return
      }

      if (element.type === 'math_block') {
        blockquote.content += renderBlockToken(markdown, element, markdownEnv)
        return
      }

      if (element.type.endsWith('_open')) {
        appendBlockquoteTag(element, true)
        return
      }

      if (element.type.endsWith('_close')) {
        appendBlockquoteTag(element, false)
        return
      }

      return
    }

    switch (element.type) {
      case 'bullet_list_open':
      case 'ordered_list_open':
      case 'table_open':
        level++
    }

    if (element.type === 'inline') {
      element.content = markdownInline.renderInline(element.content, markdownEnv)
    }

    if (level === 0) {
      switch (element.type) {
        case 'heading_open':
          tag = allowHeadingTokens ? element.tag : 'p'
          break
        case 'paragraph_open':
        case 'list_item_open':
          tag = element.tag
          break
      }

      switch (element.type) {
        case 'inline': {
          const anchorId = getHeadingAnchorId(markdown, tag, element, markdownEnv, parserState)

          if (expandableMap.has(element.content.trim())) {
            const data = expandableMap.get(element.content.trim())

            tokens.push({
              tag: 'expandable',
              title: data.title,
              open: data.open,
              tokens: tokenizePageSectionSource(data.content, {
                allowHeadingTokens: false,
                parserState
              })
            })
            break
          }

          if (quickLinksMap.has(element.content.trim())) {
            const data = quickLinksMap.get(element.content.trim())

            tokens.push({
              tag: 'quick-links',
              title: data.title,
              items: data.items
            })
            break
          }

          if (tag === 'p') {
            const imageToken = parseStandaloneImageToken(element.content)

            if (imageToken !== null) {
              tokens.push({
                ...imageToken,
                map: element.map
              })
              break
            }
          }

          tokens.push({
            tag,
            map: element.map,
            anchorId,
            content: element.content,
            info: element.info
          })
          break
        }

        case 'fence':
          pushSourceCodeToken(tokens, element, parserState)
          break

        case 'math_block':
          tokens.push({
            tag: 'html',
            content: renderBlockToken(markdown, element, markdownEnv)
          })
          break

        case 'html_block': {
          const figureImageToken = parseFigureImageToken(element.content)

          if (figureImageToken !== null) {
            tokens.push({
              ...figureImageToken,
              map: element.map
            })
            break
          }

          tokens.push({
            tag: 'html',
            content: element.content
          })
          break
        }
      }
    } else if (level > 0) {
      const parent = tokens[tokens.length - 1]

      switch (element.type) {
        case 'bullet_list_open':
          if (level === 1) {
            tokens.push({
              tag: 'ul',
              content: ''
            })
          } else {
            parent.content += '<ul>'
          }
          break

        case 'ordered_list_open':
          if (level === 1) {
            tokens.push({
              tag: 'ol',
              content: ''
            })
          } else {
            parent.content += '<ol>'
          }
          break

        case 'table_open':
          if (level === 1) {
            tokens.push({
              tag: 'table',
              content: ''
            })
          } else {
            parent.content += '<table>'
          }
          break

        case 'list_item_open':
          parent.content += '<li>'
          break

        case 'thead_open':
          parent.content += '<thead>'
          break
        case 'tbody_open':
          parent.content += '<tbody>'
          break
        case 'tr_open':
          parent.content += '<tr>'
          break
        case 'th_open':
          parent.content += '<th>'
          break
        case 'td_open':
          parent.content += '<td>'
          break

        case 'inline':
          parent.content += element.content
          break
        case 'math_block':
          parent.content += renderBlockToken(markdown, element, markdownEnv)
          break
        case 'html_inline':
        case 'html_block':
          parent.content += element.content
          break

        case 'list_item_close':
          parent.content += '</li>'
          break

        case 'bullet_list_close':
          if (level > 1) {
            parent.content += '</ul>'
          }
          break

        case 'ordered_list_close':
          if (level > 1) {
            parent.content += '</ol>'
          }
          break

        case 'table_close':
          if (level > 1) {
            parent.content += '</table>'
          }
          break

        case 'thead_close':
          parent.content += '</thead>'
          break
        case 'tbody_close':
          parent.content += '</tbody>'
          break
        case 'tr_close':
          parent.content += '</tr>'
          break
        case 'th_close':
          parent.content += '</th>'
          break
        case 'td_close':
          parent.content += '</td>'
          break
      }
    }

    switch (element.type) {
      case 'bullet_list_close':
      case 'ordered_list_close':
      case 'table_close':
        level--
    }
  })

  return tokens
}