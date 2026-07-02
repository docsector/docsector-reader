import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import GithubSlugger from 'github-slugger'
import katex from 'katex'
import taskLists from 'markdown-it-task-lists'
import texmath from 'markdown-it-texmath'

import { installInlineCodeCopyRenderer } from './inline-code-copy'

const ALERT_MESSAGE_TYPES = new Set([
  'note',
  'tip',
  'important',
  'warning',
  'caution'
])

const CARDS_MARKER_PREFIX = '@@DOCSECTOR_CARDS_'
const QUICK_LINKS_MARKER_PREFIX = '@@DOCSECTOR_QUICK_LINKS_'
const TIMELINE_MARKER_PREFIX = '@@DOCSECTOR_TIMELINE_'
const STEPPER_MARKER_PREFIX = '@@DOCSECTOR_STEPPER_'
const EXPANDABLE_MARKER_PREFIX = '@@DOCSECTOR_EXPANDABLE_'
const FILE_MARKER_PREFIX = '@@DOCSECTOR_FILE_'
const EMBEDDED_URL_MARKER_PREFIX = '@@DOCSECTOR_EMBEDDED_URL_'
const CODE_EXAMPLE_MARKER_PREFIX = '@@DOCSECTOR_CODE_EXAMPLE_'
const TERMINAL_MARKER_PREFIX = '@@DOCSECTOR_TERMINAL_'
const API_BLOCK_MARKER_PREFIX = '@@DOCSECTOR_API_BLOCK_'
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

const escapeHtmlAttributeValue = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

const getTokenAttributes = (element) => {
  if (!Array.isArray(element?.attrs) || element.attrs.length === 0) {
    return null
  }

  return Object.fromEntries(element.attrs.map(([name, value]) => [name, value ?? '']))
}

const renderTokenAttributes = (element) => {
  const attributes = getTokenAttributes(element)

  if (attributes === null) {
    return ''
  }

  return Object.entries(attributes)
    .map(([name, value]) => ` ${name}="${escapeHtmlAttributeValue(value)}"`)
    .join('')
}

const extractQuickLinksBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const blockPattern = /<d-block-quick-links\b([^>]*)>([\s\S]*?)<\/d-block-quick-links>/gi
  const replaced = String(source).replace(blockPattern, (_, blockAttrsRaw, inner) => {
    const blockAttrs = parseCustomTagAttributes(blockAttrsRaw)
    const items = []
    const itemPattern = /<d-block-quick-link\b([^>]*)\/?\s*>/gi

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

const extractCardsBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const blockPattern = /<d-block-cards\b([^>]*)>([\s\S]*?)<\/d-block-cards>/gi
  const replaced = String(source).replace(blockPattern, (_, blockAttrsRaw, inner) => {
    const blockAttrs = parseCustomTagAttributes(blockAttrsRaw)
    const items = []
    const itemPattern = /<d-block-card\b([^>]*)\/?\s*>/gi

    let itemMatch = itemPattern.exec(inner)
    while (itemMatch !== null) {
      const itemAttrs = parseCustomTagAttributes(itemMatch[1])
      const title = itemAttrs.title || ''
      const description = itemAttrs.description || ''
      const to = itemAttrs.to || ''
      const href = itemAttrs.href || ''

      if (title && description && (to || href)) {
        items.push({
          title,
          description,
          to,
          href,
          image: itemAttrs.image || '',
          icon: itemAttrs.icon || ''
        })
      }

      itemMatch = itemPattern.exec(inner)
    }

    const marker = `${CARDS_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      title: blockAttrs.title || '',
      items
    })

    return `\n${marker}\n`
  })

  return {
    source: replaced,
    cardsMap: map
  }
}

const parseExpandableOpenState = (raw = '') => {
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase())
}

const parseBooleanAttribute = (raw, fallback = false) => {
  if (raw === undefined || raw === null || raw === '') {
    return fallback
  }

  const normalized = String(raw).trim().toLowerCase()

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return fallback
}

const parseTimelineTags = (raw = '') => {
  return decodeHtmlEntities(raw)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((label) => ({
      label,
      color: '',
      textColor: '',
      icon: ''
    }))
}

const parseTimelineTagLabel = (raw = '') => {
  return decodeHtmlEntities(String(raw).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

const createTimelineTag = (rawAttrs = '', rawLabel = '') => {
  const attrs = parseCustomTagAttributes(rawAttrs)
  const label = parseTimelineTagLabel(attrs.label || rawLabel)

  if (label === '') {
    return null
  }

  return {
    label,
    color: decodeHtmlEntities(attrs.color || '').trim(),
    textColor: decodeHtmlEntities(attrs['text-color'] || attrs.textColor || '').trim(),
    icon: decodeHtmlEntities(attrs.icon || '').trim()
  }
}

const extractTimelineItemTags = (source = '') => {
  const tags = []

  const replaceBlock = (match, rawAttrs, rawLabel = '') => {
    const tag = createTimelineTag(rawAttrs, rawLabel)

    if (tag !== null) {
      tags.push(tag)
      return '\n'
    }

    return match
  }

  const replaced = String(source).replace(
    /<d-block-timeline-tag\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/d-block-timeline-tag>)/gi,
    replaceBlock
  )

  return {
    content: replaced,
    tags
  }
}

const extractTimelineBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const blockPattern = /<d-block-timeline\b([^>]*)>([\s\S]*?)<\/d-block-timeline>/gi
  const replaced = String(source).replace(blockPattern, (match, _rawAttrs, inner) => {
    const items = []
    const itemPattern = /<d-block-timeline-item\b([^>]*)>([\s\S]*?)<\/d-block-timeline-item>/gi

    let itemMatch = itemPattern.exec(inner)
    while (itemMatch !== null) {
      const attrs = parseCustomTagAttributes(itemMatch[1])
      const date = decodeHtmlEntities(attrs.date || '').trim()
      const { content: itemContent, tags } = extractTimelineItemTags(itemMatch[2])

      if (date) {
        items.push({
          date,
          tags: [...parseTimelineTags(attrs.tags || ''), ...tags],
          anchor: decodeHtmlEntities(attrs.anchor || attrs.id || '').trim(),
          content: itemContent
        })
      }

      itemMatch = itemPattern.exec(inner)
    }

    if (items.length === 0) {
      return match
    }

    const marker = `${TIMELINE_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      items
    })

    return `\n${marker}\n`
  })

  return {
    source: replaced,
    timelineMap: map
  }
}

const extractStepperBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const blockPattern = /<d-block-stepper\b([^>]*)>([\s\S]*?)<\/d-block-stepper>/gi
  const replaced = String(source).replace(blockPattern, (match, _rawAttrs, inner) => {
    const steps = []
    const stepPattern = /<d-block-step\b([^>]*)>([\s\S]*?)<\/d-block-step>/gi

    let stepMatch = stepPattern.exec(inner)
    while (stepMatch !== null) {
      const attrs = parseCustomTagAttributes(stepMatch[1])
      const title = attrs.title || ''

      if (title) {
        steps.push({
          title,
          icon: attrs.icon || '',
          activeIcon: attrs['active-icon'] || '',
          doneIcon: attrs['done-icon'] || '',
          errorIcon: attrs['error-icon'] || '',
          content: stepMatch[2]
        })
      }

      stepMatch = stepPattern.exec(inner)
    }

    if (steps.length === 0) {
      return match
    }

    const marker = `${STEPPER_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      steps
    })

    return `\n${marker}\n`
  })

  return {
    source: replaced,
    stepperMap: map
  }
}

// @ Normalize native <details>/<summary> into the expandable block syntax so raw
//   HTML READMEs render as a single styled collapsible instead of being split
//   across multiple html_block tokens (which breaks the <details> nesting).
const normalizeNativeDetails = (source = '') => {
  const blockPattern = /<details\b([^>]*)>([\s\S]*?)<\/details>/gi

  return String(source).replace(blockPattern, (_, rawAttrs, inner) => {
    let title = ''
    let body = inner

    // ? Pull the first <summary> as the collapsible title; the rest is the body
    const summaryMatch = inner.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i)
    if (summaryMatch) {
      title = summaryMatch[1]
      body = inner.slice(0, summaryMatch.index) + inner.slice(summaryMatch.index + summaryMatch[0].length)
    }

    // : plain-text, attribute-safe title (falls back when no <summary> is present)
    title = title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().replace(/"/g, '&quot;') || 'Details'

    // ? Drop a leading <br> that commonly trails </summary> so the body starts clean
    body = body.replace(/^\s*<br\s*\/?>/i, '')

    // ? Strip the common leading indentation authors add inside <details> so the
    //   body parses as top-level Markdown instead of an indented/nested block
    const lines = body.split('\n')
    const indents = lines
      .filter((line) => line.trim() !== '')
      .map((line) => (line.match(/^[ \t]*/) || [''])[0].length)
    const commonIndent = indents.length > 0 ? Math.min(...indents) : 0
    if (commonIndent > 0) {
      body = lines.map((line) => line.slice(commonIndent)).join('\n')
    }

    const open = /(^|\s)open(\s|=|$)/i.test(rawAttrs) ? ' open="true"' : ''

    return `\n<d-block-expandable title="${title}"${open}>\n${body.trim()}\n</d-block-expandable>\n`
  })
}

const extractExpandableBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const blockPattern = /<d-block-expandable\b([^>]*)>([\s\S]*?)<\/d-block-expandable>/gi
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

const getFileTitleFromSrc = (src = '') => {
  const normalized = String(src)
    .split('#')[0]
    .split('?')[0]
  const rawSegment = normalized
    .split('/')
    .filter(Boolean)
    .pop() || ''

  if (!rawSegment) {
    return 'Download file'
  }

  try {
    return decodeURIComponent(rawSegment)
  } catch {
    return rawSegment
  }
}

const extractFileBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const replaceBlock = (match, rawAttrs, rawCaption = '') => {
    const attrs = parseCustomTagAttributes(rawAttrs)
    const src = decodeHtmlEntities(attrs.src || attrs.href || '').trim()

    if (!src) {
      return match
    }

    const marker = `${FILE_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      src,
      title: decodeHtmlEntities(attrs.title || attrs.name || '').trim(),
      size: decodeHtmlEntities(attrs.size || '').trim(),
      caption: String(rawCaption).trim()
    })

    return `\n${marker}\n`
  }

  const replacedSelfClosing = String(source).replace(/<d-block-file\b([^>]*)\/\s*>/gi, (match, rawAttrs) => {
    return replaceBlock(match, rawAttrs)
  })
  const replaced = replacedSelfClosing.replace(/<d-block-file\b([^>]*)>([\s\S]*?)<\/d-block-file>/gi, replaceBlock)

  return {
    source: replaced,
    fileMap: map
  }
}

const extractEmbeddedUrlBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const replaceBlock = (match, rawAttrs, rawCaption = '') => {
    const attrs = parseCustomTagAttributes(rawAttrs)
    const url = decodeHtmlEntities(attrs.url || attrs.href || attrs.src || '').trim()

    if (!url) {
      return match
    }

    const marker = `${EMBEDDED_URL_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      url,
      title: decodeHtmlEntities(attrs.title || '').trim(),
      caption: String(rawCaption).trim()
    })

    return `\n${marker}\n`
  }

  const replacedSelfClosing = String(source).replace(/<d-block-embedded-url\b([^>]*)\/\s*>/gi, (match, rawAttrs) => {
    return replaceBlock(match, rawAttrs)
  })
  const replaced = replacedSelfClosing.replace(/<d-block-embedded-url\b([^>]*)>([\s\S]*?)<\/d-block-embedded-url>/gi, replaceBlock)

  return {
    source: replaced,
    embeddedUrlMap: map
  }
}

const extractCodeExampleBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const replaceBlock = (match, rawAttrs, rawCaption = '') => {
    const attrs = parseCustomTagAttributes(rawAttrs)
    const src = decodeHtmlEntities(attrs.src || attrs.file || '').trim()

    if (!src) {
      return match
    }

    const marker = `${CODE_EXAMPLE_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      src,
      title: decodeHtmlEntities(attrs.title || '').trim(),
      expanded: parseBooleanAttribute(attrs.expanded, false),
      codepen: parseBooleanAttribute(attrs.codepen, true),
      scrollable: parseBooleanAttribute(attrs.scrollable, false),
      overflow: parseBooleanAttribute(attrs.overflow, false),
      height: decodeHtmlEntities(attrs.height || '').trim(),
      caption: String(rawCaption).trim()
    })

    return `\n${marker}\n`
  }

  const replacedSelfClosing = String(source).replace(/<d-block-code-example\b([^>]*)\/\s*>/gi, (match, rawAttrs) => {
    return replaceBlock(match, rawAttrs)
  })
  const replaced = replacedSelfClosing.replace(/<d-block-code-example\b([^>]*)>([\s\S]*?)<\/d-block-code-example>/gi, replaceBlock)

  return {
    source: replaced,
    codeExampleMap: map
  }
}

