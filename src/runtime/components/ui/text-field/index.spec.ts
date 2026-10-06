import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { ValidationAdapter } from '#kit/composables/validation/types'
import MTextField from './index.vue'

describe('m-text-field', () => {
  it('renders the root, default filled variant and a native input', async () => {
    const wrapper = await mountSuspended(MTextField)

    expect(wrapper.find('.ui-text-field').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-text-field--filled')
    expect(wrapper.find('input.ui-text-field__input').exists()).toBe(true)
  })

  it('carries no state modifiers at rest (empty, unfocused, valid)', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { label: 'Email', placeholder: 'you@mail.com' },
    })

    // Any of these at rest would float the label or reveal the placeholder.
    for (const state of ['focused', 'populated', 'error', 'disabled', 'prepend', 'append']) {
      expect(wrapper.classes()).not.toContain(`ui-text-field--${state}`)
    }
  })

  it('maps the variant prop to the root modifier', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { variant: 'outlined' },
    })

    expect(wrapper.classes()).toContain('ui-text-field--outlined')
    expect(wrapper.find('.ui-text-field__control').exists()).toBe(true)
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

  it('reflects a populated model via the populated modifier', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { modelValue: 'preset' },
    })

    expect(wrapper.classes()).toContain('ui-text-field--populated')
  })

  it('applies disabled to the native input and the disabled modifier', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { disabled: true },
    })

    const input = wrapper.find('input.ui-text-field__input')

    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ui-text-field--disabled')
  })

  it('applies readonly to the native input', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { readonly: true },
    })

    expect(wrapper.find('input.ui-text-field__input').attributes('readonly')).toBeDefined()
  })

  it('renders helper text on the support line and links it via aria-describedby', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { helperText: 'Some hint' },
    })

    const support = wrapper.find('.ui-text-field__support')
    const input = wrapper.find('input.ui-text-field__input')

    expect(support.exists()).toBe(true)
    expect(support.classes()).toContain('ui-text-field__support--helper')
    expect(support.text()).toBe('Some hint')
    expect(input.attributes('aria-describedby')).toBe(support.attributes('id'))
  })

  it('renders an error message, marks the input invalid and sets the alert role', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { errorMessage: 'Required' },
    })

    const support = wrapper.find('.ui-text-field__support')
    const input = wrapper.find('input.ui-text-field__input')

    expect(support.exists()).toBe(true)
    expect(support.classes()).toContain('ui-text-field__support--error')
    expect(support.text()).toBe('Required')
    expect(support.attributes('role')).toBe('alert')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.classes()).toContain('ui-text-field--error')
  })

  it('does not announce invalid before the error is shown', async () => {
    // An engine that has already validated silently: invalid meta, no message yet.
    const silentlyInvalid: ValidationAdapter = {
      bindField: <T>() => ({
        value: ref('') as never,
        errorMessage: ref<string | undefined>(undefined),
        meta: { required: true, touched: false, dirty: false, valid: false, validated: true, pending: false } as never,
      }) as never,
      createForm: () => { throw new Error('unused') },
    }
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        provideValidationAdapter(silentlyInvalid)
        return () => h(MTextField, { path: 'email', label: 'Email' })
      },
    }))

    expect(wrapper.find('input.ui-text-field__input').attributes('aria-invalid')).toBeUndefined()
  })

  it('exposes a single root-owned label and applies the rounded tier', async () => {
    const wrapper = await mountSuspended(MTextField, {
      props: { variant: 'outlined', rounded: 'pill', label: 'Email' },
    })

    expect(wrapper.classes()).toContain('ui-text-field--pill')

    // One label, owned by the root — never nested inside the control.
    const control = wrapper.find('.ui-text-field__control')
    expect(control.find('label.ui-text-field__label').exists()).toBe(false)
    expect(wrapper.find('label.ui-text-field__label').text()).toBe('Email')
  })

  it('renders prepend and append slots and flags them via modifiers', async () => {
    const wrapper = await mountSuspended(MTextField, {
      slots: {
        prepend: () => 'P',
        append: () => 'A',
      },
    })

    expect(wrapper.find('.ui-text-field__icon--prepend').exists()).toBe(true)
    expect(wrapper.find('.ui-text-field__icon--append').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-text-field--prepend')
    expect(wrapper.classes()).toContain('ui-text-field--append')
  })
})

async function mount(props: Record<string, unknown> = {}) {
  return mountSuspended(MTextField, { props })
}

describe('m-text-field · axes', () => {
  describe('label placement', () => {
    it('defaults to float, the placement this field shipped with', async () => {
      const wrapper = await mount({ label: 'Name' })

      expect(wrapper.classes()).toContain('ui-text-field--label-float')
    })

    it.each(['top', 'float', 'inset', 'hidden'] as const)('carries %s on the root, independent of the shape', async (placement) => {
      const wrapper = await mount({ label: 'Name', labelPlacement: placement, variant: 'outlined' })

      expect(wrapper.classes()).toContain(`ui-text-field--label-${placement}`)
      expect(wrapper.classes()).toContain('ui-text-field--outlined')
    })

    it('keeps a hidden label in the document, and keeps it associated', async () => {
      const wrapper = await mount({ label: 'Search', labelPlacement: 'hidden' })
      const label = wrapper.find('label.ui-text-field__label')

      expect(label.exists()).toBe(true)
      expect(label.attributes('for')).toBe(wrapper.find('input').attributes('id'))
    })

    it('renders no label element at all when there is no label to place', async () => {
      const wrapper = await mount({ labelPlacement: 'top' })

      expect(wrapper.find('label.ui-text-field__label').exists()).toBe(false)
    })
  })

  describe('density', () => {
    it('defaults to the scale this field shipped with', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-text-field--density-default')
    })

    it.each(['compact', 'default', 'comfortable'] as const)('carries %s on the root', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-text-field--density-${density}`)
    })

    it('is independent of placement — the two axes never collapse into one', async () => {
      const wrapper = await mount({ label: 'Name', density: 'compact', labelPlacement: 'inset' })

      expect(wrapper.classes()).toContain('ui-text-field--density-compact')
      expect(wrapper.classes()).toContain('ui-text-field--label-inset')
    })
  })
})
