import { boot } from 'quasar/wrappers'

import iconMap from 'virtual:docsector-icons'

/**
 * Resolve dynamic material icon names (from configs and markdown blocks) to
 * the tree-shaken SVG subset generated at build time — no icon webfont.
 * Quasar's own component icons come from the svg-material-icons icon set.
 */
export default boot(({ app }) => {
  const $q = app.config.globalProperties.$q

  $q.iconMapFn = (iconName) => {
    const icon = iconMap[iconName]

    if (icon !== undefined) {
      return { icon }
    }

    if (process.env.DEV) {
      console.warn(`[docsector] Unknown icon name: "${iconName}" — add it to docsector.config.js icons.include`)
    }
  }
})
