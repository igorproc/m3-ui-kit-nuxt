import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick } from 'vue'
import MDatePicker from '../index.vue'
import { provideDatePickerHosted } from '../context'
import { LABELS, OCT_14, cell, mountPicker, unmountPicker } from './helpers'

afterEach(unmountPicker)

describe('m-date-picker · variants', () => {
  describe('anatomy', () => {
    it('draws a title, the headline, a divider and the calendar', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      expect(wrapper.find('.ui-date-picker__title').text()).toBe('Select date')
      expect(wrapper.find('.ui-date-picker__headline').text()).toBe('Oct 14, 2026')
      expect(wrapper.find('.ui-date-picker__divider').exists()).toBe(true)
      expect(wrapper.find('[role="grid"]').exists()).toBe(true)
    })

    it('shows a dash for the headline while nothing is chosen', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.find('.ui-date-picker__headline').text()).toBe('—')
    })

    it('draws six weeks with no day of a neighbouring month', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      expect(wrapper.findAll('[role="row"]')).toHaveLength(7)
      expect(wrapper.findAll('.ui-date-picker__day')).toHaveLength(31)
    })

    it('has no actions of its own', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      expect(wrapper.find('.ui-date-picker__actions').exists()).toBe(false)
    })

    it('flips only the arrow glyphs for right-to-left, never the buttons', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.findAll('.ui-date-picker__arrow-icon')).toHaveLength(2)
      expect(wrapper.findAll('.ui-date-picker__arrow .ui-date-picker__arrow-icon')).toHaveLength(2)
    })
  })

  describe('mode', () => {
    it('defaults to the calendar', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.find('.ui-date-picker__calendar').exists()).toBe(true)
      expect(wrapper.find('.ui-date-picker__input').exists()).toBe(false)
    })

    it('draws the typed field in input mode, under its own title', async () => {
      const wrapper = await mountPicker({ mode: 'input' })

      expect(wrapper.find('.ui-date-picker__input input').exists()).toBe(true)
      expect(wrapper.find('.ui-date-picker__calendar').exists()).toBe(false)
      expect(wrapper.find('.ui-date-picker__title').text()).toBe('Enter date')
    })

    it.each([
      ['picker', 'Switch to text input mode'],
      ['input', 'Switch to calendar input mode'],
    ] as const)('offers the switch named for the other mode in %s mode', async (mode, name) => {
      const wrapper = await mountPicker({ mode, modeToggle: true })

      expect(wrapper.find('.ui-date-picker__mode').attributes('aria-label')).toBe(name)
    })

    // Q37-А: as the time picker — off by default, named by the app when on.
    it('offers no switch by default', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.find('.ui-date-picker__mode').exists()).toBe(false)
    })

    it('leaves the switch out when the toggle is off', async () => {
      const wrapper = await mountPicker({ modeToggle: false })

      expect(wrapper.find('.ui-date-picker__mode').exists()).toBe(false)
    })

    it('shows the locale\'s pattern in the empty typed field', async () => {
      const wrapper = await mountPicker({ mode: 'input', locale: 'de-DE' })

      expect(wrapper.find('.ui-date-picker__input input').attributes('placeholder')).toBe('DD.MM.YYYY')
    })

    it('lays the app\'s pattern letters out in the locale\'s order', async () => {
      const wrapper = await mountPicker({ mode: 'input', locale: 'ru-RU', patternLetters: { day: 'ДД', month: 'ММ', year: 'ГГГГ' } })

      expect(wrapper.find('.ui-date-picker__input input').attributes('placeholder')).toBe('ДД.ММ.ГГГГ')
    })

    it('shows no pattern of its own without letters or a placeholder', async () => {
      const wrapper = await mountPicker({ mode: 'input', patternLetters: undefined })

      expect(wrapper.find('.ui-date-picker__input input').attributes('placeholder')).toBeUndefined()
    })

    it('takes a placeholder of the app\'s own in place of the pattern', async () => {
      const wrapper = await mountPicker({ mode: 'input', placeholder: 'ДД.ММ.ГГГГ' })

      expect(wrapper.find('.ui-date-picker__input input').attributes('placeholder')).toBe('ДД.ММ.ГГГГ')
    })
  })

  describe('view', () => {
    it('opens the year list in place of the days', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      await wrapper.find('.ui-date-picker__view-toggle').trigger('click')
      await nextTick()

      expect(wrapper.find('.ui-date-picker__years').exists()).toBe(true)
      expect(wrapper.find('.ui-date-picker__view-toggle').classes()).toContain('ui-date-picker__view-toggle--open')
      expect(wrapper.find('.ui-date-picker__year--selected').text()).toBe('2026')
      expect(wrapper.find('.ui-date-picker__arrows').exists()).toBe(false)
    })
  })

  describe('day states', () => {
    it('marks the chosen day', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() })

      expect(cell(wrapper, 'Wednesday, October 14, 2026').classes()).toContain('ui-date-picker__day--selected')
    })

    it('marks the days outside min and max as unavailable', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), minDate: new Date(2026, 9, 10), maxDate: new Date(2026, 9, 20) })

      expect(cell(wrapper, 'Friday, October 9, 2026').classes()).toContain('ui-date-picker__day--unavailable')
      expect(cell(wrapper, 'Wednesday, October 21, 2026').classes()).toContain('ui-date-picker__day--unavailable')
      expect(cell(wrapper, 'Saturday, October 10, 2026').classes()).not.toContain('ui-date-picker__day--unavailable')
    })
  })

  describe('state modifiers', () => {
    it.each(['disabled', 'readonly'] as const)('carries the %s modifier', async (state) => {
      const wrapper = await mountPicker({ [state]: true })

      expect(wrapper.classes()).toContain(`ui-date-picker--${state}`)
    })

    it('carries no state modifier at rest', async () => {
      const wrapper = await mountPicker()

      for (const state of ['disabled', 'readonly', 'hosted']) {
        expect(wrapper.classes()).not.toContain(`ui-date-picker--${state}`)
      }
    })

    it('drops its own surface inside a host that draws one', async () => {
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          provideDatePickerHosted(true)
          return () => h(MDatePicker, { ...LABELS })
        },
      }))

      expect(wrapper.find('.ui-date-picker').classes()).toContain('ui-date-picker--hosted')
      wrapper.unmount()
    })
  })

  describe('locale', () => {
    it('names, formats and starts the week in the locale', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), locale: 'de-DE' })

      expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain('Oktober 2026')
      expect(wrapper.find('[role="columnheader"]').attributes('aria-label')).toBe('Montag')
    })

    it('starts the week on Sunday in en-US', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14(), locale: 'en-US' })

      expect(wrapper.find('[role="columnheader"]').attributes('aria-label')).toBe('Sunday')
    })
  })

  describe('slots', () => {
    it('replaces the title with the label slot', async () => {
      const wrapper = await mountPicker({}, { slots: { label: () => 'Delivery day' } })

      expect(wrapper.find('.ui-date-picker__title').text()).toBe('Delivery day')
    })

    it('hands the chosen date to the headline slot', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() }, {
        slots: { headline: ({ date }: { date: Date | null }) => `day ${date?.getDate()}` },
      })

      expect(wrapper.find('.ui-date-picker__headline').text()).toBe('day 14')
    })

    it('hands each day cell to the day slot', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() }, {
        slots: { day: ({ day }: { day: { label: string } }) => h('b', { class: 'busy' }, day.label) },
      })

      expect(wrapper.findAll('.busy')).toHaveLength(31)
    })

    it('hands each year to the year slot', async () => {
      const wrapper = await mountPicker({ modelValue: OCT_14() }, {
        slots: { year: ({ year }: { year: number }) => h('i', { class: 'year' }, String(year)) },
      })

      await wrapper.find('.ui-date-picker__view-toggle').trigger('click')
      await nextTick()

      expect(wrapper.findAll('.year').length).toBeGreaterThan(0)
    })

    it('renders the actions slot under the picker', async () => {
      const wrapper = await mountPicker({}, { slots: { actions: () => 'Done' } })

      expect(wrapper.find('.ui-date-picker__actions').text()).toBe('Done')
    })

    it('fills the support line from the helper slot', async () => {
      const wrapper = await mountPicker({}, { slots: { helper: () => 'Working days only' } })

      expect(wrapper.find('.ui-picker-support').text()).toContain('Working days only')
    })
  })

  describe('support line', () => {
    it('keeps no support line while it is not a form control', async () => {
      const wrapper = await mountPicker()

      expect(wrapper.find('.ui-picker-support').exists()).toBe(false)
    })

    it.each([
      ['a helper text', { helperText: 'Hint' }],
      ['an error flag', { error: true }],
      ['an error message', { errorMessage: 'Pick a day' }],
      ['required', { required: true }],
      ['a form name', { name: 'delivery' }],
    ])('reserves the line for %s', async (_, props) => {
      const wrapper = await mountPicker(props)

      expect(wrapper.find('.ui-picker-support').exists()).toBe(true)
    })
  })
})
