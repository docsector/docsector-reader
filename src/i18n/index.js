// @ Import i18n message builder
import { buildMessages } from './helpers'
import homePageOverride from 'virtual:docsector-homepage-override'

// @ Import language HJSON files (Vite-compatible eager import)
const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
// @ Import markdown files (lazy raw imports — loaded per page at navigation time)
const currentMdModules = import.meta.glob('../pages/**/*.md', { query: '?raw', import: 'default' })
const oldMdModules = import.meta.glob('../pages/.old/**/*.md', { query: '?raw', import: 'default' })
const mdModules = { ...currentMdModules, ...oldMdModules }
// @ Import homepage markdown eagerly (root route content must be ready at boot)
const homepageModules = import.meta.glob('../pages/Homepage.*.md', { eager: true, query: '?raw', import: 'default' })

// @ Import pages
import boot from 'pages/boot'
import { books, pageEntries } from 'virtual:docsector-books'

export default buildMessages({ langModules, mdModules, homepageModules, books, pageEntries, boot, homePageOverride })
