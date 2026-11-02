import { afterEach, describe, expect, it } from 'vitest'
import { mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

const MESSAGES = {
  saturation: 'Saturation',
  brightness: 'Brightness',
  hue: 'Hue',
  alpha: 'Opacity',
  value: 'Value',
  format: 'Format',
  channels: 'Channels',
  swatches: 'Palette',
}

describe('m-color-picker · a11y', () => {
  describe('group', () => {
    it('is a group named by its label', async () => {
      const { wrapper } = await mountPicker({ label: 'Brand colour' })

      expect(wrapper.find('.ui-color-picker').attributes()).toMatchObject({ 'role': 'group', 'aria-label': 'Brand colour' })
    })

    it('offers the formats as a named compact list', async () => {
      const { wrapper } = await mountPicker({ messages: MESSAGES })

      expect(wrapper.find('.ui-color-picker__format [role="combobox"]').exists()).toBe(true)
      expect(wrapper.find('.ui-color-picker__format label').text()).toBe('Format')
    })

    it('names the channel fields as a group', async () => {
      const { wrapper } = await mountPicker({ modelValue: 'rgb(1, 2, 3)', format: 'rgb', messages: MESSAGES })

      expect(wrapper.find('.ui-color-edit__channels').attributes()).toMatchObject({ 'role': 'group', 'aria-label': 'Channels' })
    })

    it('names the hex value field', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4', messages: MESSAGES })
      const input = wrapper.find('.ui-color-edit input')

      expect(wrapper.find(`label[for="${input.attributes('id')}"]`).text()).toBe('Value')
    })
  })

  describe('canvas', () => {
    it('reads the 2-D field as two sliders with values in percent', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#ff0000', messages: MESSAGES })
      const [saturation, brightness] = wrapper.findAll('.ui-color-canvas [role="slider"]')

      expect(saturation!.attributes()).toMatchObject({ 'aria-label': 'Saturation', 'aria-valuenow': '100', 'aria-valuetext': '100%', 'tabindex': '0' })
      expect(saturation!.attributes()).toMatchObject({ 'aria-valuemin': '0', 'aria-valuemax': '100' })
      expect(brightness!.attributes()).toMatchObject({ 'aria-label': 'Brightness', 'aria-orientation': 'vertical' })
    })

    it('says the axes are read-only or disabled', async () => {
      const readonly = await mountPicker({ modelValue: '#ff0000', readonly: true })
      expect(readonly.wrapper.find('.ui-color-canvas [role="slider"]').attributes('aria-readonly')).toBe('true')

      const disabled = await mountPicker({ modelValue: '#ff0000', disabled: true })
      expect(disabled.wrapper.find('.ui-color-canvas [role="slider"]').attributes('aria-disabled')).toBe('true')
    })
  })

  describe('sliders', () => {
    it('are native ranges named by messages', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#00ff0080', format: 'hexa', messages: MESSAGES })

      expect(wrapper.find('.ui-color-picker__hue').attributes()).toMatchObject({ 'type': 'range', 'aria-label': 'Hue' })
      expect(wrapper.find('.ui-color-picker__alpha').attributes()).toMatchObject({ 'type': 'range', 'aria-label': 'Opacity' })
    })

    it('say the hue and alpha values in degrees and percent', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#00ff0080', format: 'hexa' })

      expect(wrapper.find('.ui-color-picker__hue').attributes('aria-valuetext')).toBe('120°')
      expect(wrapper.find('.ui-color-picker__alpha').attributes('aria-valuetext')).toBe('50%')
    })

    it('say they are read-only', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#00ff0080', format: 'hexa', readonly: true })

      expect(wrapper.find('.ui-color-picker__hue').attributes('aria-readonly')).toBe('true')
      expect(wrapper.find('.ui-color-picker__alpha').attributes('aria-readonly')).toBe('true')
    })
  })

  describe('swatches', () => {
    it('are a named listbox with one tab stop and options without their own', async () => {
      const { wrapper } = await mountPicker({ swatches: ['#ff0000', '#00ff00'], messages: MESSAGES })
      const list = wrapper.find('[role="listbox"]')

      expect(list.attributes('aria-label')).toBe('Palette')
      expect(list.attributes('tabindex')).toBe('0')
      expect(wrapper.findAll('[role="option"]').every(option => option.attributes('tabindex') === undefined)).toBe(true)
    })

    it('say which swatch is chosen, with a check that is decoration', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#ff0000', swatches: ['#ff0000', '#00ff00'] })
      const [first, second] = wrapper.findAll('[role="option"]')

      expect(first!.attributes('aria-selected')).toBe('true')
      expect(second!.attributes('aria-selected')).toBe('false')
      expect(first!.find('.ui-color-swatches__check').attributes('aria-hidden')).toBe('true')
    })

    it('point the active descendant at an option that exists', async () => {
      const { wrapper } = await mountPicker({ swatches: ['#ff0000', '#00ff00'] })
      const list = wrapper.find('[role="listbox"]')

      await list.trigger('focus')

      expect(wrapper.find(`#${list.attributes('aria-activedescendant')}`).attributes('role')).toBe('option')
    })

    it('say the list is disabled or read-only', async () => {
      const disabled = await mountPicker({ swatches: ['#ff0000'], disabled: true })
      expect(disabled.wrapper.find('[role="listbox"]').attributes('aria-disabled')).toBe('true')

      const readonly = await mountPicker({ swatches: ['#ff0000'], readonly: true })
      expect(readonly.wrapper.find('[role="listbox"]').attributes('aria-readonly')).toBe('true')
    })
  })

  describe('preview', () => {
    it('is a picture of the value, hidden from assistive tech', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#6750a4' })

      expect(wrapper.find('.ui-color-preview').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('value field errors', () => {
    it('announces the format hint of an unreadable value and marks the field invalid', async () => {
      const { wrapper } = await mountPicker({ modelValue: '#ff0000', messages: { formatHint: 'Use #RRGGBB' } })
      const field = wrapper.find('.ui-color-edit input')

      await field.setValue('#zz')
      await field.trigger('keydown', { key: 'Enter' })

      expect(wrapper.find('.ui-color-edit [role="alert"]').text()).toBe('Use #RRGGBB')
      expect(wrapper.find('.ui-color-edit input').attributes('aria-invalid')).toBe('true')
    })
  })
})
