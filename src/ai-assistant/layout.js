export const DEFAULT_TOC_WIDTH = 308
export const DEFAULT_RIGHT_GAP = 24
export const DEFAULT_MIN_CONTENT_WIDTH = 680
export const DEFAULT_MOBILE_BREAKPOINT = 768

function toWidth (value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(0, Math.round(number))
}

export function getAssistantRightRailState ({
  tocOpen = false,
  assistantOpen = false,
  screenWidth = 1440,
  tocWidth = DEFAULT_TOC_WIDTH,
  assistantWidth = 380,
  gap = DEFAULT_RIGHT_GAP,
  minContentWidth = DEFAULT_MIN_CONTENT_WIDTH,
  mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT
} = {}) {
  const width = toWidth(screenWidth, 1440)
  const isMobile = width < mobileBreakpoint
  const normalizedTocWidth = toWidth(tocWidth, DEFAULT_TOC_WIDTH)
  const normalizedAssistantWidth = toWidth(assistantWidth, 380)
  const normalizedGap = toWidth(gap, DEFAULT_RIGHT_GAP)

  if (isMobile) {
    return {
      isMobile,
      showToc: tocOpen,
      showAssistant: assistantOpen,
      tocWidth: 0,
      assistantWidth: 0,
      totalWidth: 0,
      backToTopRightOffset: `${normalizedGap}px`
    }
  }

  const requestedWidth = (tocOpen ? normalizedTocWidth : 0) + (assistantOpen ? normalizedAssistantWidth : 0)
  const canShowBoth = !tocOpen || !assistantOpen || (width - requestedWidth >= minContentWidth)
  const showToc = tocOpen && (canShowBoth || !assistantOpen)
  const showAssistant = assistantOpen
  const totalWidth = (showToc ? normalizedTocWidth : 0) + (showAssistant ? normalizedAssistantWidth : 0)
  const backOffset = totalWidth > 0 ? totalWidth + normalizedGap : normalizedGap

  return {
    isMobile,
    showToc,
    showAssistant,
    tocWidth: showToc ? normalizedTocWidth : 0,
    assistantWidth: showAssistant ? normalizedAssistantWidth : 0,
    totalWidth,
    backToTopRightOffset: `${backOffset}px`
  }
}