const parseTerminalCommands = (raw = '') => {
  return String(raw)
    .split('|')
    .map((entry) => {
      const trimmed = entry.trim()
      if (!trimmed) {
        return null
      }

      const separator = trimmed.indexOf(':')
      if (separator === -1) {
        return { label: trimmed, command: trimmed }
      }

      const label = trimmed.slice(0, separator).trim()
      const command = trimmed.slice(separator + 1).trim()
      if (!command) {
        return null
      }

      return { label: label || command, command }
    })
    .filter(Boolean)
}

const extractTerminalBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const replaceBlock = (match, rawAttrs, rawCaption = '') => {
    const attrs = parseCustomTagAttributes(rawAttrs)
    const engine = decodeHtmlEntities(attrs.engine || '').trim()

    if (!engine) {
      return match
    }

    const marker = `${TERMINAL_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      engine,
      title: decodeHtmlEntities(attrs.title || '').trim(),
      command: decodeHtmlEntities(attrs.command || '').trim(),
      commands: parseTerminalCommands(decodeHtmlEntities(attrs.commands || '')),
      height: decodeHtmlEntities(attrs.height || '').trim(),
      autorun: parseBooleanAttribute(attrs.autorun, false),
      runLabel: decodeHtmlEntities(attrs['run-label'] || '').trim(),
      caption: String(rawCaption).trim()
    })

    return `\n${marker}\n`
  }

  const replacedSelfClosing = String(source).replace(/<d-block-terminal\b([^>]*)\/\s*>/gi, (match, rawAttrs) => {
    return replaceBlock(match, rawAttrs)
  })
  const replaced = replacedSelfClosing.replace(/<d-block-terminal\b([^>]*)>([\s\S]*?)<\/d-block-terminal>/gi, replaceBlock)

  return {
    source: replaced,
    terminalMap: map
  }
}

const extractApiBlocks = (source = '') => {
  const map = new Map()
  let index = 0

  const replaceBlock = (match, rawAttrs) => {
    const attrs = parseCustomTagAttributes(rawAttrs)
    const src = decodeHtmlEntities(attrs.src || '').trim()

    if (!src) {
      return match
    }

    const marker = `${API_BLOCK_MARKER_PREFIX}${index}@@`
    index++

    map.set(marker, {
      src,
      title: decodeHtmlEntities(attrs.title || '').trim(),
      pageLink: parseBooleanAttribute(attrs['page-link'], false)
    })

    return `\n${marker}\n`
  }

  const replacedSelfClosing = String(source).replace(/<d-block-api\b([^>]*)\/\s*>/gi, (match, rawAttrs) => {
    return replaceBlock(match, rawAttrs)
  })
  const replaced = replacedSelfClosing.replace(/<d-block-api\b([^>]*)>([\s\S]*?)<\/d-block-api>/gi, (match, rawAttrs) => {
    return replaceBlock(match, rawAttrs)
  })

  return {
    source: replaced,
    apiBlockMap: map
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

const stripHtmlTags = (value = '') => {
  return decodeHtmlEntities(String(value).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
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

const renderInlineToken = (markdown, markdownInline, element, env) => {
  if (Array.isArray(element.children) && element.children.length > 0) {
    return markdown.renderer.renderInline(element.children, markdown.options, env)
  }

  return markdownInline.renderInline(element.content, env)
}

const createMarkdownBlockParser = () => {
  const markdown = installInlineCodeCopyRenderer(installMathSupport(new MarkdownIt({
    html: true
  })))

  markdown.use(attrs, {
    leftDelimiter: ':',
    rightDelimiter: ';',
    allowedAttributes: ['filename', 'group', 'tab', 'breadcrumb']
  })
  markdown.use(taskLists, {
    enabled: false,
    label: false,
    labelAfter: false
  })

  return markdown
}

const createMarkdownInlineParser = () => {
  return installInlineCodeCopyRenderer(installMathSupport(new MarkdownIt({
    html: true
  })) )
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

const getTimelineItemTitle = (tokens = []) => {
  for (const token of tokens) {
    if (typeof token?.content !== 'string') {
      continue
    }

    const text = stripHtmlTags(token.content)
    if (text !== '') {
      return text
    }
  }

  return ''
}

const getTimelineItemAnchorId = ({ item, itemTokens, itemIndex, parserState }) => {
  const explicitAnchor = decodeHtmlEntities(item.anchor || '').trim()

  if (explicitAnchor !== '') {
    return parserState.headingSlugger.slug(explicitAnchor)
  }

  const title = getTimelineItemTitle(itemTokens)
  const fallbackTitle = title || `item-${itemIndex + 1}`
  const seed = [item.date, fallbackTitle].filter(Boolean).join(' ')

  return parserState.headingSlugger.slug(seed)
}

export const tokenizePageSectionSource = (source = '', options = {}) => {
  const {
    allowHeadingTokens = true,
    parserState = createParserState()
  } = options
  // ? Convert native <details>/<summary> to the expandable syntax BEFORE shielding
  //   so any dedented body code is shielded/restored flush-left (not nested)
  const normalizedSource = normalizeNativeDetails(normalizePageSectionSource(source))
  const { source: sourceWithShieldedCode, codeSegmentsMap } = shieldMarkdownCodeSegments(normalizedSource)
  const { source: sourceWithTimelines, timelineMap } = extractTimelineBlocks(sourceWithShieldedCode)

  timelineMap.forEach((data, marker) => {
    timelineMap.set(marker, {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        content: restoreShieldedCodeSegments(item.content, codeSegmentsMap)
      }))
    })
  })

  const { source: sourceWithSteppers, stepperMap } = extractStepperBlocks(sourceWithTimelines)

  stepperMap.forEach((data, marker) => {
    stepperMap.set(marker, {
      ...data,
      steps: data.steps.map((step) => ({
        ...step,
        content: restoreShieldedCodeSegments(step.content, codeSegmentsMap)
      }))
    })
  })

  const { source: sourceWithExpandables, expandableMap } = extractExpandableBlocks(sourceWithSteppers)

  expandableMap.forEach((data, marker) => {
    expandableMap.set(marker, {
      ...data,
      content: restoreShieldedCodeSegments(data.content, codeSegmentsMap)
    })
  })

  const { source: sourceWithCards, cardsMap } = extractCardsBlocks(sourceWithExpandables)
  const { source: sourceWithQuickLinks, quickLinksMap } = extractQuickLinksBlocks(sourceWithCards)
  const { source: sourceWithFiles, fileMap } = extractFileBlocks(sourceWithQuickLinks)
  const { source: sourceWithEmbeddedUrls, embeddedUrlMap } = extractEmbeddedUrlBlocks(sourceWithFiles)
  const { source: sourceWithCodeExamples, codeExampleMap } = extractCodeExampleBlocks(sourceWithEmbeddedUrls)
  const { source: sourceWithTerminals, terminalMap } = extractTerminalBlocks(sourceWithCodeExamples)
  const { source: sourceWithApiBlocks, apiBlockMap } = extractApiBlocks(sourceWithTerminals)

  fileMap.forEach((data, marker) => {
    fileMap.set(marker, {
      ...data,
      caption: restoreShieldedCodeSegments(data.caption, codeSegmentsMap)
    })
  })

  embeddedUrlMap.forEach((data, marker) => {
    embeddedUrlMap.set(marker, {
      ...data,
      caption: restoreShieldedCodeSegments(data.caption, codeSegmentsMap)
    })
  })

  codeExampleMap.forEach((data, marker) => {
    codeExampleMap.set(marker, {
      ...data,
      caption: restoreShieldedCodeSegments(data.caption, codeSegmentsMap)
    })
  })

  terminalMap.forEach((data, marker) => {
    terminalMap.set(marker, {
      ...data,
      caption: restoreShieldedCodeSegments(data.caption, codeSegmentsMap)
    })
  })

  const markdown = createMarkdownBlockParser()
  const markdownInline = createMarkdownInlineParser()
  const markdownEnv = {}
  const parsed = markdown.parse(restoreShieldedCodeSegments(sourceWithApiBlocks, codeSegmentsMap), markdownEnv)
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
      element.content = renderInlineToken(markdown, markdownInline, element, markdownEnv)
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

          if (timelineMap.has(element.content.trim())) {
            const data = timelineMap.get(element.content.trim())

            tokens.push({
              tag: 'timeline',
              items: data.items.map((item, itemIndex) => {
                const itemTokens = tokenizePageSectionSource(item.content, {
                  allowHeadingTokens: false,
                  parserState
                })

                return {
                  date: item.date,
                  tags: item.tags,
                  anchorId: getTimelineItemAnchorId({
                    item,
                    itemTokens,
                    itemIndex,
                    parserState
                  }),
                  tokens: itemTokens
                }
              })
            })
            break
          }

          if (stepperMap.has(element.content.trim())) {
            const data = stepperMap.get(element.content.trim())

            tokens.push({
              tag: 'stepper',
              steps: data.steps.map((step) => ({
                title: step.title,
                icon: step.icon,
                activeIcon: step.activeIcon,
                doneIcon: step.doneIcon,
                errorIcon: step.errorIcon,
                tokens: tokenizePageSectionSource(step.content, {
                  allowHeadingTokens: false,
                  parserState
                })
              }))
            })
            break
          }

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

          if (cardsMap.has(element.content.trim())) {
            const data = cardsMap.get(element.content.trim())

            tokens.push({
              tag: 'cards',
              title: data.title,
              items: data.items
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

          if (fileMap.has(element.content.trim())) {
            const data = fileMap.get(element.content.trim())

            tokens.push({
              tag: 'file',
              map: element.map,
              src: data.src,
              title: data.title || getFileTitleFromSrc(data.src),
              size: data.size,
              caption: data.caption !== ''
                ? markdownInline.renderInline(data.caption, markdownEnv)
                : ''
            })
            break
          }

          if (embeddedUrlMap.has(element.content.trim())) {
            const data = embeddedUrlMap.get(element.content.trim())

            tokens.push({
              tag: 'embedded-url',
              map: element.map,
              url: data.url,
              title: data.title,
              caption: data.caption !== ''
                ? markdownInline.renderInline(data.caption, markdownEnv)
                : ''
            })
            break
          }

          if (codeExampleMap.has(element.content.trim())) {
            const data = codeExampleMap.get(element.content.trim())

            tokens.push({
              tag: 'code-example',
              map: element.map,
              codeIndex: parserState.codeIndex++,
              src: data.src,
              title: data.title,
              expanded: data.expanded,
              codepen: data.codepen,
              scrollable: data.scrollable,
              overflow: data.overflow,
              height: data.height,
              caption: data.caption !== ''
                ? markdownInline.renderInline(data.caption, markdownEnv)
                : ''
            })
            break
          }

          if (terminalMap.has(element.content.trim())) {
            const data = terminalMap.get(element.content.trim())

            tokens.push({
              tag: 'terminal',
              map: element.map,
              codeIndex: parserState.codeIndex++,
              engine: data.engine,
              title: data.title,
              command: data.command,
              commands: data.commands,
              height: data.height,
              autorun: data.autorun,
              runLabel: data.runLabel,
              caption: data.caption !== ''
                ? markdownInline.renderInline(data.caption, markdownEnv)
                : ''
            })
            break
          }

          if (apiBlockMap.has(element.content.trim())) {
            const data = apiBlockMap.get(element.content.trim())

            tokens.push({
              tag: 'api',
              map: element.map,
              src: data.src,
              title: data.title,
              pageLink: data.pageLink
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
            const attributes = getTokenAttributes(element)

            tokens.push({
              tag: 'ul',
              content: '',
              ...(attributes !== null ? { attrs: attributes } : {})
            })
          } else {
            parent.content += `<ul${renderTokenAttributes(element)}>`
          }
          break

        case 'ordered_list_open':
          if (level === 1) {
            const attributes = getTokenAttributes(element)

            tokens.push({
              tag: 'ol',
              content: '',
              ...(attributes !== null ? { attrs: attributes } : {})
            })
          } else {
            parent.content += `<ol${renderTokenAttributes(element)}>`
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
          parent.content += `<li${renderTokenAttributes(element)}>`
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