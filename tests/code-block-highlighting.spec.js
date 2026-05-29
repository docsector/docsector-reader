import { describe, expect, it } from 'vitest'

import Prism from '../src/components/code-block-highlighting.js'

describe('code-block-highlighting', () => {
  it('registers Prism Vue grammar for full SFC tabs', () => {
    const source = `<template>
  <div class="notice">{{ message }}</div>
</template>

<script>
export default {
  data () {
    return {
      message: 'Hello'
    }
  }
}
</script>

<style scoped>
.notice {
  color: #1976d2;
}
</style>`

    expect(Prism.languages.vue).toBeTruthy()

    const highlighted = Prism.highlight(source, Prism.languages.vue, 'vue')

    expect(highlighted).toContain('token tag')
    expect(highlighted).toContain('token keyword')
    expect(highlighted).toContain('token selector')
  })
})