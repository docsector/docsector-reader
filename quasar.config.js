/* eslint-env node */

import { configure } from 'quasar/wrappers'
import { createQuasarConfig } from './src/quasar.factory.js'

export default configure((/* ctx */) => {
  return createQuasarConfig({
    projectRoot: import.meta.dirname
  })
})
