import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MCheckbox from './index.vue'

describe('m-checkbox', () => {
  it('renders a label root with a native checkbox', async () => {
    const wrapper = await mountSuspended(MCheckbox)

    expect(wrapper.find('label.ui-checkbox').exists()).toBe(true)

    const input = wrapper.find('input.ui-checkbox__input')

    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('checkbox')
  })

  it('renders the label text via the prop and exposes it in the default slot', async () => {
    const wrapper = await mountSuspended(MCheckbox, {
      props: { label: 'Accept' },
    })

    expect(wrapper.find('.ui-checkbox__label').text()).toBe('Accept')
  })

  it('reflects the checked model in class and aria-checked', async () => {
    const wrapper = await mountSuspended(MCheckbox, {
      props: { modelValue: true },
    })

    expect(wrapper.classes()).toContain('ui-checkbox--checked')
    expect(wrapper.find('input.ui-checkbox__input').attributes('aria-checked')).toBe('true')
  })

  it('toggles the model on change (update:modelValue)', async () => {
    const wrapper = await mountSuspended(MCheckbox, {
      props: { modelValue: false },
    })

    const input = wrapper.find('input.ui-checkbox__input')
    await input.setValue(true)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([true])
  })

  it('applies disabled to the native input and the disabled modifier', async () => {
    const wrapper = await mountSuspended(MCheckbox, {
      props: { disabled: true },
    })

    expect(wrapper.find('input.ui-checkbox__input').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ui-checkbox--disabled')
  })

  it('forwards path to the input name attribute', async () => {
    const wrapper = await mountSuspended(MCheckbox, {
      props: { path: 'agree' },
    })

    expect(wrapper.find('input.ui-checkbox__input').attributes('name')).toBe('agree')
  })
})
