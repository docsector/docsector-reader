import { describe, expect, it } from 'vitest'

import {
  canCreateCodepenPayload,
  createCodeExampleTabs,
  createCodeExampleGitHubUrl,
  createCodepenPayload,
  getCodepenUnsupportedReason,
  parseVueSfcParts
} from '../src/components/code-example-source.js'

const codepenReadySource = `<template>
  <div class="demo-counter q-pa-md">
    <q-btn color="primary" :label="label" @click="count++" />
  </div>
</template>

<script>
import { computed, ref } from 'vue'

export default {
  setup () {
    const count = ref(0)
    const label = computed(() => 'Count: ' + count.value)

    return {
      count,
      label
    }
  }
}
</script>

<style scoped>
.demo-counter {
  display: flex;
  justify-content: center;
}
</style>`

const nestedTemplateSource = `<template>
  <div class="inline-notice-example q-pa-md">
    <q-banner rounded class="inline-notice-example__banner">
      <template #avatar>
        <q-icon name="tips_and_updates" color="primary"></q-icon>
      </template>

      <div class="text-weight-medium">{{ title }}</div>
      <div class="text-body2">{{ message }}</div>

      <template #action>
        <q-btn flat color="primary" label="Dismiss" @click="dismiss"></q-btn>
      </template>
    </q-banner>

    <div v-if="dismissed" class="inline-notice-example__status text-caption">
      The notice was dismissed.
    </div>
  </div>
</template>

<script>
export default {}
</script>`

describe('code-example-source', () => {
  it('parses Vue SFC sections into display parts', () => {
    const parts = parseVueSfcParts(codepenReadySource)

    expect(parts.Template).toContain('<template>')
    expect(parts.Template).toContain('<q-btn')
    expect(parts.Script).toContain('export default')
    expect(parts.Style).toContain('.demo-counter')
  })

  it('creates source tabs for each SFC section and the full source', () => {
    const tabs = createCodeExampleTabs(codepenReadySource)

    expect(tabs.map((tab) => tab.label)).toEqual(['Template', 'Script', 'Style', 'All'])
    expect(tabs[0]).toMatchObject({ language: 'html' })
    expect(tabs[1]).toMatchObject({ language: 'javascript' })
    expect(tabs[2]).toMatchObject({ language: 'css' })
    expect(tabs[3]).toMatchObject({ language: 'vue' })
    expect(tabs[3].text).toContain('<script>')
  })

  it('keeps the full root template when nested slot templates exist', () => {
    const parts = parseVueSfcParts(nestedTemplateSource)

    expect(parts.Template).toContain('<template #avatar>')
    expect(parts.Template).toContain('<template #action>')
    expect(parts.Template).toContain('The notice was dismissed.')
    expect(parts.Template.trim().endsWith('</template>')).toBe(true)
  })

  it('creates a CodePen payload for compatible Options API examples', () => {
    const payload = createCodepenPayload(codepenReadySource, {
      title: 'Basic counter',
      quasarVersion: '2.16.6',
      sourceUrl: 'https://example.com/manual/code-examples'
    })

    expect(payload.title).toBe('Basic counter')
    expect(payload.html).toContain('<div id="q-app"')
    expect(payload.html).toContain('<q-btn')
    expect(payload.html).toContain('https://example.com/manual/code-examples')
    expect(payload.css).toContain('.demo-counter')
    expect(payload.css_pre_processor).toBe('none')
    expect(payload.css_external).toContain('quasar@2.16.6')
    expect(payload.js).toContain('const { computed, ref } = Vue')
    expect(payload.js).toContain('const __CodeExample = {')
    expect(payload.js).toContain('Vue.createApp(__CodeExample)')
    expect(payload.js).toContain('app.use(Quasar, { config: {} })')
    expect(payload.js_external).toContain('quasar@2.16.6')
    expect(payload.editors).toBe('111')
  })

  it('rejects script setup for the first CodePen implementation', () => {
    const source = `<template><q-btn label="Click" /></template>
<script setup>
const label = 'Click'
</script>`

    expect(canCreateCodepenPayload(source)).toBe(false)
    expect(getCodepenUnsupportedReason(source)).toContain('script setup')
  })

  it('rejects local imports in CodePen payloads', () => {
    const source = `<template><DemoWidget /></template>
<script>
import DemoWidget from './DemoWidget.vue'

export default {
  components: { DemoWidget }
}
</script>`

    expect(canCreateCodepenPayload(source)).toBe(false)
    expect(getCodepenUnsupportedReason(source)).toContain('local or external imports')
  })

  it('creates GitHub source URLs from editBaseUrl and virtual file paths', () => {
    expect(createCodeExampleGitHubUrl('/src/examples/manual/code-examples/BasicCounter.vue', {
      github: {
        editBaseUrl: 'https://github.com/docsector/docsector-reader/edit/main/src/pages'
      }
    })).toBe('https://github.com/docsector/docsector-reader/blob/main/src/examples/manual/code-examples/BasicCounter.vue')
  })

  it('falls back to links.github for GitHub source URLs', () => {
    expect(createCodeExampleGitHubUrl('src/examples/manual/code-examples/BasicCounter.vue', {
      links: {
        github: 'https://github.com/docsector/docsector-reader/'
      }
    })).toBe('https://github.com/docsector/docsector-reader/blob/main/src/examples/manual/code-examples/BasicCounter.vue')
  })
})