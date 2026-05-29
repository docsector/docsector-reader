import Prism from 'prismjs'

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