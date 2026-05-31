export const ANCHOR_SCROLL_EXTRA_BOTTOM_PROPERTY = '--d-anchor-scroll-extra-bottom'

const toFiniteNumber = (value) => {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

export function getAnchorScrollMaxTop ({ scrollHeight = 0, clientHeight = 0 } = {}) {
  return Math.max(0, toFiniteNumber(scrollHeight) - toFiniteNumber(clientHeight))
}

export function getAnchorScrollExtraBottom ({ offsetTop = 0, scrollHeight = 0, clientHeight = 0, currentExtraBottom = 0 } = {}) {
  const baseScrollHeight = Math.max(0, toFiniteNumber(scrollHeight) - Math.max(0, toFiniteNumber(currentExtraBottom)))
  const maxScrollTop = getAnchorScrollMaxTop({ scrollHeight: baseScrollHeight, clientHeight })
  return Math.ceil(Math.max(0, toFiniteNumber(offsetTop) - maxScrollTop))
}

export function setAnchorScrollExtraBottom (target, value = 0) {
  if (typeof HTMLElement === 'undefined') {
    return
  }

  if (!(target instanceof HTMLElement)) {
    return
  }

  const extraBottom = Math.max(0, Math.ceil(toFiniteNumber(value)))

  if (extraBottom > 0) {
    target.style.setProperty(ANCHOR_SCROLL_EXTRA_BOTTOM_PROPERTY, `${extraBottom}px`)
    return
  }

  target.style.removeProperty(ANCHOR_SCROLL_EXTRA_BOTTOM_PROPERTY)
}
