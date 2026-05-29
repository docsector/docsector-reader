const PART_LABELS = Object.freeze({
  template: 'Template',
  script: 'Script',
  style: 'Style'
})

const PART_ORDER = ['Template', 'Script', 'Style']
const ALLOWED_CODEPEN_IMPORTS = new Set(['vue', 'quasar'])

const createSfcOpeningTagPattern = () => /<(template|script|style)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi

const createSameTagPattern = (tag) => new RegExp(`</?${tag}\\b((?:"[^"]*"|'[^']*'|[^'">])*)>`, 'gi')

const findSfcBlockRange = (source = '', tag = '', searchStart = 0) => {
  const pattern = createSameTagPattern(tag)
  pattern.lastIndex = searchStart

  let depth = 1
  let match = pattern.exec(source)

  while (match !== null) {
    const token = match[0]
    const isClosing = token.startsWith('</')
    const isSelfClosing = /\/\s*>$/.test(token)

    if (isClosing) {
      depth--
    } else if (!isSelfClosing) {
      depth++
    }

    if (depth === 0) {
      return {
        closingStart: match.index,
        blockEnd: pattern.lastIndex
      }
    }

    match = pattern.exec(source)
  }

  return null
}

const parseVueSfcBlocks = (source = '') => {
  const blocks = {
    template: [],
    script: [],
    style: []
  }
  const content = String(source)
  const openingPattern = createSfcOpeningTagPattern()

  let cursor = 0
  while (cursor < content.length) {
    openingPattern.lastIndex = cursor

    const match = openingPattern.exec(content)
    if (!match) {
      break
    }

    const tag = match[1].toLowerCase()
    const openingStart = match.index
    const openingEnd = openingPattern.lastIndex
    const range = findSfcBlockRange(content, tag, openingEnd)

    if (!range) {
      cursor = openingEnd
      continue
    }

    blocks[tag].push({
      tag,
      attrs: match[2] || '',
      content: content.slice(openingEnd, range.closingStart).trim(),
      raw: content.slice(openingStart, range.blockEnd).trim()
    })

    cursor = range.blockEnd
  }

  return blocks
}

const hasAttribute = (rawAttrs = '', name = '') => {
  const pattern = new RegExp(`(?:^|\\s)${name}(?:\\s|=|$)`, 'i')
  return pattern.test(String(rawAttrs || ''))
}

const getLangAttribute = (rawAttrs = '') => {
  const match = String(rawAttrs || '').match(/(?:^|\s)lang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)
  return (match?.[1] || match?.[2] || match?.[3] || '').trim().toLowerCase()
}

const normalizeNamedImport = (rawName = '') => {
  const trimmed = rawName.trim()
  const aliasMatch = trimmed.match(/^(.+?)\s+as\s+(.+)$/i)

  if (aliasMatch) {
    return `${aliasMatch[1].trim()}: ${aliasMatch[2].trim()}`
  }

  return trimmed
}

const createGlobalDestructure = (globalName, rawNames = '') => {
  const names = String(rawNames)
    .split(',')
    .map((name) => normalizeNamedImport(name))
    .filter(Boolean)

  if (names.length === 0) {
    return ''
  }

  return `const { ${names.join(', ')} } = ${globalName}`
}

const findUnsupportedImport = (script = '') => {
  const importsWithSourcePattern = /^\s*import\s+(.+?)\s+from\s+["']([^"']+)["'];?\s*$/gm
  const sideEffectImportPattern = /^\s*import\s+["']([^"']+)["'];?\s*$/gm

  let match = importsWithSourcePattern.exec(script)
  while (match !== null) {
    const importSpecifiers = match[1].trim()
    const importSource = match[2].trim()

    if (!ALLOWED_CODEPEN_IMPORTS.has(importSource) || !importSpecifiers.startsWith('{')) {
      return importSource
    }

    match = importsWithSourcePattern.exec(script)
  }

  match = sideEffectImportPattern.exec(script)
  if (match !== null) {
    return match[1].trim()
  }

  return ''
}

