import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MDatePicker from '../index.vue'
import { OCT_14, cell, mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

describe('m-date-picker · a11y', () => {
  // Q32-А: every phrase comes from the app; the kit ships no English copy.
  describe('no copy of its own', () => {
    it('leaves the title, the arrows and the month toggle unnamed without phrases', async () => {
      const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: OCT_14() } })

      expect(wrapper.find('.ui-date-picker__title').text()).toBe('')
      expect(wrapper.findAll('.ui-date-picker__arrow').every(arrow => arrow.attributes('aria-label') === undefined)).toBe(true)
      expect(wrapper.find('.ui-date-picker__view-toggle .ui-date-picker__sr').text()).toBe('')
      wrapper.unmount()
    })

    it('leaves the typed field unlabelled without phrases', async () => {
      const wrapper = await mountSuspended(MDatePicker, { props: { mode: 'input' } })

      expect(wrapper.find('.ui-date-picker__input label').exists()).toBe(false)
      expect(wrapper.find('.ui-date-picker__title').text()).toBe('')
      wrapper.unmount()
    })
  })

  describe('roles and names', () => {
    it('is a group named by its title', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })
      const group = wrapper.find('.ui-date-picker')

      expect(group.attributes('role')).toBe('group')
      expect(wrapper.find(`#${group.attributes('aria-labelledby')}`).text()).toBe('Select date')
    })

    it('names the group by the input title while typing', async () => {
      const wrapper = await mountPicker({ mode: 'input' })
      const group = wrapper.find('.ui-date-picker')

      expect(wrapper.find(`#${group.attributes('aria-labelledby')}`).text()).toBe('Enter date')
    })

    it('is a grid of rows, weekday column headers and day cells', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      expect(wrapper.find('[role="grid"]').exists()).toBe(true)
      expect(wrapper.findAll('[role="columnheader"]')).toHaveLength(7)
      expect(wrapper.findAll('[role="gridcell"]').length).toBe(42)
    })

    it('names the grid by the month on screen', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })
      const grid = wrapper.find('[role="grid"]')

      expect(wrapper.find(`#${grid.attributes('aria-labelledby')}`).text()).toBe('October 2026')
    })

    it('names each day by its full date and each weekday by its long name', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      expect(cell(wrapper, 'Wednesday, October 14, 2026').text()).toBe('14')
      expect(wrapper.find('[role="columnheader"]').attributes('aria-label')).toBe('Sunday')
    })

    it('names the month arrows and the mode switch', async () => {
      const wrapper = await mountPicker({ modeToggle: true })

      expect(wrapper.find('[aria-label="Previous month"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Next month"]').exists()).toBe(true)
      expect(wrapper.find('.ui-date-picker__mode').attributes('aria-label')).toBe('Switch to text input mode')
    })

    it('says what the month toggle does without hiding what it shows', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })
      const toggle = wrapper.find('.ui-date-picker__view-toggle')

      expect(toggle.text()).toContain('October 2026')
      expect(toggle.find('.ui-date-picker__sr').text()).toBe('Switch to selecting a year')
    })

    it('names the typed field', async () => {
      const wrapper = await mountPicker({ mode: 'input' })
      const input = wrapper.find('.ui-date-picker__input input')

      expect(wrapper.find(`label[for="${input.attributes('id')}"]`).text()).toBe('Date')
    })
  })

  describe('states', () => {
    it('keeps one tab stop, on the chosen day', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })
      const stops = wrapper.findAll('[role="gridcell"][tabindex="0"]')

      expect(stops).toHaveLength(1)
      expect(stops[0]!.attributes('aria-selected')).toBe('true')
    })

    it('marks every other day not selected', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      expect(cell(wrapper, 'Thursday, October 15, 2026').attributes('aria-selected')).toBe('false')
    })

    it('says an unavailable day is unavailable, not only by colour', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), maxDate: new Date(2026, 9, 20) })

      expect(cell(wrapper, 'Wednesday, October 21, 2026').attributes('aria-disabled')).toBe('true')
    })

    it('marks the whole grid disabled, and every day with it', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), disabled: true })

      expect(wrapper.find('[role="grid"]').attributes('aria-disabled')).toBe('true')
      expect(cell(wrapper, 'Thursday, October 15, 2026').attributes('aria-disabled')).toBe('true')
    })

    it('marks the grid read-only', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), readonly: true })

      expect(wrapper.find('[role="grid"]').attributes('aria-readonly')).toBe('true')
    })

    it('opens the year list from the month toggle, which says it is expanded', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })
      const toggle = wrapper.find('.ui-date-picker__view-toggle')

      expect(toggle.attributes('aria-expanded')).toBe('false')
      await toggle.trigger('click')
      await nextTick()

      expect(toggle.attributes('aria-expanded')).toBe('true')
      expect(wrapper.find(`#${toggle.attributes('aria-controls')}`).exists()).toBe(true)
    })

    it('marks the chosen year selected in the year list', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      await wrapper.find('.ui-date-picker__view-toggle').trigger('click')
      await nextTick()

      expect(wrapper.find('.ui-date-picker__year--selected').attributes('aria-selected')).toBe('true')
      expect(wrapper.findAll('.ui-date-picker__year[tabindex="0"]')).toHaveLength(1)
    })

    it('says where the grid has gone after paging months', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })
      const label = wrapper.find('.ui-date-picker__view-toggle [aria-live]')

      expect(label.attributes('aria-live')).toBe('polite')
    })
  })

  describe('support line', () => {
    it('reserves its support line in a form; an error takes the place of the helper, with a glyph', async () => {
      const wrapper = await mountPicker({ helperText: 'Working days only', name: 'delivery' })
      const group = wrapper.find('.ui-date-picker')

      expect(wrapper.find(`#${group.attributes('aria-describedby')}`).text()).toBe('Working days only')
      expect(wrapper.find('[role="alert"]').text()).toBe('')

      await wrapper.setProps({ error: true, errorMessage: 'Pick a working day' })
      expect(wrapper.find('[role="alert"]').text()).toBe('Pick a working day')
      expect(wrapper.find('[role="alert"] .ui-icon').exists()).toBe(true)
      expect(wrapper.find('.ui-picker-support').text()).not.toContain('Working days only')
      expect(group.attributes('aria-describedby')).toBe(wrapper.find('[role="alert"]').attributes('id'))
    })

    it('keeps the group undescribed while it is not a form control', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.find('.ui-date-picker').attributes('aria-describedby')).toBeUndefined()
    })

    it('hides the error glyph from assistive tech', async () => {
      const wrapper = await mountPicker({ errorMessage: 'Pick a day' })

      expect(wrapper.find('.ui-picker-support__icon').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('decoration', () => {
    it('hides the divider and the dropdown glyph', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.find('.ui-date-picker__divider').attributes('aria-hidden')).toBe('true')
      expect(wrapper.find('.ui-date-picker__view-toggle-icon').attributes('aria-hidden')).toBe('true')
    })
  })
})
