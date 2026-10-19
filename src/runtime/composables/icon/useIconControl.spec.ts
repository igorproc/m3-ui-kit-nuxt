import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { useIconControl } from './useIconControl'
import type { IconControlProps, UseIconControlReturn } from './useIconControl'

function createHarness(props: IconControlProps) {
  let control: UseIconControlReturn | null = null

  const component = defineComponent({
    setup() {
      control = useIconControl(props)

      return () => h('i', { ...control!.rootAttrs.value }, [
        h('b', { ...control!.glyphAttrs }, control!.glyph.value),
      ])
    },
  })

  return { component, getControl: () => control! }
}

describe('useIconControl', () => {
  it('hides a decorative icon and its glyph on anonymous markup', async () => {
    const { component } = createHarness({ name: 'home', filled: false })

    const wrapper = await mountSuspended(component)

    expect(wrapper.find('i').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('i').attributes('role')).toBeUndefined()
    expect(wrapper.find('b').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('b').attributes('focusable')).toBe('false')
    expect(wrapper.find('b').text()).toBe('ic:outline-home')
  })

  it('names a labelled icon as an image', async () => {
    const { component } = createHarness({ name: 'error', filled: false, label: 'Error' })

    const wrapper = await mountSuspended(component)

    expect(wrapper.find('i').attributes('role')).toBe('img')
    expect(wrapper.find('i').attributes('aria-label')).toBe('Error')
    expect(wrapper.find('i').attributes('aria-hidden')).toBeUndefined()
  })

  it('tracks a reactive props object', async () => {
    const props = reactive<IconControlProps>({ name: 'home', filled: false })
    const { component } = createHarness(props)

    const wrapper = await mountSuspended(component)

    props.filled = true
    props.label = 'Home'
    await nextTick()

    expect(wrapper.find('b').text()).toBe('ic:baseline-home')
    expect(wrapper.find('i').attributes('role')).toBe('img')

    props.label = undefined
    await nextTick()

    expect(wrapper.find('i').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('i').attributes('role')).toBeUndefined()
  })

  it('produces no classes and no data attributes — presentation stays with the consumer', async () => {
    for (const label of [undefined, 'Home']) {
      const { component, getControl } = createHarness({ name: 'home', filled: false, label })

      await mountSuspended(component)

      for (const bag of [getControl().rootAttrs.value, getControl().glyphAttrs]) {
        for (const key of Object.keys(bag)) {
          expect(key).not.toBe('class')
          expect(key.startsWith('data-')).toBe(false)
        }
      }
    }
  })
})
