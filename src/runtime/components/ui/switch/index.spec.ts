import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSwitch from './index.vue'

describe('m-switch', () => {
  it('renders a label root with a role="switch" input', async () => {
    const wrapper = await mountSuspended(MSwitch)

    expect(wrapper.find('label.ui-switch').exists()).toBe(true)

    const input = wrapper.find('input.ui-switch__input')

    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('checkbox')
    expect(input.attributes('role')).toBe('switch')
  })

  it('renders the label text via the prop', async () => {
    const wrapper = await mountSuspended(MSwitch, {
      props: { label: 'Wi-Fi' },
    })

    expect(wrapper.find('.ui-switch__label').text()).toBe('Wi-Fi')
  })

  it('reflects the checked model in class and aria-checked', async () => {
    const wrapper = await mountSuspended(MSwitch, {
      props: { modelValue: true },
    })

    expect(wrapper.classes()).toContain('ui-switch--checked')
    expect(wrapper.find('input.ui-switch__input').attributes('aria-checked')).toBe('true')
  })

  it('toggles the model on change (update:modelValue)', async () => {
    const wrapper = await mountSuspended(MSwitch, {
      props: { modelValue: false },
    })

    await wrapper.find('input.ui-switch__input').setValue(true)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([true])
  })

  it('applies disabled to the native input and the disabled modifier', async () => {
    const wrapper = await mountSuspended(MSwitch, {
      props: { disabled: true },
    })

    expect(wrapper.find('input.ui-switch__input').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ui-switch--disabled')
  })

  it('forwards path to the input name attribute', async () => {
    const wrapper = await mountSuspended(MSwitch, {
      props: { path: 'wifi' },
    })

    expect(wrapper.find('input.ui-switch__input').attributes('name')).toBe('wifi')
  })
})
