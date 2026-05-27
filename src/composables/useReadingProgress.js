export const DEFAULT_READING_PROGRESS_THRESHOLD = 0.12

const toFiniteNumber = (value) => {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value))
}

export function getReadingProgressState({
  scrollTop = 0,
  scrollHeight = 0,
  clientHeight = 0,
  visibilityThreshold = DEFAULT_READING_PROGRESS_THRESHOLD
} = {}) {
  const normalizedClientHeight = Math.max(0, toFiniteNumber(clientHeight))
  const normalizedScrollHeight = Math.max(0, toFiniteNumber(scrollHeight))
  const maxScrollTop = Math.max(0, normalizedScrollHeight - normalizedClientHeight)

  if (maxScrollTop === 0) {
    return {
      hasOverflow: false,
      maxScrollTop: 0,
      scrollTop: 0,
      progressPercent: 0,
      visibleOffset: 0,
      isVisible: false
    }
  }

  const normalizedScrollTop = clamp(toFiniteNumber(scrollTop), 0, maxScrollTop)
  const normalizedThreshold = clamp(toFiniteNumber(visibilityThreshold), 0, 1)
  const visibleOffset = Math.round(maxScrollTop * normalizedThreshold)
  const progressPercent = Math.round((normalizedScrollTop / maxScrollTop) * 100)

  return {
    hasOverflow: true,
    maxScrollTop,
    scrollTop: normalizedScrollTop,
    progressPercent,
    visibleOffset,
    isVisible: normalizedScrollTop >= visibleOffset && normalizedScrollTop > 0
  }
}