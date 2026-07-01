import { fileURLToPath } from 'node:url'

import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      'tmp/**',
    ],
  },
  resolve: {
    alias: {
      // The app provides `docsector.config.js` via a Vite alias to the project
      // root config; mirror it here so composables that import it are testable.
      'docsector.config.js': fileURLToPath(new URL('./docsector.config.js', import.meta.url)),
    },
  },
})
