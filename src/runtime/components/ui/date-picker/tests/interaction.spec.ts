import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { OCT_14, cell, mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

const focusedLabel = (wrapper: Awaited<ReturnType<typeof mountPicker>>) =>
  wrapper.find('[role="gridcell"][tabindex="0"]').attributes('aria-label')

describe('m-date-picker · interaction', () => {
  describe('model', () => {
    it('commits a chosen day at once', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      await cell(wrapper, 'Thursday, October 15, 2026').trigger('click')

      expect((wrapper.emitted('update:modelValue')!.at(-1)![0] as Date).getDate()).toBe(15)
    })

    it('writes a chosen day back in the type the model came in', async () => {
      const wrapper = await mountPicker({ modelValue: '2026-10-14' })

      expect(wrapper.find('.ui-date-picker__headline').text()).toBe('Oct 14, 2026')
      await cell(wrapper, 'Tuesday, October 20, 2026').trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe('2026-10-20')
    })

    it.each([
      ['string', '2026-10-15'],
      ['number', new Date(2026, 9, 15).getTime()],
    ] as const)('writes an empty model as the %s valueType asks', async (valueType, expected) => {
      vi.setSystemTime(OCT_14())
      const wrapper = await mountPicker({ modelValue: null, valueType })
      vi.useRealTimers()

      await cell(wrapper, 'Thursday, October 15, 2026').trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual(expected)
    })

    it('writes an empty model as a Date by default', async () => {
      vi.setSystemTime(OCT_14())
      const wrapper = await mountPicker({ modelValue: null })
      vi.useRealTimers()

      await cell(wrapper, 'Thursday, October 15, 2026').trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBeInstanceOf(Date)
    })

    it('writes a timestamp model back as a timestamp', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14().getTime() })

      await cell(wrapper, 'Thursday, October 15, 2026').trigger('click')

      expect(typeof wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe('number')
    })

    it('keeps unavailable days focusable but never chooses them', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), minDate: new Date(2026, 9, 10) })
      const early = cell(wrapper, 'Friday, October 9, 2026')

      expect(early.attributes('aria-disabled')).toBe('true')
      await early.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('reads min and max on every change', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })
      expect(cell(wrapper, 'Friday, October 9, 2026').attributes('aria-disabled')).toBeUndefined()

      await wrapper.setProps({ minDate: new Date(2026, 9, 10) })
      expect(cell(wrapper, 'Friday, October 9, 2026').attributes('aria-disabled')).toBe('true')
    })
  })

  describe('keyboard', () => {
    it('walks into the next month with the arrows, and Page keys page months', async () => {
      const wrapper = await mountPicker({ modelValue: new Date(2026, 9, 31) }, { attach: true })
      const grid = wrapper.find('[role="grid"]')

      await grid.trigger('keydown', { key: 'ArrowRight' })
      await nextTick()
      expect(focusedLabel(wrapper)).toBe('Sunday, November 1, 2026')
      expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain('November 2026')

      await grid.trigger('keydown', { key: 'PageDown' })
      await nextTick()
      expect(focusedLabel(wrapper)).toBe('Tuesday, December 1, 2026')
    })

    it('chooses the focused day on Enter and on Space', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() }, { attach: true })
      const grid = wrapper.find('[role="grid"]')

      await grid.trigger('keydown', { key: 'ArrowRight' })
      await grid.trigger('keydown', { key: 'Enter' })
      expect((wrapper.emitted('update:modelValue')!.at(-1)![0] as Date).getDate()).toBe(15)

      await grid.trigger('keydown', { key: 'ArrowRight' })
      await grid.trigger('keydown', { key: ' ' })
      expect((wrapper.emitted('update:modelValue')!.at(-1)![0] as Date).getDate()).toBe(16)
    })

    it('stops the arrows at min and max', async () => {
      const wrapper = await mountPicker({ modelValue: new Date(2026, 9, 10), minDate: new Date(2026, 9, 10) }, { attach: true })

      await wrapper.find('[role="grid"]').trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()

      expect(focusedLabel(wrapper)).toBe('Saturday, October 10, 2026')
    })

    it('ignores the keyboard while disabled', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), disabled: true }, { attach: true })

      await wrapper.find('[role="grid"]').trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  describe('month navigation', () => {
    it('pages the month with the arrow buttons', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      await wrapper.find('[aria-label="Next month"]').trigger('click')
      expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain('November 2026')

      await wrapper.find('[aria-label="Previous month"]').trigger('click')
      await wrapper.find('[aria-label="Previous month"]').trigger('click')
      expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain('September 2026')
    })

    it('disables the previous-month arrow at the min-date month', async () => {
      const wrapper = await mountPicker({ modelValue: new Date(2026, 5, 15), minDate: new Date(2026, 5, 1) })

      expect(wrapper.find('[aria-label="Previous month"]').attributes('disabled')).toBeDefined()
    })

    it('disables the next-month arrow at the max-date month', async () => {
      const wrapper = await mountPicker({ modelValue: new Date(2026, 5, 15), maxDate: new Date(2026, 5, 30) })

      expect(wrapper.find('[aria-label="Next month"]').attributes('disabled')).toBeDefined()
    })

    it('shows a year chosen from the list, back on the days', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      await wrapper.find('.ui-date-picker__view-toggle').trigger('click')
      await nextTick()
      await wrapper.findAll('.ui-date-picker__year').find(year => year.text() === '2028')!.trigger('click')
      await nextTick()

      expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain('October 2028')
      expect(wrapper.find('.ui-date-picker__years').exists()).toBe(false)
    })
  })

  // B7.1f: a year whose same month lies outside the bounds lands on the nearest month inside them.
  describe('year bounds', () => {
    it.each([
      ['min', { minDate: new Date(2026, 5, 15), modelValue: new Date(2027, 2, 10) }, '2026', 'June 2026'],
      ['max', { maxDate: new Date(2027, 1, 15), modelValue: new Date(2026, 9, 14) }, '2027', 'February 2027'],
    ] as const)('clamps the month into the %s bound when another year is chosen', async (_, props, year, shown) => {
      const wrapper = await mountPicker(props)

      await wrapper.find('.ui-date-picker__view-toggle').trigger('click')
      await nextTick()
      await wrapper.findAll('.ui-date-picker__year').find(item => item.text() === year)!.trigger('click')
      await nextTick()

      expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain(shown)
    })
  })

  describe('typed date', () => {
    it('switches to a typed date, read on Enter in the locale\'s order', async () => {
      const wrapper = await mountPicker({ locale: 'de-DE', modelValue: null, modeToggle: true })

      await wrapper.find('.ui-date-picker__mode').trigger('click')
      const input = wrapper.find('.ui-date-picker__input input')
      expect(wrapper.emitted('update:mode')!.at(-1)).toEqual(['input'])

      await input.setValue('14.10.2026')
      await input.trigger('keydown', { key: 'Enter' })

      const date = wrapper.emitted('update:modelValue')!.at(-1)![0] as Date
      expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 14])
    })

    it('reads a typed date on blur too', async () => {
      const wrapper = await mountPicker({ mode: 'input' })
      const input = wrapper.find('.ui-date-picker__input input')

      await input.setValue('10/14/2026')
      await input.trigger('blur')

      expect((wrapper.emitted('update:modelValue')!.at(-1)![0] as Date).getDate()).toBe(14)
    })

    it('empties the model when the typed field is cleared', async () => {
      const wrapper = await mountPicker({ mode: 'input', modelValue: OCT_14() })
      const input = wrapper.find('.ui-date-picker__input input')

      await input.setValue('')
      await input.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([null])
    })

    it('says why a typed date is refused, without touching the value', async () => {
      const wrapper = await mountPicker({ mode: 'input', minDate: new Date(2026, 0, 1), errorPattern: 'Bad pattern', errorRange: 'Out of range' })
      const input = wrapper.find('.ui-date-picker__input input')

      await input.setValue('nonsense')
      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.find('[role="alert"]').text()).toBe('Bad pattern')

      await input.setValue('01/01/2020')
      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.find('[role="alert"]').text()).toBe('Out of range')
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('still refuses an unreadable date when the app gave no words for why', async () => {
      const wrapper = await mountPicker({ mode: 'input', errorPattern: undefined })
      const input = wrapper.find('.ui-date-picker__input input')

      await input.setValue('nonsense')
      await input.trigger('keydown', { key: 'Enter' })

      expect(input.attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('.ui-date-picker__input .ui-text-field__support-icon').exists()).toBe(true)
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('lets a host read a typed date not yet committed, and refuse it', async () => {
      const wrapper = await mountPicker({ mode: 'input' })
      const input = wrapper.find('.ui-date-picker__input input')
      const picker = wrapper.vm as unknown as { validate: () => boolean }

      await input.setValue('nonsense')
      expect(picker.validate()).toBe(false)

      await input.setValue('10/14/2026')
      expect(picker.validate()).toBe(true)
      expect((wrapper.emitted('update:modelValue')!.at(-1)![0] as Date).getDate()).toBe(14)
    })
  })

  describe('disabled and read-only', () => {
    it('takes no choice while read-only', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), readonly: true })

      await cell(wrapper, 'Thursday, October 15, 2026').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('lets a read-only picker page months — looking around is not a choice', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), readonly: true })

      await wrapper.find('[aria-label="Next month"]').trigger('click')

      expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain('November 2026')
    })

    it('takes every day out of the tab order while disabled', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), disabled: true })

      expect(wrapper.findAll('[role="gridcell"][tabindex="0"]')).toHaveLength(0)
    })

    it('disables the month controls and the switch while disabled', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), disabled: true, modeToggle: true })

      expect(wrapper.find('.ui-date-picker__view-toggle').attributes('disabled')).toBeDefined()
      expect(wrapper.find('[aria-label="Next month"]').attributes('disabled')).toBeDefined()
      expect(wrapper.find('.ui-date-picker__mode').attributes('disabled')).toBeDefined()
    })
  })

  describe('form', () => {
    it('submits the chosen day with a form', async () => {
      const wrapper = await mountPicker({ modelValue: new Date(2026, 9, 4), name: 'delivery' })
      const hidden = wrapper.find('input[type="hidden"]')

      expect(hidden.attributes('name')).toBe('delivery')
      expect((hidden.element as HTMLInputElement).value).toBe('2026-10-04')
    })

    it('submits nothing while disabled', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), name: 'delivery', disabled: true })

      expect(wrapper.find('input[type="hidden"]').attributes('disabled')).toBeDefined()
    })

    it('refuses an empty required picker on validate()', async () => {
      const wrapper = await mountPicker({ required: true })
      const picker = wrapper.vm as unknown as { validate: () => boolean }

      expect(picker.validate()).toBe(false)
      await wrapper.setProps({ modelValue: new Date(2026, 9, 4) })
      expect(picker.validate()).toBe(true)
    })
  })
})
