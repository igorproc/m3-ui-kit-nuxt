import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTextField from './index.vue'

describe('m-text-field', () => {
  it('renders the root, default filled variant and a native input', async () => {
    const wrapper = await mountSuspended(MTextField)

    expect(wrapper.find('.ui-text-field').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-text-field--filled')
    expect(wrapper.find('input.ui-text-field__input').exists()).toBe(true)
  })

  it('maps the variant prop to the control modifier', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { variant: 'outlined' },
    })

    expect(wrapper.classes()).toContain('ui-text-field--outlined')
    expect(wrapper.find('.ui-text-field__control--outlined').exists()).toBe(true)
  })

  it('renders the label wired to the input via for/id', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { label: 'Email' },
    })

    const label = wrapper.find('label.ui-text-field__label')
    const input = wrapper.find('input.ui-text-field__input')

    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Email')
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('forwards type and placeholder to the native input', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { type: 'email', placeholder: 'you@mail.com' },
    })

    const input = wrapper.find('input.ui-text-field__input')

    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('placeholder')).toBe('you@mail.com')
  })

  it('updates v-model on input', async () => {
    const wrapper = await mountSuspended(MTextField)
    const input = wrapper.find('input.ui-text-field__input')

    await input.setValue('hello')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['hello'])
  })

  it('reflects a populated model in the control class', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { modelValue: 'preset' },
    })

    expect(wrapper.find('.ui-text-field__control--populated').exists()).toBe(true)
  })

  it('applies disabled to the native input and the disabled modifier', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { disabled: true },
    })

    const input = wrapper.find('input.ui-text-field__input')

    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.ui-text-field__control--disabled').exists()).toBe(true)
  })

  it('applies readonly to the native input', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { readonly: true },
    })

    expect(wrapper.find('input.ui-text-field__input').attributes('readonly')).toBeDefined()
  })

  it('renders helper text and links it via aria-describedby', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { helperText: 'Some hint' },
    })

    const helper = wrapper.find('.ui-text-field__helper')
    const input = wrapper.find('input.ui-text-field__input')

    expect(helper.exists()).toBe(true)
    expect(helper.text()).toBe('Some hint')
    expect(input.attributes('aria-describedby')).toBe(helper.attributes('id'))
  })

  it('renders an error message and marks the input invalid', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { errorMessage: 'Required' },
    })

    const error = wrapper.find('.ui-text-field__error')
    const input = wrapper.find('input.ui-text-field__input')

    expect(error.exists()).toBe(true)
    expect(error.text()).toBe('Required')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.ui-text-field__control--error').exists()).toBe(true)
  })

  it('renders prepend and append slots', async () => {
    const wrapper = await mountSuspended(MTextField, {
      slots: {
        prepend: () => 'P',
        append: () => 'A',
      },
    })

    expect(wrapper.find('.ui-text-field__icon--prepend').exists()).toBe(true)
    expect(wrapper.find('.ui-text-field__icon--append').exists()).toBe(true)
    expect(wrapper.find('.ui-text-field__control--has-prepend').exists()).toBe(true)
    expect(wrapper.find('.ui-text-field__control--has-append').exists()).toBe(true)
  })
})
