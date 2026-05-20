// @ Import i18n message builder
import { buildMessages } from './helpers'
import homePageOverride from 'virtual:docsector-homepage-override'

// @ Import language HJSON files (Vite-compatible eager import)
const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
// @ Import markdown files (Vite-compatible eager import as raw strings)
const currentMdModules = import.meta.glob('../pages/**/*.md', { eager: true, query: '?raw', import: 'default' })
const oldMdModules = import.meta.glob('../pages/.old/**/*.md', { eager: true, query: '?raw', import: 'default' })
const mdModules = { ...currentMdModules, ...oldMdModules }

// @ Import pages
import boot from 'pages/boot'
import { books, pageEntries } from 'virtual:docsector-books'

export default buildMessages({ langModules, mdModules, books, pageEntries, boot, homePageOverride })
