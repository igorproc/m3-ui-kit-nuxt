import { afterEach, describe, expect, it } from 'vitest'
import { CHECK_MARK } from '#kit/utils/choice/checkMark'
import { mCheckboxProps } from '../props'
import { mount, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

/** A value the adapter field holds for the support-line cases. */
const ADAPTER_VALUE = false

describe('m-checkbox · variants', () => {
  describe('anatomy', () => {
    it('draws its own box over a native checkbox it keeps', async () => {
      const wrapper = await mount()
      const input = wrapper.find('input.ui-checkbox__input')

      expect(wrapper.classes()).toContain('ui-checkbox')
      expect(input.attributes('type')).toBe('checkbox')
      expect(wrapper.find('.ui-checkbox__container .ui-checkbox__control').exists()).toBe(true)
      expect(wrapper.find('.ui-checkbox__state-layer').exists()).toBe(true)
    })

    it('draws the check mark inside the box as a path it can stroke in', async () => {
      const wrapper = await mount()
      const mark = wrapper.find('.ui-checkbox__control .ui-checkbox__icon .ui-checkbox__mark')

      expect(mark.exists()).toBe(true)
      expect(mark.attributes('pathLength')).toBe('1')
      expect(wrapper.find('.ui-checkbox__icon').attributes('viewBox')).toBe(CHECK_MARK.viewBox)
    })
  })

  describe('value', () => {
    it.each([
      [false, false],
      [true, true],
    ])('model %s → checked modifier %s, native checked in step', async (model, checked) => {
      const wrapper = await mount({ modelValue: model })
      const input = wrapper.find('input').element as HTMLInputElement

      expect(wrapper.classes().includes('ui-checkbox--checked')).toBe(checked)
      expect(input.checked).toBe(checked)
    })

    it('defaults to unchecked', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-checkbox--checked')
      expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('indeterminate', () => {
    it.each([
      [false, false, CHECK_MARK.check],
      [true, false, CHECK_MARK.check],
      [false, true, CHECK_MARK.dash],
      [true, true, CHECK_MARK.dash],
    ])('model %s, indeterminate %s → mark %s', async (modelValue, indeterminate, path) => {
      const wrapper = await mount({ modelValue, indeterminate })

      expect(wrapper.classes().includes('ui-checkbox--indeterminate')).toBe(indeterminate)
      expect(wrapper.find('.ui-checkbox__mark').attributes('d')).toBe(path)
    })

    it('fills the box like a checked one while mixed, so the dash has a container', async () => {
      const wrapper = await mount({ indeterminate: true })

      expect(wrapper.classes()).toContain('ui-checkbox--indeterminate')
      expect(wrapper.classes()).not.toContain('ui-checkbox--checked')
    })

    it('defaults to a definite state', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-checkbox--indeterminate')
    })
  })

  describe('label', () => {
    it('renders the label prop as the text beside the box', async () => {
      const wrapper = await mount({ label: 'Accept the terms' })

      expect(wrapper.find('.ui-checkbox__label').text()).toBe('Accept the terms')
    })

    it('lets the default slot replace the label text', async () => {
      const wrapper = await mount({ label: 'Accept' }, { default: () => 'Accept the license' })

      expect(wrapper.find('.ui-checkbox__label').text()).toBe('Accept the license')
    })

    it('renders the default slot without a label prop', async () => {
      const wrapper = await mount({}, { default: () => 'I agree to the terms' })

      expect(wrapper.find('.ui-checkbox__label').text()).toBe('I agree to the terms')
    })

    it('renders no label element with neither a label nor a slot', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-checkbox__label').exists()).toBe(false)
    })
  })

  describe('support line', () => {
    // Decision 2026-10-19: reserved only when something can appear in it.
    it('renders no line when nothing can appear in it', async () => {
      const wrapper = await mount({ label: 'Accept' })

      expect(wrapper.find('.ui-checkbox__support').exists()).toBe(false)
    })

    it('reserves an empty line when an error is bound but empty', async () => {
      const wrapper = await mount({ label: 'Accept', errorMessage: undefined })

      expect(wrapper.find('.ui-checkbox__support').exists()).toBe(true)
      expect(wrapper.find('.ui-checkbox__support').text()).toBe('')
    })

    it('reserves the line for a validation path', async () => {
      const { adapter } = stubAdapter(ADAPTER_VALUE)
      const wrapper = await mountWithAdapter(adapter, { label: 'Accept' })

      expect(wrapper.find('.ui-checkbox__support').exists()).toBe(true)
    })

    it('shows helper text and swaps it for the error message', async () => {
      const helper = await mount({ label: 'Accept', helperText: 'Required to continue' })
      expect(helper.find('.ui-checkbox__support').text()).toBe('Required to continue')

      const invalid = await mount({ label: 'Accept', helperText: 'Required to continue', errorMessage: 'Accept the terms' })
      expect(invalid.find('.ui-checkbox__support').text()).toBe('Accept the terms')
    })

    it('shows the adapter error in the line', async () => {
      const { adapter } = stubAdapter(ADAPTER_VALUE, 'Accept the terms to continue')
      const wrapper = await mountWithAdapter(adapter, { label: 'Accept' })

      expect(wrapper.find('.ui-checkbox__support').text()).toBe('Accept the terms to continue')
    })

    it('keeps the line out of the label, so its text neither names nor toggles the control', async () => {
      const wrapper = await mount({ label: 'Accept', helperText: 'Required to continue' })

      expect(wrapper.find('label').element.contains(wrapper.find('.ui-checkbox__support').element)).toBe(false)
    })

    it('lets the helper and error slots replace the text', async () => {
      const helper = await mount({ label: 'Accept' }, { helper: () => 'custom help' })
      expect(helper.find('.ui-checkbox__support').text()).toBe('custom help')

      const invalid = await mount({ label: 'Accept', errorMessage: 'Too bad' }, { error: (scope: { message: string }) => `custom: ${scope.message}` })
      expect(invalid.find('.ui-checkbox__support').text()).toBe('custom: Too bad')
    })
  })

  describe('state modifiers', () => {
    it('marks the root and the native control disabled', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.classes()).toContain('ui-checkbox--disabled')
      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })

    it('has no loading state — a checkbox commits instantly', () => {
      expect(Object.keys(mCheckboxProps)).not.toContain('loading')
    })

    it('stays enabled by default', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-checkbox--disabled')
      expect(wrapper.find('input').attributes('disabled')).toBeUndefined()
    })

    it('takes the error modifier from a validation error', async () => {
      const { adapter } = stubAdapter(false, 'Accept the terms to continue')
      const wrapper = await mountWithAdapter(adapter)

      expect(wrapper.find('.ui-checkbox').classes()).toContain('ui-checkbox--error')
    })

    it.each([
      [{ errorMessage: 'Accept the terms' }],
      [{ error: true }],
    ])('takes the error modifier from %o', async (props) => {
      const wrapper = await mount(props)

      expect(wrapper.classes()).toContain('ui-checkbox--error')
    })

    it('carries no error modifier while the field is valid', async () => {
      const { adapter } = stubAdapter(false)
      const wrapper = await mountWithAdapter(adapter)

      expect(wrapper.find('.ui-checkbox').classes()).not.toContain('ui-checkbox--error')
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
      const wrapper = await mount({ path: 'agree' })

      expect(wrapper.find('input').attributes('name')).toBe('agree')
    })

    it('posts under its own name without a path, and prefers it over the path', async () => {
      const own = await mount({ name: 'agree' })
      expect(own.find('input').attributes('name')).toBe('agree')

      const both = await mount({ name: 'agree', path: 'form.agree' })
      expect(both.find('input').attributes('name')).toBe('agree')
    })
  })

  describe('fallthrough attributes', () => {
    it('keeps class and style on the root and hands the rest to the native control', async () => {
      const wrapper = await mount({ 'class': 'consumer', 'style': 'margin: 4px', 'aria-label': 'Select all', 'data-test': 'all' })
      const input = wrapper.find('input')

      expect(wrapper.classes()).toContain('consumer')
      expect(wrapper.attributes('style')).toContain('margin')
      expect(input.attributes('aria-label')).toBe('Select all')
      expect(input.attributes('data-test')).toBe('all')
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })
  })
})
