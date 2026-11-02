import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MTextField from '../index.vue'
import MDropdown from '#kit/components/ui/dropdown/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MTextField, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-text-field · variants', () => {
  describe('defaults', () => {
    it('renders the root, the default filled variant and a native input', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-text-field').exists()).toBe(true)
      expect(wrapper.classes()).toContain('ui-text-field--filled')
      expect(wrapper.find('input.ui-text-field__input').exists()).toBe(true)
    })

    it('carries no state modifiers at rest (empty, unfocused, valid)', async () => {
      const wrapper = await mount({ label: 'Email', placeholder: 'you@mail.com' })

      // Any of these at rest would recolour the field or reserve an icon box.
      for (const state of ['focused', 'populated', 'error', 'disabled', 'prepend', 'append']) {
        expect(wrapper.classes()).not.toContain(`ui-text-field--${state}`)
      }
    })

    it('keeps the label where it is whether or not there is a value — float is a position', async () => {
      const empty = await mountSuspended(MTextField, { props: { label: 'Email' } })
      const filled = await mountSuspended(MTextField, { props: { label: 'Email', modelValue: 'preset' } })

      expect(filled.classes()).toEqual(empty.classes())
      empty.unmount()
      filled.unmount()
    })
  })

  describe('variant', () => {
    it.each(['filled', 'outlined', 'underline'] as const)('maps %s to the root modifier', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-text-field--${variant}`)
      expect(wrapper.find('.ui-text-field__control').exists()).toBe(true)
    })

    it.each([
      ['outlined', true],
      ['filled', false],
      ['underline', false],
    ] as const)('draws the outline fieldset only on outlined (%s → %s)', async (variant, drawn) => {
      const wrapper = await mount({ variant, label: 'Email' })

      expect(wrapper.find('fieldset.ui-text-field__outline').exists()).toBe(drawn)
    })

    it('leaves the notch out of an outline with no label', async () => {
      const wrapper = await mount({ variant: 'outlined' })

      expect(wrapper.find('.ui-text-field__outline').exists()).toBe(true)
      expect(wrapper.find('.ui-text-field__notch').exists()).toBe(false)
    })
  })

  describe('shape', () => {
    it('defaults to the extra-small corner', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-text-field--shape-extra-small')
    })

    it.each(['none', 'extra-small', 'medium', 'large', 'full'] as const)('carries the %s step on the root', async (shape) => {
      const wrapper = await mount({ shape })

      expect(wrapper.classes()).toContain(`ui-text-field--shape-${shape}`)
    })

    it('exposes a single root-owned label and applies the shape step', async () => {
      const wrapper = await mount({ variant: 'outlined', shape: 'full', label: 'Email' })

      expect(wrapper.classes()).toContain('ui-text-field--shape-full')

      // One label, owned by the root — never nested inside the control.
      const control = wrapper.find('.ui-text-field__control')
      expect(control.find('label.ui-text-field__label').exists()).toBe(false)
      expect(wrapper.find('label.ui-text-field__label').text()).toBe('Email')
    })
  })

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

    it('renders no label element at all when there is no label to place', async () => {
      const wrapper = await mount({ labelPlacement: 'top' })

      expect(wrapper.find('label.ui-text-field__label').exists()).toBe(false)
    })

    it('renders the label text, with a decorative asterisk when required', async () => {
      const wrapper = await mount({ label: 'Email', required: true })

      expect(wrapper.find('label.ui-text-field__label').text()).toContain('Email')
      expect(wrapper.find('.ui-text-field__required').text()).toBe('*')
    })

    it('mirrors the asterisk in the notch, which the outline is sized by', async () => {
      const wrapper = await mount({ label: 'Email', required: true, variant: 'outlined' })

      expect(wrapper.find('.ui-text-field__notch-text').text()).toBe('Email *')
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

  describe('type', () => {
    it('defaults to text', async () => {
      const wrapper = await mount()

      expect(wrapper.find('input').attributes('type')).toBe('text')
    })

    it.each(['text', 'email', 'password', 'tel', 'url', 'search'] as const)('passes type %s to the native input', async (type) => {
      const wrapper = await mount({ type })

      expect(wrapper.find('input').attributes('type')).toBe(type)
    })

    it('forwards the placeholder to the native input', async () => {
      const wrapper = await mount({ type: 'email', placeholder: 'you@mail.com' })

      expect(wrapper.find('input').attributes('placeholder')).toBe('you@mail.com')
    })
  })

  describe('affixes', () => {
    it('renders a prefix and a suffix around the value, on the input row', async () => {
      const wrapper = await mount({ label: 'Price', prefix: '$', suffix: 'USD' })

      expect(wrapper.find('.ui-text-field__affix--prefix').text()).toBe('$')
      expect(wrapper.find('.ui-text-field__affix--suffix').text()).toBe('USD')
      expect(wrapper.find('.ui-text-field__row').element.contains(wrapper.find('input').element)).toBe(true)
    })

    it('puts the input straight in the box when there is nothing to share its row', async () => {
      const wrapper = await mount()

      expect(wrapper.find('input').classes()).toContain('ui-text-field__row')
      expect(wrapper.find('.ui-text-field__field').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('renders prepend and append slots and flags them via modifiers', async () => {
      const wrapper = await mount({}, { prepend: () => 'P', append: () => 'A' })

      expect(wrapper.find('.ui-text-field__icon--prepend').exists()).toBe(true)
      expect(wrapper.find('.ui-text-field__icon--append').exists()).toBe(true)
      expect(wrapper.classes()).toContain('ui-text-field--prepend')
      expect(wrapper.classes()).toContain('ui-text-field--append')
    })

    it('puts leading content on the value row and marks the row for it', async () => {
      const wrapper = await mount({}, { 'leading-content': () => 'chip' })

      expect(wrapper.find('.ui-text-field__leading').text()).toBe('chip')
      expect(wrapper.find('.ui-text-field__field').classes()).toContain('ui-text-field__field--leading')
    })

    // A composite's chips and clear button come and go with its value: the slots
    // are added and removed after mount, not decided once.
    it('follows slots that appear and disappear after mount', async () => {
      const shown = ref(false)
      const Host = defineComponent({
        setup: () => () => h(MTextField, null, shown.value
          ? { 'leading-content': () => 'chip', 'prepend': () => 'P', 'append': () => 'A' }
          : {}),
      })
      const wrapper = await mountSuspended(Host)
      const field = () => wrapper.find('.ui-text-field')

      expect(field().find('.ui-text-field__leading').exists()).toBe(false)

      shown.value = true
      await nextTick()
      expect(field().find('.ui-text-field__leading').text()).toBe('chip')
      expect(field().classes()).toEqual(expect.arrayContaining(['ui-text-field--prepend', 'ui-text-field--append']))

      shown.value = false
      await nextTick()
      expect(field().find('.ui-text-field__leading').exists()).toBe(false)
      expect(field().classes()).not.toContain('ui-text-field--prepend')
      wrapper.unmount()
    })

    it('hands the helper text to a helper slot', async () => {
      const wrapper = await mount({ helperText: 'Hint' }, { helper: (scope: { message?: string }) => `custom: ${scope.message}` })

      expect(wrapper.find('.ui-text-field__support').text()).toBe('custom: Hint')
    })

    it('hands the error to an error slot, which then owns the glyph', async () => {
      const wrapper = await mount({ errorMessage: 'Too short' }, { error: (scope: { message?: string }) => `custom: ${scope.message}` })

      expect(wrapper.find('.ui-text-field__support-icon').exists()).toBe(false)
      expect(wrapper.find('[role="alert"]').text()).toBe('custom: Too short')
    })
  })

  describe('state modifiers', () => {
    it('applies disabled to the native input and the disabled modifier', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
      expect(wrapper.classes()).toContain('ui-text-field--disabled')
    })

    it('applies readonly to the native input without a modifier of its own', async () => {
      const wrapper = await mount({ readonly: true })

      expect(wrapper.find('input').attributes('readonly')).toBeDefined()
      expect(wrapper.classes()).not.toContain('ui-text-field--disabled')
    })

    it.each([
      ['an error flag', { error: true }],
      ['an error message', { errorMessage: 'Required' }],
    ])('carries the error modifier for %s', async (_, props) => {
      const wrapper = await mount(props)

      expect(wrapper.classes()).toContain('ui-text-field--error')
    })

    it('carries the focused modifier while the focused model is set', async () => {
      const wrapper = await mount({ focused: true })

      expect(wrapper.classes()).toContain('ui-text-field--focused')
    })
  })

  describe('support line', () => {
    // Decision 2026-10-19: the line is reserved only when something can appear in it.
    it('renders no support line when nothing can appear in it', async () => {
      const wrapper = await mount({ label: 'Name' })

      expect(wrapper.find('.ui-text-field__support').exists()).toBe(false)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined()
    })

    it.each([
      ['a helper text', { helperText: 'Hint' }],
      ['an adapter path', { path: 'name' }],
      ['a required mark', { required: true }],
      ['an error message bound while empty', { errorMessage: undefined }],
      ['an error flag bound while off', { error: false }],
    ])('reserves the line for %s', async (_, props) => {
      const wrapper = await mount(props)

      expect(wrapper.find('.ui-text-field__support').exists()).toBe(true)
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })

    it.each(['helper', 'error'] as const)('reserves the line for a %s slot', async (slot) => {
      const wrapper = await mount({}, { [slot]: () => 'Text' })

      expect(wrapper.find('.ui-text-field__support').exists()).toBe(true)
    })

    it('a composite passes no error it was not given: no line, until its consumer binds one', async () => {
      const bare = await mountSuspended(MDropdown, { props: { label: 'Fruit', items: [] } })
      const bound = await mountSuspended(MDropdown, { props: { label: 'Fruit', items: [], errorMessage: undefined } })

      expect(bare.find('.ui-text-field__support').exists()).toBe(false)
      expect(bound.find('.ui-text-field__support').exists()).toBe(true)
      bare.unmount()
      bound.unmount()
    })

    it('renders helper text on the support line', async () => {
      const wrapper = await mount({ helperText: 'Some hint' })

      expect(wrapper.find('.ui-text-field__support').text()).toBe('Some hint')
      expect(wrapper.classes()).not.toContain('ui-text-field--error')
    })

    it('swaps the helper for the error, never showing both', async () => {
      const wrapper = await mount({ helperText: 'Hint', errorMessage: 'Too short' })

      expect(wrapper.find('.ui-text-field__support').text()).toBe('Too short')
    })
  })
})
