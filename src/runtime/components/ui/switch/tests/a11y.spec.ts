import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MSwitch from '../index.vue'
import { mount, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-switch · a11y', () => {
  describe('role', () => {
    it('announces a switch on a native checkbox — the `switch` attribute is Safari-only', async () => {
      const wrapper = await mount({ label: 'Wi-Fi' })
      const input = wrapper.find('input')

      expect(input.attributes('type')).toBe('checkbox')
      expect(input.attributes('role')).toBe('switch')
    })

    it.each([true, false])('leaves the on state %s to the native checkbox — no aria-checked on top of it', async (modelValue) => {
      const wrapper = await mount({ modelValue })

      expect(wrapper.find('input').attributes('aria-checked')).toBeUndefined()
    })
  })

  describe('naming', () => {
    it('names the control by the label element that wraps it', async () => {
      const wrapper = await mount({ label: 'Wi-Fi' })
      const label = wrapper.find('label')

      expect(label.element.contains(wrapper.find('input').element)).toBe(true)
      expect(label.text()).toContain('Wi-Fi')
    })

    it('takes an aria-label for a switch with no visible text', async () => {
      const wrapper = await mount({ 'aria-label': 'Dark theme' })

      expect(wrapper.find('input').attributes('aria-label')).toBe('Dark theme')
    })

    it('keeps an id the consumer gives the control', async () => {
      const wrapper = await mount({ id: 'own-id', label: 'Accept' })

      expect(wrapper.find('input').attributes('id')).toBe('own-id')
    })

    it('gives every instance its own control id', async () => {
      const wrapper = await mountSuspended(defineComponent({
        render: () => h('div', [h(MSwitch, { label: 'A' }), h(MSwitch, { label: 'B' })]),
      }))
      const [first, second] = wrapper.findAll('input').map(input => input.attributes('id'))

      expect(first).toBeTruthy()
      expect(first).not.toBe(second)
      wrapper.unmount()
    })
  })

  describe('validity', () => {
    it('marks the control invalid while the field has an error', async () => {
      const { adapter } = stubAdapter(false, 'Turn this on to continue')
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
      const wrapper = await mount({ label: 'Wi-Fi', required: true })

      expect(wrapper.find('input').attributes('required')).toBeDefined()
      expect(wrapper.find('.ui-switch__label .ui-switch__required').attributes('aria-hidden')).toBe('true')
    })

    it('reserves the support line for a required control', async () => {
      const wrapper = await mount({ label: 'Wi-Fi', required: true })

      expect(wrapper.find('.ui-switch__support').exists()).toBe(true)
    })

    it('is optional by default', async () => {
      const wrapper = await mount({ label: 'Wi-Fi' })

      expect(wrapper.find('input').attributes('required')).toBeUndefined()
      expect(wrapper.find('.ui-switch__required').exists()).toBe(false)
    })
  })

  describe('support line', () => {
    it('describes the control by the line while it says something', async () => {
      const wrapper = await mount({ label: 'Accept', helperText: 'Required to continue' })
      const line = wrapper.find('.ui-switch__support')

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

      expect(describedBy.split(' ')).toEqual(['terms-text', wrapper.find('.ui-switch__support').attributes('id')])
    })

    it('marks the control invalid from errorMessage and from error', async () => {
      const message = await mount({ errorMessage: 'Accept the terms' })
      expect(message.find('input').attributes('aria-invalid')).toBe('true')

      const flag = await mount({ error: true })
      expect(flag.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('keeps the alert region mounted before there is an error to write into it', async () => {
      const wrapper = await mount({ label: 'Accept', helperText: 'Required' })
      const region = wrapper.find('.ui-switch__support [role="alert"]')

      expect(region.exists()).toBe(true)
      expect(region.text()).toBe('')

      await wrapper.setProps({ errorMessage: 'Accept the terms' })

      expect(wrapper.find('[role="alert"]').element).toBe(region.element)
      expect(region.text()).toBe('Accept the terms')
    })

    it('shows a glyph beside the error, so validity survives without colour, hidden from assistive tech', async () => {
      const wrapper = await mount({ error: true })
      const glyph = wrapper.find('.ui-switch__support .ui-choice-support__icon')

      expect(glyph.exists()).toBe(true)
      expect(glyph.attributes('aria-hidden')).toBe('true')
    })

    it('shows no glyph while valid', async () => {
      const wrapper = await mount({ helperText: 'Required' })

      expect(wrapper.find('.ui-choice-support__icon').exists()).toBe(false)
    })
  })

  describe('decoration', () => {
    it('draws the track and thumb without text — the native control carries the state', async () => {
      const wrapper = await mount({ modelValue: true })

      expect(wrapper.find('.ui-switch__track').text()).toBe('')
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
