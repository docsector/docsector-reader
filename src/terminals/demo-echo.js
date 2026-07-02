/**
 * Built-in demo terminal engine.
 *
 * It has no runtime dependency: it just echoes the command back with some
 * ANSI-colored, paced output. It exists to document and exercise the
 * `<d-block-terminal>` engine contract that consumer projects implement
 * under `src/terminals/**\/*.js`.
 */

export const meta = {
  label: 'Echo demo (built-in)',
  language: 'bash'
}

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function createEngine ({ onOutput, onStatus }) {
  let stopped = false

  return {
    async run (command, { columns = 80, rows = 24 } = {}) {
      const input = String(command || '').trim() || 'echo Hello, Docsector!'
      const message = input.replace(/^echo\s+/i, '')
      const started = Date.now()
      stopped = false

      onStatus('running')
      onOutput(`${ANSI.green}${ANSI.bold}$${ANSI.reset} ${input}\r\n\r\n`)

      for (const char of message) {
        if (stopped) {
          return 130
        }
        onOutput(`${ANSI.bold}${ANSI.cyan}${char}${ANSI.reset}`)
        await wait(24)
      }
      onOutput('\r\n\r\n')

      const units = 24
      for (let step = 0; step <= units; step++) {
        if (stopped) {
          return 130
        }
        const bar = '#'.repeat(step).padEnd(units, '-')
        const percent = String(Math.round((step / units) * 100)).padStart(3, ' ')
        onOutput(`\r${ANSI.yellow}[${bar}]${ANSI.reset} ${percent}%`)
        await wait(36)
      }

      const elapsed = ((Date.now() - started) / 1000).toFixed(2)
      onOutput(`\r\n\r\n${ANSI.green}done${ANSI.reset} ${ANSI.dim}in ${elapsed}s — ${columns}x${rows} cells${ANSI.reset}\r\n`)

      return 0
    },

    async stop () {
      stopped = true
      onOutput(`\r\n${ANSI.dim}^C${ANSI.reset}\r\n`)
    },

    async source (command) {
      const input = String(command || '').trim() || 'echo Hello, Docsector!'

      return {
        text: [
          '# The demo-echo engine replays the command with paced ANSI output.',
          '# Consumer engines implement the same contract in src/terminals/*.js:',
          '#   export default async function createEngine ({ onOutput, onError, onStatus })',
          '#     -> { run(command, { columns, rows }), source(command)?, dispose()? }',
          '',
          `$ ${input}`
        ].join('\n'),
        language: 'bash',
        url: ''
      }
    }
  }
}
