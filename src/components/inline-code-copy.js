export const INLINE_CODE_COPY_ATTRIBUTE = 'data-docsector-inline-code-copy'
export const INLINE_CODE_COPY_CLASS = 'd-copyable-inline-code'
export const INLINE_CODE_COPY_SELECTOR = `[${INLINE_CODE_COPY_ATTRIBUTE}]`

export const installInlineCodeCopyRenderer = (markdown) => {
  const originalRender = markdown.renderer.rules.code_inline

  markdown.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
    const token = tokens[idx]

    token.attrJoin('class', INLINE_CODE_COPY_CLASS)
    token.attrSet(INLINE_CODE_COPY_ATTRIBUTE, '')
    token.attrSet('role', 'button')
    token.attrSet('tabindex', '0')

    if (typeof originalRender === 'function') {
      return originalRender(tokens, idx, options, env, self)
    }

    return `<code${self.renderAttrs(token)}>${markdown.utils.escapeHtml(token.content)}</code>`
  }

  return markdown
}

export const decorateInlineCodeCopyTargets = (container, label = '') => {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return
  }

  const normalizedLabel = String(label || '').trim()

  container.querySelectorAll(INLINE_CODE_COPY_SELECTOR).forEach((element) => {
    if (normalizedLabel) {
      element.setAttribute('title', normalizedLabel)

      // ? The accessible name must contain the visible text (WCAG 2.5.3 /
      //   label-content-name-mismatch) — prepend the code itself
      const visibleText = String(element.textContent || '').trim()
      element.setAttribute(
        'aria-label',
        visibleText ? `${visibleText} — ${normalizedLabel}` : normalizedLabel
      )
    }
  })
}

export const getInlineCodeCopyTarget = (target, container) => {
  const element = target?.nodeType === 3 ? target.parentElement : target

  if (!element || typeof element.closest !== 'function') {
    return null
  }

  const code = element.closest(INLINE_CODE_COPY_SELECTOR)
  if (!code) {
    return null
  }

  if (container && typeof container.contains === 'function' && !container.contains(code)) {
    return null
  }

  return code
}
