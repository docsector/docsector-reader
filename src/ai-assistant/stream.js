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
  return (Array.isArray(chunks) ? chunks : [])
    .map((chunk, index) => {
      const key = chunk?.item?.key || chunk?.key || chunk?.url || ''
      const score = Number(chunk?.score ?? chunk?.scoring_details?.vector_score ?? 0)
      const text = typeof chunk?.text === 'string' ? chunk.text.trim() : ''
      const title = chunk?.item?.metadata?.title || chunk?.metadata?.title || key

      return {
        id: String(chunk?.id || key || `source-${index + 1}`),
        key: String(key || ''),
        title: String(title || `Source ${index + 1}`),
        text,
        score: Number.isFinite(score) ? score : 0
      }
    })
    .filter(chunk => chunk.key || chunk.text)
}
