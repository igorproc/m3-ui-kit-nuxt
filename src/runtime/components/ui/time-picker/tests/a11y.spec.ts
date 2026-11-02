import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTimePicker from '../index.vue'
import { mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

describe('m-time-picker · a11y', () => {
  // Q32-А: every phrase comes from the app; the kit ships no English copy.
  describe('no copy of its own', () => {
    it('leaves the group, the selectors and the dial unnamed without phrases', async () => {
      const wrapper = await mountSuspended(MTimePicker, { props: { modelValue: '14:30', hourCycle: 'h12' } })

      expect(wrapper.find('[role="group"]').attributes('aria-label')).toBeUndefined()
      expect(wrapper.findAll('.ui-time-picker__selector').map(radio => radio.attributes('aria-label'))).toEqual([undefined, undefined])
      expect(wrapper.find('[role="slider"]').attributes('aria-label')).toBeUndefined()
      expect(wrapper.find('.ui-time-picker__period').attributes('aria-label')).toBeUndefined()
      wrapper.unmount()
    })

    it('still refuses a typed hour when the app gave no words for why', async () => {
      const wrapper = await mountSuspended(MTimePicker, { props: { mode: 'input', modelValue: '08:30' } })
      const hours = wrapper.find('.ui-time-picker__field')

      await hours.setValue('75')
      await hours.trigger('keydown', { key: 'Enter' })

      expect(hours.attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('[role="alert"] .ui-icon').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('group', () => {
    it('is a group named by its headline', async () => {
      const wrapper = await mountPicker({ label: 'Alarm' })
      const group = wrapper.find('[role="group"]')

      expect(wrapper.find(`#${group.attributes('aria-labelledby')}`).text()).toBe('Alarm')
      expect(group.attributes('aria-label')).toBeUndefined()
    })

    it('is named by ariaLabel when there is no headline', async () => {
      const wrapper = await mountPicker()
      const group = wrapper.find('[role="group"]')

      expect(group.attributes('aria-label')).toBe('Select time')
      expect(group.attributes('aria-labelledby')).toBeUndefined()
    })

    // B7.1d: the selectors' radio group is named like the picker.
    it('names the radio group of the selectors by the headline, else by ariaLabel', async () => {
      const named = await mountPicker({ label: 'Alarm', modelValue: '14:30' })
      const display = named.find('.ui-time-picker__display')
      expect(display.attributes('role')).toBe('radiogroup')
      expect(named.find(`#${display.attributes('aria-labelledby')}`).text()).toBe('Alarm')

      const bare = await mountPicker({ modelValue: '14:30' })
      expect(bare.find('.ui-time-picker__display').attributes('aria-label')).toBe('Select time')
    })

    it('marks the group disabled', async () => {
      const wrapper = await mountPicker({ disabled: true })

      expect(wrapper.find('[role="group"]').attributes('aria-disabled')).toBe('true')
    })

    // EN-04: the root is a wrapper; the consumer's ARIA and attributes belong on the group.
    it('sends fallthrough attributes to the group and keeps class and style on the root', async () => {
      const wrapper = await mountSuspended(MTimePicker, {
        props: { ariaLabel: 'Select time' },
        attrs: { 'class': 'consumer', 'style': 'margin: 0', 'aria-describedby': 'hint', 'data-test': 'alarm' },
      })
      const group = wrapper.find('[role="group"]')

      expect(wrapper.classes()).toContain('consumer')
      expect(wrapper.attributes('style')).toContain('margin')
      expect(wrapper.attributes('aria-describedby')).toBeUndefined()
      expect(group.element).not.toBe(wrapper.element)
      expect(group.attributes('aria-describedby')).toBe('hint')
      expect(group.attributes('data-test')).toBe('alarm')
      expect(group.attributes('aria-label')).toBe('Select time')
      expect(group.classes()).not.toContain('consumer')
      wrapper.unmount()
    })
  })

  describe('selectors', () => {
    it('are radios over the dial, the active part checked and the only tab stop', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })
      const radios = wrapper.findAll('[role="radio"]')

      expect(radios.map(radio => radio.attributes('aria-checked'))).toEqual(['true', 'false'])
      expect(radios.map(radio => radio.attributes('tabindex'))).toEqual(['0', '-1'])
      expect(radios.map(radio => radio.attributes('type'))).toEqual(['button', 'button'])
    })

    it('name the part and say its value', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })

      expect(wrapper.findAll('[role="radio"]').map(radio => radio.attributes('aria-label'))).toEqual(['Hour 14', 'Minute 30'])
    })

    it('name only the part while empty', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.findAll('[role="radio"]').map(radio => radio.attributes('aria-label'))).toEqual(['Hour', 'Minute'])
    })

    it('hide the separator from assistive tech', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })

      expect(wrapper.find('.ui-time-picker__separator').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('dial', () => {
    it('is one slider named by the part it turns, with its range and value text', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })
      const slider = wrapper.find('[role="slider"]')

      expect(slider.attributes('aria-label')).toBe('Hour')
      expect(slider.attributes('aria-valuemin')).toBe('0')
      expect(slider.attributes('aria-valuemax')).toBe('23')
      expect(slider.attributes('aria-valuenow')).toBe('14')
      expect(slider.attributes('tabindex')).toBe('0')
    })

    it('hides the numbers, the hand and the centre — the value text already says them', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })

      expect(wrapper.find('.ui-time-picker__numbers').attributes('aria-hidden')).toBe('true')
      expect(wrapper.find('.ui-time-picker__hand').attributes('aria-hidden')).toBe('true')
      expect(wrapper.find('.ui-time-picker__center').attributes('aria-hidden')).toBe('true')
    })

    it('says it is read-only or disabled', async () => {
      const readonly = await mountPicker({ modelValue: '10:00', readonly: true })
      expect(readonly.find('[role="slider"]').attributes('aria-readonly')).toBe('true')

      const disabled = await mountPicker({ modelValue: '10:00', disabled: true })
      expect(disabled.find('[role="slider"]').attributes('aria-disabled')).toBe('true')
    })
  })

  describe('period', () => {
    it('is a named radio group of two toggle buttons', async () => {
      const wrapper = await mountPicker({ modelValue: '21:00', hourCycle: 'h12' })
      const group = wrapper.find('.ui-time-picker__period')
      const options = wrapper.findAll('.ui-time-picker__period-option')

      expect(group.attributes('role')).toBe('radiogroup')
      expect(group.attributes('aria-label')).toBe('Select AM or PM')
      expect(options.map(option => option.attributes('type'))).toEqual(['button', 'button'])
      expect(options.map(option => option.attributes('aria-checked'))).toEqual(['false', 'true'])
    })

    it('says the period is read-only', async () => {
      const wrapper = await mountPicker({ modelValue: '21:00', hourCycle: 'h12', readonly: true })

      expect(wrapper.find('.ui-time-picker__period').attributes('aria-readonly')).toBe('true')
    })
  })

  describe('typed fields', () => {
    it('are named by the labels under them', async () => {
      const wrapper = await mountPicker({ mode: 'input', modelValue: '08:30' })
      const fields = wrapper.findAll('.ui-time-picker__field')

      expect(wrapper.find(`#${fields[0]!.attributes('aria-labelledby')}`).text()).toBe('Hour')
      expect(wrapper.find(`#${fields[1]!.attributes('aria-labelledby')}`).text()).toBe('Minute')
    })

    // B7.1a: as in the date picker, a message alone is an error.
    it('show the message of the app as an error without the error flag', async () => {
      const wrapper = await mountPicker({ mode: 'input', errorMessage: 'Too late' })

      expect(wrapper.find('[role="alert"]').text()).toBe('Too late')
      expect(wrapper.find('.ui-time-picker__field').attributes('aria-invalid')).toBe('true')
    })

    it('show the message of the app on the dial too', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30', errorMessage: 'Too late' })

      expect(wrapper.find('[role="alert"]').text()).toBe('Too late')
    })

    it('show the app\'s error and are marked invalid', async () => {
      const wrapper = await mountPicker({ mode: 'input', error: true, errorMessage: 'Too late' })

      expect(wrapper.find('[role="alert"]').text()).toBe('Too late')
      expect(wrapper.find('.ui-time-picker__field').attributes('aria-invalid')).toBe('true')
    })

    it('point at the helper while it shows', async () => {
      const wrapper = await mountPicker({ mode: 'input' }, { slots: { helper: () => 'Opening hours 9–18' } })
      const helper = wrapper.find('.ui-picker-support__line:not([role="alert"])')

      expect(wrapper.find('.ui-time-picker__field').attributes('aria-describedby')).toContain(helper.attributes('id'))
    })

    it('point at the error once a part is refused', async () => {
      const wrapper = await mountPicker({ mode: 'input', helperText: 'Opening hours 9–18', modelValue: '14:30' })
      const minutes = wrapper.findAll('.ui-time-picker__field')[1]!

      await minutes.setValue('75')
      await minutes.trigger('blur')

      expect(minutes.attributes('aria-describedby')).toBe(wrapper.find('[role="alert"]').attributes('id'))
    })
  })

  describe('mode switch', () => {
    it('is named by the app for the mode it switches to', async () => {
      const wrapper = await mountPicker({ modeToggle: true, switchToInputLabel: 'Type the time', switchToPickerLabel: 'Use the dial' })

      expect(wrapper.find('.ui-time-picker__actions button').attributes('aria-label')).toBe('Type the time')
    })
  })
})
