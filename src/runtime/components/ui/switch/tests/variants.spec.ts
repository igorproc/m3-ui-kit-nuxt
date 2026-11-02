import { afterEach, describe, expect, it } from 'vitest'
import { ICONS } from '#kit/shared/constants/icons'
import { mSwitchProps } from '../props'
import { mount, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

/** A value the adapter field holds for the support-line cases. */
const ADAPTER_VALUE = false

describe('m-switch · variants', () => {
  describe('anatomy', () => {
    it('draws a track and a thumb over a native checkbox it keeps', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-switch')
      expect(wrapper.find('input.ui-switch__input').attributes('type')).toBe('checkbox')
      expect(wrapper.find('.ui-switch__track .ui-switch__thumb-container .ui-switch__thumb').exists()).toBe(true)
      expect(wrapper.find('.ui-switch__thumb-container .ui-switch__state-layer').exists()).toBe(true)
    })
  })

  describe('value', () => {
    it.each([
      [false, false],
      [true, true],
    ])('model %s → checked modifier %s, native checked in step', async (model, checked) => {
      const wrapper = await mount({ modelValue: model })

      expect(wrapper.classes().includes('ui-switch--checked')).toBe(checked)
      expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(checked)
    })

    it('defaults to off', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-switch--checked')
    })
  })

  describe('icons', () => {
    it.each([
      ['none', false, false],
      ['selected', false, true],
      ['both', true, true],
    ] as const)('icons="%s" → glyph off %s, on %s', async (icons, off, on) => {
      const offWrapper = await mount({ icons, modelValue: false })
      expect(offWrapper.find('.ui-switch__thumb .ui-switch__icon').exists()).toBe(off)

      const onWrapper = await mount({ icons, modelValue: true })
      expect(onWrapper.find('.ui-switch__thumb .ui-switch__icon').exists()).toBe(on)
    })

    it('marks the root while a glyph shows, so the thumb takes its 24 size off as well', async () => {
      const wrapper = await mount({ icons: 'both', modelValue: false })

      expect(wrapper.classes()).toContain('ui-switch--icon')
    })

    it('defaults to no glyphs', async () => {
      const wrapper = await mount({ modelValue: true })

      expect(wrapper.find('.ui-switch__icon').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('ui-switch--icon')
    })

    it('draws check when on and close when off', async () => {
      const on = await mount({ icons: 'both', modelValue: true })
      expect(on.find('.ui-switch__icon').html()).toContain(ICONS.check)

      const off = await mount({ icons: 'both', modelValue: false })
      expect(off.find('.ui-switch__icon').html()).toContain(ICONS.close)
    })

    it('lets the icon slot draw its own glyph, with the value', async () => {
      const wrapper = await mount({ icons: 'both', modelValue: true }, { icon: (scope: { checked: boolean }) => `on:${scope.checked}` })

      expect(wrapper.find('.ui-switch__icon').text()).toBe('on:true')
    })

    it('hides the glyph from assistive tech — the native control carries the value', async () => {
      const wrapper = await mount({ icons: 'both', modelValue: true })

      expect(wrapper.find('.ui-switch__icon .ui-icon').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('label', () => {
    it('renders the label prop as the text beside the track', async () => {
      const wrapper = await mount({ label: 'Wi-Fi' })

      expect(wrapper.find('.ui-switch__label').text()).toBe('Wi-Fi')
    })

    it('lets the default slot replace the label text', async () => {
      const wrapper = await mount({ label: 'Wi-Fi' }, { default: () => 'Wi-Fi calling' })

      expect(wrapper.find('.ui-switch__label').text()).toBe('Wi-Fi calling')
    })

    it('renders the default slot without a label prop', async () => {
      const wrapper = await mount({}, { default: () => 'I agree to the terms' })

      expect(wrapper.find('.ui-switch__label').text()).toBe('I agree to the terms')
    })

    it('renders no label element with neither a label nor a slot', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-switch__label').exists()).toBe(false)
    })
  })

  describe('support line', () => {
    // Decision 2026-10-19: reserved only when something can appear in it.
    it('renders no line when nothing can appear in it', async () => {
      const wrapper = await mount({ label: 'Accept' })

      expect(wrapper.find('.ui-switch__support').exists()).toBe(false)
    })

    it('reserves an empty line when an error is bound but empty', async () => {
      const wrapper = await mount({ label: 'Accept', errorMessage: undefined })

      expect(wrapper.find('.ui-switch__support').exists()).toBe(true)
      expect(wrapper.find('.ui-switch__support').text()).toBe('')
    })

    it('reserves the line for a validation path', async () => {
      const { adapter } = stubAdapter(ADAPTER_VALUE)
      const wrapper = await mountWithAdapter(adapter, { label: 'Accept' })

      expect(wrapper.find('.ui-switch__support').exists()).toBe(true)
    })

    it('shows helper text and swaps it for the error message', async () => {
      const helper = await mount({ label: 'Accept', helperText: 'Required to continue' })
      expect(helper.find('.ui-switch__support').text()).toBe('Required to continue')

      const invalid = await mount({ label: 'Accept', helperText: 'Required to continue', errorMessage: 'Accept the terms' })
      expect(invalid.find('.ui-switch__support').text()).toBe('Accept the terms')
    })

    it('shows the adapter error in the line', async () => {
      const { adapter } = stubAdapter(ADAPTER_VALUE, 'Accept the terms to continue')
      const wrapper = await mountWithAdapter(adapter, { label: 'Accept' })

      expect(wrapper.find('.ui-switch__support').text()).toBe('Accept the terms to continue')
    })

    it('keeps the line out of the label, so its text neither names nor toggles the control', async () => {
      const wrapper = await mount({ label: 'Accept', helperText: 'Required to continue' })

      expect(wrapper.find('label').element.contains(wrapper.find('.ui-switch__support').element)).toBe(false)
    })

    it('lets the helper and error slots replace the text', async () => {
      const helper = await mount({ label: 'Accept' }, { helper: () => 'custom help' })
      expect(helper.find('.ui-switch__support').text()).toBe('custom help')

      const invalid = await mount({ label: 'Accept', errorMessage: 'Too bad' }, { error: (scope: { message: string }) => `custom: ${scope.message}` })
      expect(invalid.find('.ui-switch__support').text()).toBe('custom: Too bad')
    })
  })

  describe('state modifiers', () => {
    it('marks the root and the native control disabled', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.classes()).toContain('ui-switch--disabled')
      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })

    it('combines checked and disabled, which have their own roles', async () => {
      const wrapper = await mount({ disabled: true, modelValue: true })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-switch--checked', 'ui-switch--disabled']))
    })

    it.each([
      [{ errorMessage: 'Turn this on to continue' }],
      [{ error: true }],
    ])('takes the error look from %o, as the checkbox does', async (props) => {
      const wrapper = await mount(props)

      expect(wrapper.classes()).toContain('ui-switch--error')
    })

    it('takes the error look from a validation error', async () => {
      const { adapter } = stubAdapter(false, 'Turn this on to continue')
      const wrapper = await mountWithAdapter(adapter)

      expect(wrapper.find('.ui-switch').classes()).toContain('ui-switch--error')
    })

    it('carries no error look while valid', async () => {
      const wrapper = await mount({ helperText: 'Optional' })

      expect(wrapper.classes()).not.toContain('ui-switch--error')
    })

    it('has no loading state — a switch commits instantly', () => {
      expect(Object.keys(mSwitchProps)).not.toContain('loading')
    })

    it('stays enabled by default', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-switch--disabled')
      expect(wrapper.find('input').attributes('disabled')).toBeUndefined()
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ modelValue: true, disabled: true })
      const names = [wrapper.element, ...wrapper.element.querySelectorAll('*')]
        .flatMap(el => [...el.attributes].map(attribute => attribute.name))

      expect(names.filter(name => name.startsWith('data-'))).toEqual([])
    })
  })

  describe('form', () => {
    it('posts under the field path', async () => {
      const wrapper = await mount({ path: 'wifi' })

      expect(wrapper.find('input').attributes('name')).toBe('wifi')
    })

    it('posts under its own name without a path, and prefers it over the path', async () => {
      const own = await mount({ name: 'wifi' })
      expect(own.find('input').attributes('name')).toBe('wifi')

      const both = await mount({ name: 'wifi', path: 'settings.wifi' })
      expect(both.find('input').attributes('name')).toBe('wifi')
    })
  })

  describe('fallthrough attributes', () => {
    it('keeps class and style on the root and hands the rest to the native control', async () => {
      const wrapper = await mount({ 'class': 'consumer', 'style': 'margin: 4px', 'aria-label': 'Wi-Fi', 'data-test': 'wifi' })
      const input = wrapper.find('input')

      expect(wrapper.classes()).toContain('consumer')
      expect(wrapper.attributes('style')).toContain('margin')
      expect(input.attributes('aria-label')).toBe('Wi-Fi')
      expect(input.attributes('data-test')).toBe('wifi')
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })
  })
})
