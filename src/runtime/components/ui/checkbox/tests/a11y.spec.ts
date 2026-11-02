import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MCheckbox from '../index.vue'
import { mount, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-checkbox · a11y', () => {
  describe('role', () => {
    it('relies on the native checkbox role rather than an invented one', async () => {
      const wrapper = await mount({ label: 'Accept' })
      const input = wrapper.find('input')

      expect(input.attributes('type')).toBe('checkbox')
      expect(input.attributes('role')).toBeUndefined()
    })
  })

  describe('state', () => {
    it.each([
      [{ modelValue: true }],
      [{ modelValue: false }],
      [{ indeterminate: true }],
    ])('leaves %o to the native control — no aria-checked on top of it', async (props) => {
      const wrapper = await mount(props)

      expect(wrapper.find('input').attributes('aria-checked')).toBeUndefined()
    })

    it('reports mixed through the native indeterminate state', async () => {
      const wrapper = await mount({ indeterminate: true })

      // The browser maps the property to `mixed` in the accessibility tree.
      expect((wrapper.find('input').element as HTMLInputElement).indeterminate).toBe(true)
    })
  })

  describe('naming', () => {
    it('names the control by the label element that wraps it', async () => {
      const wrapper = await mount({ label: 'Accept the terms' })
      const label = wrapper.find('label')

      expect(label.element.contains(wrapper.find('input').element)).toBe(true)
      expect(label.text()).toContain('Accept the terms')
    })

    it('takes an aria-label for a box with no visible text', async () => {
      const wrapper = await mount({ 'aria-label': 'Select all rows' })

      expect(wrapper.find('input').attributes('aria-label')).toBe('Select all rows')
    })

    it('keeps an id the consumer gives the control', async () => {
      const wrapper = await mount({ id: 'own-id', label: 'Accept' })

      expect(wrapper.find('input').attributes('id')).toBe('own-id')
    })

    it('gives every instance its own control id', async () => {
      const wrapper = await mountSuspended(defineComponent({
        render: () => h('div', [h(MCheckbox, { label: 'A' }), h(MCheckbox, { label: 'B' })]),
      }))
      const [first, second] = wrapper.findAll('input').map(input => input.attributes('id'))

      expect(first).toBeTruthy()
      expect(second).toBeTruthy()
      expect(first).not.toBe(second)
      wrapper.unmount()
    })
  })

  describe('validity', () => {
    it('marks the control invalid while the field has an error', async () => {
      const { adapter } = stubAdapter(false, 'Accept the terms to continue')
      const wrapper = await mountWithAdapter(adapter)

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('leaves a valid control unmarked', async () => {
      const { adapter } = stubAdapter(true)
      const wrapper = await mountWithAdapter(adapter)

      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })
  })

  describe('required', () => {
    it('marks the native control required and the label with a hidden asterisk', async () => {
      const wrapper = await mount({ label: 'Accept', required: true })

      expect(wrapper.find('input').attributes('required')).toBeDefined()
      expect(wrapper.find('.ui-checkbox__label .ui-checkbox__required').attributes('aria-hidden')).toBe('true')
    })

    it('reserves the support line for a required control', async () => {
      const wrapper = await mount({ label: 'Accept', required: true })

      expect(wrapper.find('.ui-checkbox__support').exists()).toBe(true)
    })

    it('is optional by default', async () => {
      const wrapper = await mount({ label: 'Accept' })

      expect(wrapper.find('input').attributes('required')).toBeUndefined()
      expect(wrapper.find('.ui-checkbox__required').exists()).toBe(false)
    })
  })

  describe('support line', () => {
    it('describes the control by the line while it says something', async () => {
      const wrapper = await mount({ label: 'Accept', helperText: 'Required to continue' })
      const line = wrapper.find('.ui-checkbox__support')

      expect(line.attributes('id')).toBeTruthy()
      expect(wrapper.find('input').attributes('aria-describedby')).toBe(line.attributes('id'))
    })

    it('describes nothing while the line is empty or absent', async () => {
      const bare = await mount({ label: 'Accept' })
      expect(bare.find('input').attributes('aria-describedby')).toBeUndefined()

      const empty = await mount({ label: 'Accept', errorMessage: undefined })
      expect(empty.find('input').attributes('aria-describedby')).toBeUndefined()
    })

    it('keeps a description the consumer points the control at', async () => {
      const wrapper = await mount({ 'label': 'Accept', 'helperText': 'Required', 'aria-describedby': 'terms-text' })
      const describedBy = wrapper.find('input').attributes('aria-describedby')!

      expect(describedBy.split(' ')).toEqual(['terms-text', wrapper.find('.ui-checkbox__support').attributes('id')])
    })

    it('marks the control invalid from errorMessage and from error', async () => {
      const message = await mount({ errorMessage: 'Accept the terms' })
      expect(message.find('input').attributes('aria-invalid')).toBe('true')

      const flag = await mount({ error: true })
      expect(flag.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('keeps the alert region mounted before there is an error to write into it', async () => {
      const wrapper = await mount({ label: 'Accept', helperText: 'Required' })
      const region = wrapper.find('.ui-checkbox__support [role="alert"]')

      expect(region.exists()).toBe(true)
      expect(region.text()).toBe('')

      await wrapper.setProps({ errorMessage: 'Accept the terms' })

      expect(wrapper.find('[role="alert"]').element).toBe(region.element)
      expect(region.text()).toBe('Accept the terms')
    })

    it('shows a glyph beside the error, so validity survives without colour, hidden from assistive tech', async () => {
      const wrapper = await mount({ error: true })
      const glyph = wrapper.find('.ui-checkbox__support .ui-choice-support__icon')

      expect(glyph.exists()).toBe(true)
      expect(glyph.attributes('aria-hidden')).toBe('true')
    })

    it('shows no glyph while valid', async () => {
      const wrapper = await mount({ helperText: 'Required' })

      expect(wrapper.find('.ui-choice-support__icon').exists()).toBe(false)
    })
  })

  describe('decoration', () => {
    it('hides the drawn check glyph from assistive tech — the native control carries the state', async () => {
      const wrapper = await mount({ modelValue: true })

      expect(wrapper.find('.ui-checkbox__icon').attributes('aria-hidden')).toBe('true')
      expect(wrapper.find('.ui-checkbox__icon').attributes('focusable')).toBe('false')
    })
  })

  describe('focus order', () => {
    it('stays in the Tab order while enabled', async () => {
      const wrapper = await mount()

      expect(wrapper.find('input').attributes('tabindex')).toBeUndefined()
    })

    it('leaves the Tab order when disabled, through the native attribute', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })
  })
})
