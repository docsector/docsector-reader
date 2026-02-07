#!/usr/bin/env node

/**
 * Docsector Reader CLI
 *
 * Usage:
 *   docsector dev     — Start development server with hot-reload
 *   docsector build   — Build optimized SPA for production
 *   docsector serve   — Serve the production build locally
 *   docsector help    — Show help information
 */

import { execSync, spawn } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')

const args = process.argv.slice(2)
const command = args[0]

const VERSION = '0.1.0'

const HELP = `
  Docsector Reader v${VERSION}
  A documentation rendering engine built with Vue 3, Quasar v2 and Vite.

  Usage:
    docsector <command> [options]

  Commands:
    dev        Start development server with hot-reload (port 8181)
    build      Build optimized SPA for production (output: dist/spa/)
    serve      Serve the production build locally
    version    Show version number
    help       Show this help message

  Options:
    --port <number>   Override dev server port (default: 8181)

  Examples:
    docsector dev
    docsector dev --port 3000
    docsector build
    docsector serve

  Documentation:
    https://github.com/docsector/docsector-reader
`

function findQuasarBin () {
  // Try local node_modules first (user's project)
  const localBin = resolve(process.cwd(), 'node_modules', '.bin', 'quasar')
  if (existsSync(localBin)) return localBin

  // Try package's own node_modules
  const pkgBin = resolve(packageRoot, 'node_modules', '.bin', 'quasar')
  if (existsSync(pkgBin)) return pkgBin

  // Fall back to npx
  return 'npx quasar'
}

function run (cmd, cmdArgs = []) {
  const quasar = findQuasarBin()
  const isNpx = quasar.startsWith('npx')

  const spawnCmd = isNpx ? 'npx' : quasar
  const spawnArgs = isNpx ? ['quasar', cmd, ...cmdArgs] : [cmd, ...cmdArgs]

  const child = spawn(spawnCmd, spawnArgs, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DOCSECTOR_ROOT: packageRoot
    }
  })

  child.on('close', (code) => {
    process.exit(code)
  })

  child.on('error', (err) => {
    console.error(`Error running docsector ${cmd}:`, err.message)
    process.exit(1)
  })
}

switch (command) {
  case 'dev': {
    const portIdx = args.indexOf('--port')
    const extraArgs = []
    if (portIdx !== -1 && args[portIdx + 1]) {
      extraArgs.push('--port', args[portIdx + 1])
    }
    run('dev', extraArgs)
    break
  }

  case 'build':
    run('build', args.slice(1))
    break

  case 'serve':
    run('serve', ['dist/spa', '--history', ...args.slice(1)])
    break

  case 'version':
  case '-v':
  case '--version':
    console.log(`docsector v${VERSION}`)
    break

  case 'help':
  case '-h':
  case '--help':
  case undefined:
    console.log(HELP)
    break

  default:
    console.error(`Unknown command: "${command}"`)
    console.log(HELP)
    process.exit(1)
}
