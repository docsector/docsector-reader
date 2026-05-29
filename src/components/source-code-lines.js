const normalizeLineBreaks = (text = '') => String(text || '').replace(/\r\n/g, '\n')

export const countRenderedCodeLines = (text = '') => {
  const normalized = normalizeLineBreaks(text)

  if (normalized === '') {
    return 0
  }

  const withoutTerminalBreak = normalized.replace(/\n$/, '')

  if (withoutTerminalBreak === '') {
    return 1
  }

  return withoutTerminalBreak.split('\n').length
}