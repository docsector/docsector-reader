// @ Import i18n message builder
import { buildMessages } from './helpers'
import homePageOverride from 'virtual:docsector-homepage-override'

// @ Import language HJSON files (Vite-compatible eager import)
const langModules = import.meta.glob('./languages/*.hjson', { eager: true })
// @ Import markdown files (Vite-compatible eager import as raw strings)
const mdModules = import.meta.glob('../pages/**/*.md', { eager: true, query: '?raw', import: 'default' })

// @ Import pages
import boot from 'pages/boot'
import pages from 'pages'

export default buildMessages({ langModules, mdModules, pages, boot, homePageOverride })
