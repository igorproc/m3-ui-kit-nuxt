import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { MRadio, MRadioGroup, mount, mountGroup, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-radio · a11y', () => {
  describe('role', () => {
    it('relies on the native radio role rather than an invented one', async () => {
      const wrapper = await mount({ label: 'A' })
      const input = wrapper.find('input')

      expect(input.attributes('type')).toBe('radio')
      expect(input.attributes('role')).toBeUndefined()
    })

    it.each(['a', 'b'])('leaves checked to the native radio with the model on %s — no aria-checked on top of it', async (modelValue) => {
      const wrapper = await mount({ value: 'a', modelValue })

      expect(wrapper.find('input').attributes('aria-checked')).toBeUndefined()
    })

    it('names the radiogroup by a consumer aria-labelledby and keeps class on the root', async () => {
      const { wrapper } = await mountGroup({ 'aria-labelledby': 'payment-legend', 'class': 'payment' })

      expect(wrapper.find('[role="radiogroup"]').attributes('aria-labelledby')).toBe('payment-legend')
      expect(wrapper.find('.ui-radio-group').classes()).toContain('payment')
    })

    it('wraps a group in role="radiogroup"', async () => {
      const { wrapper } = await mountGroup()

      expect(wrapper.find('.ui-radio-group__options').attributes('role')).toBe('radiogroup')
    })
  })

  describe('naming', () => {
    it('names the control by the label element that wraps it', async () => {
      const wrapper = await mount({ label: 'Express delivery' })
      const label = wrapper.find('label')

      expect(label.element.contains(wrapper.find('input').element)).toBe(true)
      expect(label.text()).toContain('Express delivery')
    })

    it('keeps an id the consumer gives the control', async () => {
      const wrapper = await mount({ id: 'express', label: 'Express' })

      expect(wrapper.find('input').attributes('id')).toBe('express')
    })

    it('gives every radio of a group its own control id', async () => {
      const { wrapper } = await mountGroup()
      const ids = wrapper.findAll('input').map(input => input.attributes('id'))

      expect(ids.every(Boolean)).toBe(true)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe('keyboard model', () => {
    it('leaves arrows and the single Tab stop to the browser through one shared name', async () => {
      const { wrapper } = await mountGroup({ modelValue: 'b' })
      const inputs = wrapper.findAll('input')

      expect(new Set(inputs.map(input => input.attributes('name'))).size).toBe(1)
      expect(inputs.every(input => input.attributes('tabindex') === undefined)).toBe(true)
    })
  })

  describe('validity', () => {
    it('marks a standalone radio invalid while its field has an error', async () => {
      const { adapter } = stubAdapter(undefined, 'Choose a delivery')
      const wrapper = await mountWithAdapter(adapter, () => h(MRadio, { value: 'a', path: 'delivery' }))

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('marks the group invalid while its field has an error', async () => {
      const { adapter } = stubAdapter(undefined, 'Choose a delivery')
      const wrapper = await mountWithAdapter(adapter, () => h(MRadioGroup, { path: 'delivery' }, () => [
        h(MRadio, { value: 'a' }),
      ]))

      expect(wrapper.find('[role="radiogroup"]').attributes('aria-invalid')).toBe('true')
    })

    it('leaves a valid radio and group unmarked', async () => {
      const { wrapper } = await mountGroup()

      expect(wrapper.find('[role="radiogroup"]').attributes('aria-invalid')).toBeUndefined()
      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })
  })

  describe('group name and required', () => {
    it('shows the group label and names the radiogroup by it', async () => {
      const { wrapper } = await mountGroup({ label: 'Delivery' })
      const label = wrapper.find('.ui-radio-group__label')

      expect(label.text()).toBe('Delivery')
      expect(wrapper.find('[role="radiogroup"]').attributes('aria-labelledby')).toBe(label.attributes('id'))
    })

    it('marks a required group with aria-required and a hidden asterisk, never the radios', async () => {
      const { wrapper } = await mountGroup({ label: 'Delivery', required: true })

      expect(wrapper.find('[role="radiogroup"]').attributes('aria-required')).toBe('true')
      expect(wrapper.find('.ui-radio-group__required').attributes('aria-hidden')).toBe('true')
      expect(wrapper.findAll('input').every(input => input.attributes('required') === undefined)).toBe(true)
    })

    it('marks a required standalone radio natively', async () => {
      const wrapper = await mount({ label: 'A', required: true })

      expect(wrapper.find('input').attributes('required')).toBeDefined()
    })
  })

  describe('support line', () => {
    it('describes a standalone radio by its line while it says something', async () => {
      const wrapper = await mount({ label: 'A', helperText: 'Arrives tomorrow' })

      expect(wrapper.find('input').attributes('aria-describedby')).toBe(wrapper.find('.ui-radio__support').attributes('id'))
    })

    it('describes the radiogroup by the group line', async () => {
      const { wrapper } = await mountGroup({ helperText: 'Pick one' })
      const group = wrapper.find('[role="radiogroup"]')

      expect(group.attributes('aria-describedby')).toBe(wrapper.find('.ui-radio-group__support').attributes('id'))
    })

    it('marks the group invalid from errorMessage, and keeps the line outside the radiogroup', async () => {
      const { wrapper } = await mountGroup({ errorMessage: 'Choose a delivery' })
      const group = wrapper.find('[role="radiogroup"]')

      expect(group.attributes('aria-invalid')).toBe('true')
      expect(group.element.contains(wrapper.find('.ui-radio-group__support').element)).toBe(false)
    })

    it('keeps the group alert region mounted before there is an error to write into it', async () => {
      const { wrapper } = await mountGroup({ helperText: 'Pick one' })
      const region = wrapper.find('.ui-radio-group__support [role="alert"]')

      expect(region.exists()).toBe(true)
      expect(region.text()).toBe('')
    })

    it('shows a glyph beside a standalone error, hidden from assistive tech', async () => {
      const wrapper = await mount({ error: true })
      const glyph = wrapper.find('.ui-radio__support .ui-choice-support__icon')

      expect(glyph.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('decoration', () => {
    it('draws the ring and dot without text — the native control carries the state', async () => {
      const wrapper = await mount({ modelValue: 'a' })

      expect(wrapper.find('.ui-radio__control').text()).toBe('')
    })
  })

  describe('focus order', () => {
    it('leaves the Tab order when disabled, through the native attribute', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })
  })
})
