import { describe, expect, it } from 'vitest'

import { THEME_INLINE_SCRIPT } from '../src/theme.inline.js'
import {
  DEFAULT_THEME,
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  THEMES,
  fromDarkValue,
  persistTheme,
  resolveStoredTheme,
  toDarkValue
} from '../src/theme.js'

const createStorage = (values = {}) => {
  const store = { ...values }

  return {
    store,
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] }
  }
}

const throwingStorage = () => ({
  getItem: () => { throw new Error('SecurityError') },
  setItem: () => { throw new Error('QuotaExceededError') }
})

/**
 * Run the inline script against fake globals.
 *
 * The three parameters shadow the real globals inside the script body, so it
 * can never reach node's actual environment.
 */
const runInlineScript = ({ values = {}, prefersDark = false } = {}) => {
  const classes = new Set()
  const storage = createStorage(values)
  const writes = []

  const localStorage = {
    getItem: storage.getItem,
    setItem: (key, value) => { writes.push([key, value]) }
  }
  const win = {
    localStorage,
    matchMedia: (query) => ({
      matches: query.includes('prefers-color-scheme: dark') ? prefersDark : false,
      addListener () {},
      removeListener () {}
    })
  }
  const doc = {
    body: {
      classList: {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
        contains: (name) => classes.has(name)
      }
    }
  }

  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'localStorage', THEME_INLINE_SCRIPT)(win, doc, localStorage)

  return { classes, writes }
}

// The single source of truth for the migration rule. Both implementations —
// the resolver and the inline script — are asserted against it, so neither can
// drift from the other.
const MATRIX = [
  { name: 'no stored keys → auto', values: {}, theme: 'auto' },
  {
    name: 'the current key wins over the legacy one',
    values: { [THEME_STORAGE_KEY]: '__q_strn|light', [LEGACY_THEME_STORAGE_KEY]: '__q_bool|1' },
    theme: 'light'
  },
  { name: 'explicit dark', values: { [THEME_STORAGE_KEY]: '__q_strn|dark' }, theme: 'dark' },
  { name: 'explicit auto', values: { [THEME_STORAGE_KEY]: '__q_strn|auto' }, theme: 'auto' },
  {
    name: 'legacy true → dark (only reachable by an explicit click)',
    values: { [LEGACY_THEME_STORAGE_KEY]: '__q_bool|1' },
    theme: 'dark'
  },
  {
    name: 'legacy false → auto (indistinguishable from never having chosen)',
    values: { [LEGACY_THEME_STORAGE_KEY]: '__q_bool|0' },
    theme: 'auto'
  },
  {
    name: 'unrecognized theme value → auto',
    values: { [THEME_STORAGE_KEY]: '__q_strn|purple' },
    theme: 'auto'
  },
  {
    name: 'unencoded legacy value → auto',
    values: { [LEGACY_THEME_STORAGE_KEY]: 'true' },
    theme: 'auto'
  }
]

describe('theme storage contract', () => {
  it('keeps the storage keys stable', () => {
    // ? these are a contract with browsers that already have a value stored
    expect(THEME_STORAGE_KEY).toBe('setting.theme')
    expect(LEGACY_THEME_STORAGE_KEY).toBe('setting.background')
    expect(THEMES).toEqual(['auto', 'light', 'dark'])
    expect(DEFAULT_THEME).toBe('auto')
  })
})

describe('theme resolution', () => {
  for (const testCase of MATRIX) {
    it(testCase.name, () => {
      expect(resolveStoredTheme({ storage: createStorage(testCase.values) })).toBe(testCase.theme)
    })
  }

  it('falls back to the default when storage throws', () => {
    expect(resolveStoredTheme({ storage: throwingStorage() })).toBe('auto')
    expect(resolveStoredTheme()).toBe('auto')
  })
})

describe('theme ↔ Quasar Dark value mapping', () => {
  it('maps themes to what Dark.set() expects', () => {
    expect(toDarkValue('dark')).toBe(true)
    expect(toDarkValue('light')).toBe(false)
    // ? the string 'auto' is what wires Quasar's prefers-color-scheme listener
    expect(toDarkValue('auto')).toBe('auto')
    expect(toDarkValue('nonsense')).toBe('auto')
  })

  it('maps Dark.mode back to a theme', () => {
    expect(fromDarkValue(true)).toBe('dark')
    expect(fromDarkValue(false)).toBe('light')
    expect(fromDarkValue('auto')).toBe('auto')
  })

  it('round-trips every theme', () => {
    for (const theme of THEMES) {
      expect(fromDarkValue(toDarkValue(theme))).toBe(theme)
    }
  })
})

describe('theme persistence', () => {
  it('writes the Quasar string encoding', () => {
    const storage = createStorage()

    expect(persistTheme('dark', { storage })).toBe('dark')
    expect(storage.store[THEME_STORAGE_KEY]).toBe('__q_strn|dark')
  })

  it('coerces an unrecognized theme to the default', () => {
    const storage = createStorage()

    expect(persistTheme('purple', { storage })).toBe('auto')
    expect(storage.store[THEME_STORAGE_KEY]).toBe('__q_strn|auto')
  })

  it('does not throw when storage refuses to write', () => {
    expect(() => persistTheme('dark', { storage: throwingStorage() })).not.toThrow()
    expect(persistTheme('dark', { storage: throwingStorage() })).toBe('dark')
  })
})

describe('inline pre-paint script', () => {
  for (const testCase of MATRIX) {
    for (const prefersDark of [true, false]) {
      it(`${testCase.name} (OS dark: ${prefersDark})`, () => {
        const expectDark = testCase.theme === 'dark' || (testCase.theme === 'auto' && prefersDark)
        const { classes } = runInlineScript({ values: testCase.values, prefersDark })

        expect(classes.has('body--dark')).toBe(expectDark)
        expect(classes.has('body--light')).toBe(!expectDark)
      })
    }
  }

  it('never writes to storage — theme-init.js owns the migration write', () => {
    const { writes } = runInlineScript({ values: { [LEGACY_THEME_STORAGE_KEY]: '__q_bool|1' } })

    expect(writes).toEqual([])
  })

  it('stays silent when storage throws', () => {
    const classes = new Set()
    const win = {
      localStorage: { getItem: () => { throw new Error('SecurityError') } },
      matchMedia: () => ({ matches: true })
    }
    const doc = {
      body: {
        classList: {
          add: (...names) => names.forEach((name) => classes.add(name)),
          remove: (...names) => names.forEach((name) => classes.delete(name))
        }
      }
    }

    // eslint-disable-next-line no-new-func
    const run = () => new Function('window', 'document', THEME_INLINE_SCRIPT)(win, doc)

    expect(run).not.toThrow()
    expect(classes.size).toBe(0)
  })
})