const transformAllowedImports = (script = '') => {
  return String(script)
    .replace(/^\s*import\s+\{([^}]+)\}\s+from\s+["']vue["'];?\s*$/gm, (_, imports) => createGlobalDestructure('Vue', imports))
    .replace(/^\s*import\s+\{([^}]+)\}\s+from\s+["']quasar["'];?\s*$/gm, (_, imports) => createGlobalDestructure('Quasar', imports))
}

const getScriptForValidation = (script = '') => {
  return transformAllowedImports(script).trim()
}

const stripSfcTags = (blocks = []) => {
  return blocks
    .map((block) => block.content)
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

const getStylePreprocessor = (styleBlock) => {
  const lang = getLangAttribute(styleBlock?.attrs || '')
  return lang || 'none'
}

const getPartLanguage = (label, text = '') => {
  if (label === 'Template') return 'html'
  if (label === 'Script') return getLangAttribute(text.match(/^<script\b([^>]*)>/i)?.[1] || '') || 'javascript'
  if (label === 'Style') return getLangAttribute(text.match(/^<style\b([^>]*)>/i)?.[1] || '') || 'css'
  if (label === 'All') return 'vue'
  return 'text'
}

const createEditorsFlag = ({ html, css, js }) => {
  const flag = (html ? 0b100 : 0) | (css ? 0b010 : 0) | (js ? 0b001 : 0)
  return flag.toString(2)
}

const createCodepenResources = (quasarVersion = 'latest') => {
  const version = String(quasarVersion || 'latest').trim() || 'latest'

  return {
    cssExternal: [
      'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons',
      `https://cdn.jsdelivr.net/npm/quasar@${version}/dist/quasar.min.css`
    ].join(';'),
    jsExternal: [
      'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js',
      `https://cdn.jsdelivr.net/npm/quasar@${version}/dist/quasar.umd.prod.js`
    ].join(';')
  }
}

const normalizeRepositoryFilePath = (filePath = '') => {
  return String(filePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .trim()
}

const createCodepenJs = (script = '') => {
  const transformedScript = transformAllowedImports(script).trim()
  const componentScript = transformedScript
    ? transformedScript.replace(/\bexport\s+default\b/, 'const __CodeExample =')
    : 'const __CodeExample = {}'

  return `${componentScript}

const app = Vue.createApp(__CodeExample)

app.use(Quasar, { config: {} })
app.mount('#q-app')
`
}

export const parseVueSfcParts = (source = '') => {
  const blocks = parseVueSfcBlocks(source)
  const parts = {}

  Object.entries(blocks).forEach(([tag, tagBlocks]) => {
    const label = PART_LABELS[tag]
    const raw = tagBlocks
      .map((block) => block.raw)
      .filter(Boolean)
      .join('\n\n')
      .trim()

    if (label && raw) {
      parts[label] = raw
    }
  })

  return parts
}

export const createCodeExampleTabs = (source = '') => {
  const trimmedSource = String(source || '').trim()
  const parts = parseVueSfcParts(trimmedSource)
  const tabs = PART_ORDER
    .filter((label) => parts[label])
    .map((label) => ({
      label,
      language: getPartLanguage(label, parts[label]),
      text: parts[label]
    }))

  if (tabs.length > 1) {
    tabs.push({
      label: 'All',
      language: getPartLanguage('All'),
      text: trimmedSource
    })
  }

  if (tabs.length === 0 && trimmedSource) {
    tabs.push({
      label: 'Source',
      language: 'text',
      text: trimmedSource
    })
  }

  return tabs
}

export const getCodepenUnsupportedReason = (source = '') => {
  const blocks = parseVueSfcBlocks(source)

  if (blocks.template.length === 0 || !stripSfcTags(blocks.template)) {
    return 'CodePen export requires a Vue SFC template section.'
  }

  if (blocks.script.length > 1) {
    return 'CodePen export supports a single script section in this version.'
  }

  const scriptBlock = blocks.script[0]
  if (!scriptBlock) {
    return ''
  }

  if (hasAttribute(scriptBlock.attrs, 'setup')) {
    return 'CodePen export does not support script setup examples yet.'
  }

  if (getLangAttribute(scriptBlock.attrs) === 'ts') {
    return 'CodePen export does not support TypeScript script sections yet.'
  }

  const unsupportedImport = findUnsupportedImport(scriptBlock.content)
  if (unsupportedImport) {
    return `CodePen export does not support local or external imports (${unsupportedImport}).`
  }

  const validationScript = getScriptForValidation(scriptBlock.content)
  if (validationScript && !/\bexport\s+default\b/.test(validationScript)) {
    return 'CodePen export requires an Options API default export in this version.'
  }

  return ''
}

export const canCreateCodepenPayload = (source = '') => {
  return getCodepenUnsupportedReason(source) === ''
}

export const createCodepenPayload = (source = '', options = {}) => {
  const unsupportedReason = getCodepenUnsupportedReason(source)
  if (unsupportedReason) {
    throw new Error(unsupportedReason)
  }

  const blocks = parseVueSfcBlocks(source)
  const html = stripSfcTags(blocks.template)
  const css = stripSfcTags(blocks.style)
  const script = blocks.script[0]?.content || ''
  const js = createCodepenJs(script)
  const resources = createCodepenResources(options.quasarVersion)
  const sourceUrl = String(options.sourceUrl || '').trim()
  const sourceComment = sourceUrl
    ? `<!--\nGenerated from:\n${sourceUrl}\n-->\n`
    : ''

  return {
    title: String(options.title || 'Docsector code example').trim() || 'Docsector code example',
    html: `${sourceComment}<div id="q-app" style="min-height: 100vh;">
${html}
</div>`,
    head: '',
    html_pre_processor: 'none',
    css,
    css_pre_processor: getStylePreprocessor(blocks.style[0]),
    css_external: resources.cssExternal,
    js,
    js_pre_processor: 'babel',
    js_external: resources.jsExternal,
    editors: createEditorsFlag({ html, css, js })
  }
}

export const createCodeExampleGitHubUrl = (filePath = '', config = {}) => {
  const normalizedFilePath = normalizeRepositoryFilePath(filePath)

  if (!normalizedFilePath) {
    return ''
  }

  const editBaseUrl = String(config.github?.editBaseUrl || '').trim()
  const editMatch = editBaseUrl.match(/^(https:\/\/github\.com\/[^/]+\/[^/]+)\/(?:edit|blob|tree)\/([^/]+)(?:\/.*)?$/)

  if (editMatch) {
    return `${editMatch[1]}/blob/${editMatch[2]}/${normalizedFilePath}`
  }

  const githubUrl = String(config.links?.github || '').trim().replace(/\/+$/, '')

  if (/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(githubUrl)) {
    return `${githubUrl}/blob/main/${normalizedFilePath}`
  }

  return ''
}