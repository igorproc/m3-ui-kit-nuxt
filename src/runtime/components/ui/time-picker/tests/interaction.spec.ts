import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

const dial = (wrapper: Awaited<ReturnType<typeof mountPicker>>) => wrapper.find('[role="slider"]')

describe('m-time-picker · interaction', () => {
  describe('selectors', () => {
    it('switches the dial to minutes from the minute selector', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })

      await wrapper.findAll('.ui-time-picker__selector')[1]!.trigger('click')
      await nextTick()

      expect(dial(wrapper).attributes('aria-label')).toBe('Minute')
      expect(dial(wrapper).attributes('aria-valuetext')).toBe('30 minutes')
    })

    it('moves between the selectors with the arrows', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' }, { attach: true })
      const [hours, minutes] = wrapper.findAll('.ui-time-picker__selector')

      await hours!.trigger('keydown', { key: 'ArrowRight' })

      expect(document.activeElement).toBe(minutes!.element)
      expect(minutes!.attributes('aria-checked')).toBe('true')
    })
  })

  describe('dial keyboard', () => {
    it('turns the hour by one with the arrows', async () => {
      const wrapper = await mountPicker({ modelValue: '14:30' })

      await dial(wrapper).trigger('keydown', { key: 'ArrowUp' })

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['15:30'])
    })

    it('wraps past the top of the face', async () => {
      const wrapper = await mountPicker({ modelValue: '23:30' })

      await dial(wrapper).trigger('keydown', { key: 'ArrowUp' })

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['00:30'])
    })

    it('keeps the period on a 12-hour step past 11 (Q38-А: the period switches on its own)', async () => {
      const wrapper = await mountPicker({ modelValue: '11:00', hourCycle: 'h12' })

      await dial(wrapper).trigger('keydown', { key: 'ArrowUp' })

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['00:00'])
    })

    // Plan (time-picker, keyboard): a page is five, minutes or hours, wrapping past the top.
    it.each([
      ['PageUp', '14:30', '14:35'],
      ['PageDown', '14:30', '14:25'],
      ['PageUp', '14:58', '14:03'],
    ])('turns the minutes by five with %s (%s → %s)', async (key, from, to) => {
      const wrapper = await mountPicker({ modelValue: from })
      await wrapper.findAll('.ui-time-picker__selector')[1]!.trigger('click')

      await dial(wrapper).trigger('keydown', { key })

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([to])
    })

    it('turns the hours by five with Page keys', async () => {
      const wrapper = await mountPicker({ modelValue: '21:30' })

      await dial(wrapper).trigger('keydown', { key: 'PageUp' })

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['02:30'])
    })

    it('starts an empty picker from the first number of the face', async () => {
      const wrapper = await mountPicker()

      expect(dial(wrapper).attributes('aria-valuenow')).toBe('0')
      expect(dial(wrapper).attributes('aria-valuetext')).toBeUndefined()
    })
  })

  describe('period', () => {
    it('switches the period with its buttons, keeping the hour on the face', async () => {
      const wrapper = await mountPicker({ modelValue: '09:15', hourCycle: 'h12' })

      await wrapper.findAll('.ui-time-picker__period-option')[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['21:15'])
    })

    it('keeps the focus on the chosen period while read-only', async () => {
      const wrapper = await mountPicker({ modelValue: '09:00', hourCycle: 'h12', readonly: true }, { attach: true })
      const chosen = wrapper.find('.ui-time-picker__period-option.ui-button--selected')

      ;(chosen.element as HTMLElement).focus()
      await chosen.trigger('keydown', { key: 'ArrowDown' })
      expect(document.activeElement).toBe(chosen.element)
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('re-reads the same model when the cycle changes', async () => {
      const wrapper = await mountPicker({ modelValue: '00:15', hourCycle: 'h23' })
      expect(wrapper.find('.ui-time-picker__selector').text()).toBe('00')

      await wrapper.setProps({ hourCycle: 'h12' })
      expect(wrapper.find('.ui-time-picker__selector').text()).toBe('12')
      expect(wrapper.classes()).toContain('ui-time-picker--h12')
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  describe('typed fields', () => {
    it('shows a refused hour as an error instead of clamping it', async () => {
      const wrapper = await mountPicker({ mode: 'input', modelValue: '08:30', hourError: 'No such hour' })
      const hours = wrapper.find('.ui-time-picker__field')

      await hours.setValue('75')
      await hours.trigger('keydown', { key: 'Enter' })

      expect(wrapper.find('[role="alert"]').text()).toBe('No such hour')
      expect(hours.classes()).toContain('ui-time-picker__field--error')
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('lets a host read a typed time not yet committed', async () => {
      const wrapper = await mountPicker({ mode: 'input', required: true })
      const validate = (wrapper.vm as unknown as { validate: () => boolean }).validate

      expect(validate()).toBe(false)
      await wrapper.find('.ui-time-picker__field').setValue('7')
      await wrapper.findAll('.ui-time-picker__field')[1]!.setValue('5')
      expect(validate()).toBe(true)
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['07:05'])
    })

    it('keeps one support line while typing; a refused part takes the helper’s place', async () => {
      const wrapper = await mountPicker({ mode: 'input', helperText: 'Opening hours 9–18', modelValue: '14:30' })
      const minutes = wrapper.findAll('.ui-time-picker__field')[1]!

      expect(wrapper.find('[role="alert"]').text()).toBe('')
      await minutes.setValue('75')
      await minutes.trigger('blur')

      expect(wrapper.find('[role="alert"]').text()).not.toBe('')
      expect(wrapper.find('[role="alert"] .ui-icon').exists()).toBe(true)
      expect(wrapper.find('.ui-picker-support').text()).not.toContain('Opening hours')
    })

    it('refuses an empty required dial on validate()', async () => {
      const wrapper = await mountPicker({ required: true })
      const picker = wrapper.vm as unknown as { validate: () => boolean }

      expect(picker.validate()).toBe(false)
      await wrapper.setProps({ modelValue: '10:00' })
      expect(picker.validate()).toBe(true)
    })
  })

  describe('mode switch', () => {
    it('flips between the dial and the fields', async () => {
      const wrapper = await mountPicker({
        'modeToggle': true,
        'switchToInputLabel': 'Type the time',
        'switchToPickerLabel': 'Use the dial',
        'onUpdate:mode': () => {},
      })

      await wrapper.find('.ui-time-picker__actions button').trigger('click')

      expect(wrapper.emitted('update:mode')!.at(-1)).toEqual(['input'])
    })
  })

  describe('disabled and read-only', () => {
    it('takes no change while read-only', async () => {
      const wrapper = await mountPicker({ modelValue: '10:00', readonly: true })

      await dial(wrapper).trigger('keydown', { key: 'ArrowUp' })

      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('leaves the tab order while disabled', async () => {
      const wrapper = await mountPicker({ modelValue: '10:00', disabled: true })

      expect(dial(wrapper).attributes('tabindex')).toBe('-1')
      expect(wrapper.find('.ui-time-picker__selector').attributes('disabled')).toBeDefined()
    })

    it('ignores the period buttons while disabled', async () => {
      const wrapper = await mountPicker({ modelValue: '09:00', hourCycle: 'h12', disabled: true })

      await wrapper.findAll('.ui-time-picker__period-option')[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  describe('form', () => {
    it('submits the value with a form under its name', async () => {
      const wrapper = await mountPicker({ modelValue: '10:15', name: 'start' })
      const hidden = wrapper.find('input[type="hidden"]')

      expect(hidden.attributes('name')).toBe('start')
      expect((hidden.element as HTMLInputElement).value).toBe('10:15')
    })

    it('submits nothing while disabled', async () => {
      const wrapper = await mountPicker({ modelValue: '10:15', name: 'start', disabled: true })

      expect(wrapper.find('input[type="hidden"]').attributes('disabled')).toBeDefined()
    })
  })
})
