import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { useTextFieldControl } from './useTextFieldControl'
import type { TextFieldControlProps } from './useTextFieldControl'

type Control = ReturnType<typeof useTextFieldControl>

/**
 * Mounts the attr bags onto anonymous markup — no kit component, no kit class
 * names. Anything asserted here is behavior the bags carry on their own.
 */
function createHarness(model: Ref<string>, props: TextFieldControlProps = {}) {
  let control: Control | null = null
  const focused = ref(false)

  const component = defineComponent({
    setup() {
      control = useTextFieldControl(model, focused, props, 'harness')

      return () => h('div', [
        h('label', control!.labelAttrs.value, 'Email'),
        props.prefix ? h('span', control!.prefixAttrs.value, props.prefix) : null,
        h('input', { ...control!.inputAttrs.value, value: model.value }),
        props.suffix ? h('span', control!.suffixAttrs.value, props.suffix) : null,
        h('p', control!.supportAttrs.value, [
          h('b', control!.alertAttrs.value, control!.isError.value ? control!.message.value : ''),
          control!.isError.value ? null : control!.message.value,
        ]),
      ])
    },
  })

  return { component, focused, getControl: () => control! }
}

describe('useTextFieldControl', () => {
  it('wires a label and a description to markup it knows nothing about', async () => {
    const { component } = createHarness(ref(''), { helperText: 'Work address' })

    const wrapper = await mountSuspended(component)
    const input = wrapper.find('input')

    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toBe(wrapper.find('p').attributes('id'))
  })

  it('describes the input with its affixes after the message', async () => {
    const { component } = createHarness(ref(''), { helperText: 'Hint', prefix: '$', suffix: 'USD' })

    const wrapper = await mountSuspended(component)

    expect(wrapper.find('input').attributes('aria-describedby')).toBe('harness-support harness-prefix harness-suffix')
  })

  it('leaves unset attributes out of the bag instead of setting them to undefined', async () => {
    const { getControl, component } = createHarness(ref(''))

    await mountSuspended(component)
    const keys = Object.keys(getControl().inputAttrs.value)

    for (const key of ['aria-busy', 'aria-invalid', 'aria-describedby', 'disabled', 'readonly', 'required']) {
      expect(keys).not.toContain(key)
    }
  })

  it('tracks a reactive props object without any getter plumbing', async () => {
    const props = reactive<TextFieldControlProps>({ required: false })
    const { component } = createHarness(ref(''), props)

    const wrapper = await mountSuspended(component)
    expect(wrapper.find('input').attributes('aria-required')).toBeUndefined()

    props.required = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('input').attributes('aria-required')).toBe('true')
  })

  it('writes the error into the persistent alert region and marks the input invalid', async () => {
    const { component } = createHarness(ref(''), { helperText: 'Hint', errorMessage: 'Taken' })

    const wrapper = await mountSuspended(component)

    expect(wrapper.find('[role="alert"]').text()).toBe('Taken')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('flips the focus model from the input', async () => {
    const { component, focused } = createHarness(ref(''))

    const wrapper = await mountSuspended(component)
    await wrapper.find('input').trigger('focus')
    expect(focused.value).toBe(true)

    await wrapper.find('input').trigger('blur')
    expect(focused.value).toBe(false)
  })

  it('produces no classes and no data attributes — presentation stays with the consumer', async () => {
    const { getControl, component } = createHarness(ref('a'), { helperText: 'Hint', prefix: '$', suffix: '%', required: true })

    await mountSuspended(component)
    const control = getControl()

    for (const bag of [control.inputAttrs, control.labelAttrs, control.supportAttrs, control.alertAttrs, control.prefixAttrs, control.suffixAttrs]) {
      const keys = Object.keys(bag.value)
      expect(keys).not.toContain('class')
      expect(keys.filter(key => key.startsWith('data-'))).toHaveLength(0)
    }
  })
})
