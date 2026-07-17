import Prism from 'prismjs'

// ? Prism's language components are CommonJS side-effect scripts that read the
//   GLOBAL `Prism` — they never import the core. This bridge module turns that
//   implicit contract into a real ESM dependency edge: importing it before any
//   `prismjs/components/*` guarantees the core has executed (and attached its
//   global) first, no matter how the bundler splits the chunks.
if (typeof window !== 'undefined' && window.Prism === undefined) {
  window.Prism = Prism
}

export default Prism
