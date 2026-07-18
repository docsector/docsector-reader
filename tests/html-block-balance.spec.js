import { describe, expect, it } from 'vitest'

import { balanceHtmlBlock } from '../src/components/page-section-tokens.js'

describe('balanceHtmlBlock', () => {
  it('closes tags the author left open (split CommonMark html blocks)', () => {
    expect(balanceHtmlBlock('<div align="right">\n')).toBe('<div align="right">\n</div>')
    expect(balanceHtmlBlock('<div><span>text')).toBe('<div><span>text</span></div>')
  })

  it('drops orphan closing tags', () => {
    expect(balanceHtmlBlock('</div>\n')).toBe('\n')
    expect(balanceHtmlBlock('text</span> tail')).toBe('text tail')
  })

  it('implicitly closes inner tags on an outer close, like the parser', () => {
    expect(balanceHtmlBlock('<div><span></div>')).toBe('<div><span></span></div>')
  })

  it('leaves balanced markup, void elements and comments untouched', () => {
    expect(balanceHtmlBlock('<p align="center"><img src="x.png"><br></p>')).toBe('<p align="center"><img src="x.png"><br></p>')
    expect(balanceHtmlBlock('<a href="#top"><img src="b.svg" alt="badge"></a>')).toBe('<a href="#top"><img src="b.svg" alt="badge"></a>')
    expect(balanceHtmlBlock('<!-- note --><hr>')).toBe('<!-- note --><hr>')
    expect(balanceHtmlBlock('plain text, no tags')).toBe('plain text, no tags')
  })

  it('handles self-closing syntax and quoted ">" in attributes', () => {
    expect(balanceHtmlBlock('<x-widget data-x="a>b"/>')).toBe('<x-widget data-x="a>b"/>')
    expect(balanceHtmlBlock('<div title="a>b">')).toBe('<div title="a>b"></div>')
  })
})
