/**
 * Menu item separator config normalization.
 *
 * The explicit form spells out where the line sits relative to the item:
 *
 *   menu: {
 *     separators: {
 *       lineTop: true,       // line ABOVE the item
 *       lineBottom: true     // line BELOW the item
 *     }
 *   }
 *
 * A value can also name a thickness variant defined in the menu styles
 * (e.g. `lineBottom: 'page'` or `'list'`).
 *
 * The legacy form stays supported: `separator: true` (or a legacy
 * class-suffix string like `' page'`) always meant a line BELOW the item and
 * normalizes to `lineBottom`. When `separators` is present it wins.
 */

const normalizeSeparatorValue = (value) => {
  if (value === true) {
    return true
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim()
  }

  return null
}

export const normalizeMenuSeparators = (menu = {}) => {
  const separators = menu?.separators

  if (separators && typeof separators === 'object') {
    return {
      lineTop: normalizeSeparatorValue(separators.lineTop),
      lineBottom: normalizeSeparatorValue(separators.lineBottom)
    }
  }

  return {
    lineTop: null,
    lineBottom: normalizeSeparatorValue(menu?.separator)
  }
}

/** CSS class for a normalized separator value (`true` = plain line). */
export const menuSeparatorClass = (value) => {
  return value === true ? 'separator' : `separator ${value}`
}
