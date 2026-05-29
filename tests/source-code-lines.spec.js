import { describe, expect, it } from 'vitest'

import { countRenderedCodeLines } from '../src/components/source-code-lines.js'

describe('source-code-lines', () => {
  it('counts every visible line when the source has no trailing newline', () => {
    expect(countRenderedCodeLines('line 1\nline 2\nline 3')).toBe(3)
  })

  it('ignores a single terminal newline that does not render as an extra code line', () => {
    expect(countRenderedCodeLines('line 1\nline 2\n')).toBe(2)
  })

  it('keeps intentional trailing blank lines beyond the terminal break', () => {
    expect(countRenderedCodeLines('line 1\n\n')).toBe(2)
  })

  it('normalizes CRLF source files before counting visible lines', () => {
    expect(countRenderedCodeLines('line 1\r\nline 2\r\nline 3')).toBe(3)
  })

  it('counts a single blank line as one rendered line', () => {
    expect(countRenderedCodeLines('\n')).toBe(1)
  })
})