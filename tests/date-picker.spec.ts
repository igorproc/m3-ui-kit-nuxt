import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MDatePicker from '../app/components/ui/date-picker/index.vue'

describe('m-date-picker', () => {
  it('renders the calendar view by default with header, grid and footer', async () => {
    const wrapper = await mountSuspended(MDatePicker)

    expect(wrapper.find('.ui-date-picker').exists()).toBe(true)
    expect(wrapper.find('.ui-date-picker__header').exists()).toBe(true)
    expect(wrapper.find('.ui-date-picker__calendar').exists()).toBe(true)
    expect(wrapper.find('.ui-date-picker__footer').exists()).toBe(true)
  })

  it('exposes the calendar grid with grid/row/gridcell a11y roles', async () => {
    const wrapper = await mountSuspended(MDatePicker)

    expect(wrapper.find('[role="grid"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="row"]').length).toBeGreaterThan(0)
    expect(wrapper.findAll('[role="gridcell"]').length).toBeGreaterThan(0)
  })

  it('renders the headline from the headline prop', async () => {
    const wrapper = await mountSuspended(MDatePicker, {
      props: { headline: 'Choose a day' },
    })

    expect(wrapper.find('.ui-date-picker__headline-label').text()).toBe('Choose a day')
  })

  it('marks the headline date as placeholder when there is no value', async () => {
    const wrapper = await mountSuspended(MDatePicker, {
      props: { modelValue: null },
    })

    expect(wrapper.find('.ui-date-picker__headline-date--placeholder').exists()).toBe(true)
  })

  it('switches to the year view when the header toggle is clicked', async () => {
    const wrapper = await mountSuspended(MDatePicker)

    expect(wrapper.find('.ui-date-picker__year-grid').exists()).toBe(false)

    await wrapper.find('.ui-date-picker__view-toggle').trigger('click')

    expect(wrapper.find('.ui-date-picker__year-grid').exists()).toBe(true)
    expect(wrapper.find('.ui-date-picker__calendar').exists()).toBe(false)
  })

  it('emits update:modelValue when a day is selected', async () => {
    const wrapper = await mountSuspended(MDatePicker, {
      props: { modelValue: new Date(2026, 5, 15) },
    })

    const enabledDay = wrapper.findAll('.ui-date-picker__day:not(.ui-date-picker__day--disabled)')[0]!
    await enabledDay.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('emits cancel when the Cancel button is clicked', async () => {
    const wrapper = await mountSuspended(MDatePicker)

    const cancelBtn = wrapper.findAll('.ui-date-picker__footer button')[0]!
    await cancelBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('emits confirm with the current value when OK is clicked', async () => {
    const value = new Date(2026, 5, 15)
    const wrapper = await mountSuspended(MDatePicker, {
      props: { modelValue: value },
    })

    const okBtn = wrapper.findAll('.ui-date-picker__footer button')[1]!
    await okBtn.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('disables the previous-month arrow when at the min-date boundary', async () => {
    const current = new Date(2026, 5, 15)
    const wrapper = await mountSuspended(MDatePicker, {
      props: { modelValue: current, minDate: new Date(2026, 5, 1) },
    })

    const prevArrow = wrapper.find('button[aria-label="Previous month"]')
    expect(prevArrow.exists()).toBe(true)
    expect(prevArrow.attributes('disabled')).toBeDefined()
  })
})
