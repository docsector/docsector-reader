export const DEFAULT_ACTIVE_ANCHOR_OFFSET = 50

const toFiniteNumber = (value) => {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

export function getActiveAnchorId({
  anchors = [],
  scrollTop = 0,
  scrollOffset = DEFAULT_ACTIVE_ANCHOR_OFFSET,
  rootAnchorId = 0,
  getAnchorOffsetTop = () => undefined
} = {}) {
  const thresholdTop = Math.max(0, toFiniteNumber(scrollTop)) + Math.max(0, toFiniteNumber(scrollOffset))
  let activeAnchorId = rootAnchorId
  const seenAnchors = new Set()

  for (const anchorId of Array.isArray(anchors) ? anchors : []) {
    if (anchorId === null || anchorId === undefined || anchorId === false || anchorId === 0 || anchorId === '0') {
      continue
    }

    if (seenAnchors.has(anchorId)) {
      continue
    }

    seenAnchors.add(anchorId)

    const resolvedOffsetTop = Number(getAnchorOffsetTop(anchorId))

    if (!Number.isFinite(resolvedOffsetTop)) {
      continue
    }

    if (thresholdTop >= resolvedOffsetTop) {
      activeAnchorId = anchorId
    }
  }

  return activeAnchorId
}