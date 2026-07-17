// ! The bridge import MUST come first: it guarantees the Prism core (and its
//   global) is live before the CommonJS language components below execute
import Prism from './prism-core-global.js'

import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-bash'

if (!Prism.languages.vue && Prism.languages.markup?.tag?.addInlined) {
	Prism.languages.markup.tag.addInlined('script', 'javascript')
	Prism.languages.markup.tag.addInlined('style', 'css')
	Prism.languages.vue = Prism.languages.markup
}

export default Prism