export const MARKDOWN_AGENT_USER_AGENT_SOURCE = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'Google-Extended',
  'Gemini-Deep-Research',
  'PerplexityBot',
  'Perplexity-User',
  'Bytespider',
  'CCBot',
  'Meta-ExternalAgent',
  'FacebookBot',
  'Amazonbot',
  'Applebot-Extended',
  'cohere-ai',
  'DuckAssistBot',
  'GrokBot',
  'AI2Bot',
  'YouBot',
  'PetalBot',
  'Cloudflare-AI-Search'
].join('|')

export const MARKDOWN_AGENT_USER_AGENT_PATTERN = new RegExp(MARKDOWN_AGENT_USER_AGENT_SOURCE, 'i')

export function matchesMarkdownAgentUserAgent (userAgent = '') {
  return MARKDOWN_AGENT_USER_AGENT_PATTERN.test(String(userAgent || ''))
}