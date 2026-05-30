export const DEFAULT_ASSISTANT_ENDPOINT = '/assistant'
export const DEFAULT_ASSISTANT_PROVIDER = 'aiSearch'
export const DEFAULT_ASSISTANT_DRAWER_WIDTH = 380
export const DEFAULT_ASSISTANT_WIDE_BREAKPOINT = 1280

const DEFAULT_SUGGESTED_PROMPTS = [
  'How do I get started?',
  'Summarize this page.',
  'Where is the related API reference?'
]

function toBoolean (value, fallback = false) {
  if (typeof value === 'boolean') return value
  return fallback
}

function toPositiveInteger (value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

function toBoundedNumber (value, fallback, { min = 0, max = 1 } = {}) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function toCleanString (value, fallback = '') {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function normalizeSuggestedPrompts (value) {
  const prompts = Array.isArray(value) ? value : DEFAULT_SUGGESTED_PROMPTS
  const normalized = prompts
    .map(prompt => toCleanString(prompt))
    .filter(Boolean)
    .slice(0, 6)

  return normalized.length > 0 ? normalized : [...DEFAULT_SUGGESTED_PROMPTS]
}

export function isAssistantEnabled (config = {}) {
  return config?.aiAssistant?.enabled === true
}

export function normalizeAiAssistantConfig (config = {}) {
  const assistant = config.aiAssistant || {}
  const provider = toCleanString(assistant.provider, DEFAULT_ASSISTANT_PROVIDER)
  const aiSearch = assistant.aiSearch || {}
  const ui = assistant.ui || {}

  return {
    enabled: assistant.enabled === true,
    provider,
    endpoint: toCleanString(assistant.endpoint, DEFAULT_ASSISTANT_ENDPOINT),
    ui: {
      title: toCleanString(ui.title, 'Docsector Assistant'),
      subtitle: toCleanString(ui.subtitle, 'Ask, search, or explain the docs.'),
      drawerWidth: toPositiveInteger(ui.drawerWidth, DEFAULT_ASSISTANT_DRAWER_WIDTH, { min: 320, max: 520 }),
      wideBreakpoint: toPositiveInteger(ui.wideBreakpoint, DEFAULT_ASSISTANT_WIDE_BREAKPOINT, { min: 960, max: 2400 }),
      showCitations: toBoolean(ui.showCitations, true),
      suggestedPrompts: normalizeSuggestedPrompts(ui.suggestedPrompts)
    },
    aiSearch: {
      binding: toCleanString(aiSearch.binding, 'AI_SEARCH'),
      instanceName: toCleanString(aiSearch.instanceName || aiSearch.instanceId, ''),
      namespace: toCleanString(aiSearch.namespace, ''),
      accountIdEnv: toCleanString(aiSearch.accountIdEnv, 'CLOUDFLARE_ACCOUNT_ID'),
      apiTokenEnv: toCleanString(aiSearch.apiTokenEnv, 'CLOUDFLARE_API_TOKEN'),
      model: toCleanString(aiSearch.model, '@cf/meta/llama-3.3-70b-instruct-fp8-fast'),
      retrievalType: toCleanString(aiSearch.retrievalType, 'hybrid'),
      maxResults: toPositiveInteger(aiSearch.maxResults, 6, { min: 1, max: 50 }),
      matchThreshold: toBoundedNumber(aiSearch.matchThreshold, 0.4),
      contextExpansion: toPositiveInteger(aiSearch.contextExpansion, 1, { min: 0, max: 3 }),
      queryRewrite: {
        enabled: toBoolean(aiSearch.queryRewrite?.enabled, true),
        model: toCleanString(aiSearch.queryRewrite?.model, '')
      },
      reranking: {
        enabled: toBoolean(aiSearch.reranking?.enabled, false),
        model: toCleanString(aiSearch.reranking?.model, '@cf/baai/bge-reranker-base'),
        matchThreshold: toBoundedNumber(aiSearch.reranking?.matchThreshold, 0.4)
      },
      stream: aiSearch.stream !== false
    }
  }
}
