import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'
import { provideGlyphFill, useGlyphFill } from './glyphFill'

function createTree(outer: Ref<boolean> | undefined, inner: Ref<boolean> | undefined) {
  const Leaf = defineComponent({
    setup() {
      const filled = useGlyphFill()
      return () => h('i', String(filled.value))
    },
  })
  const Owner = (state: Ref<boolean> | undefined, child: () => unknown) => defineComponent({
    setup() {
      if (state) provideGlyphFill(() => state.value)
      return child
    },
  })

  const Inner = Owner(inner, () => h(Leaf))

  return Owner(outer, () => h(Inner))
}

describe('glyph fill', () => {
  it('is false without an owner', async () => {
    const wrapper = await mountSuspended(createTree(undefined, undefined))

    expect(wrapper.text()).toBe('false')
  })

  it('follows the nearest owner as it changes', async () => {
    const selected = ref(true)
    const wrapper = await mountSuspended(createTree(selected, undefined))

    expect(wrapper.text()).toBe('true')
    selected.value = false
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('false')
  })

  it('lets an unselected owner stop a fill provided further up', async () => {
    const wrapper = await mountSuspended(createTree(ref(true), ref(false)))

    expect(wrapper.text()).toBe('false')
  })
})
