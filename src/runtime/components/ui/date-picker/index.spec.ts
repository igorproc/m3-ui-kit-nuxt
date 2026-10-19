import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MDatePicker from './index.vue'

const cell = (wrapper: Pick<VueWrapper, 'findAll'>, label: string) =>
  wrapper.findAll('[role="gridcell"]').find(item => item.attributes('aria-label') === label)!

describe('m-date-picker', () => {
  it('is a group named by its title, with a headline, a divider and the calendar', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14) } })
    const group = wrapper.find('.ui-date-picker')

    expect(group.attributes('role')).toBe('group')
    expect(wrapper.find(`#${group.attributes('aria-labelledby')}`).text()).toBe('Select date')
    expect(wrapper.find('.ui-date-picker__headline').text()).toBe('Oct 14, 2026')
    expect(wrapper.find('.ui-date-picker__divider').exists()).toBe(true)
    expect(wrapper.find('[role="grid"]').exists()).toBe(true)
  })

  it('has no actions of its own: choosing a day commits it', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14) } })

    expect(wrapper.find('.ui-date-picker__actions').exists()).toBe(false)
    await cell(wrapper, 'Thursday, October 15, 2026').trigger('click')

    expect((wrapper.emitted('update:modelValue')!.at(-1)![0] as Date).getDate()).toBe(15)
  })

  it('writes a chosen day back in the type the model came in', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: '2026-10-14' } })

    expect(wrapper.find('.ui-date-picker__headline').text()).toBe('Oct 14, 2026')
    await cell(wrapper, 'Tuesday, October 20, 2026').trigger('click')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe('2026-10-20')
  })

  it('draws six weeks with no day of a neighbouring month', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14) } })
    const days = wrapper.findAll('.ui-date-picker__day')

    expect(wrapper.findAll('[role="row"]')).toHaveLength(7)
    expect(days).toHaveLength(31)
  })

  it('keeps one tab stop, on the chosen day', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14) } })
    const stops = wrapper.findAll('[role="gridcell"][tabindex="0"]')

    expect(stops).toHaveLength(1)
    expect(stops[0]!.attributes('aria-selected')).toBe('true')
  })

  it('walks into the next month with the arrows, and Page keys page months', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 31) }, attachTo: document.body })
    const grid = wrapper.find('[role="grid"]')

    await grid.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(wrapper.find('[role="gridcell"][tabindex="0"]').attributes('aria-label')).toBe('Sunday, November 1, 2026')
    expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain('November 2026')

    await grid.trigger('keydown', { key: 'PageDown' })
    await nextTick()
    expect(wrapper.find('[role="gridcell"][tabindex="0"]').attributes('aria-label')).toBe('Tuesday, December 1, 2026')
    wrapper.unmount()
  })

  it('keeps unavailable days focusable but never chooses them', async () => {
    const wrapper = await mountSuspended(MDatePicker, {
      props: { modelValue: new Date(2026, 9, 14), minDate: new Date(2026, 9, 10) },
    })
    const early = cell(wrapper, 'Friday, October 9, 2026')

    expect(early.attributes('aria-disabled')).toBe('true')
    await early.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('disables the previous-month arrow at the min-date month', async () => {
    const wrapper = await mountSuspended(MDatePicker, {
      props: { modelValue: new Date(2026, 5, 15), minDate: new Date(2026, 5, 1), prevMonthLabel: 'Previous month' },
    })

    expect(wrapper.find('[aria-label="Previous month"]').attributes('disabled')).toBeDefined()
  })

  it('reads min and max on every change', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14) } })
    expect(cell(wrapper, 'Friday, October 9, 2026').attributes('aria-disabled')).toBeUndefined()

    await wrapper.setProps({ minDate: new Date(2026, 9, 10) })
    expect(cell(wrapper, 'Friday, October 9, 2026').attributes('aria-disabled')).toBe('true')
  })

  it('opens the year list from the month toggle, which says it is expanded', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14) } })
    const toggle = wrapper.find('.ui-date-picker__view-toggle')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    await nextTick()

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find(`#${toggle.attributes('aria-controls')}`).exists()).toBe(true)
    expect(wrapper.find('.ui-date-picker__year--selected').text()).toBe('2026')
  })

  it('names, formats and starts the week in the locale', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14), locale: 'de-DE' } })

    expect(wrapper.find('.ui-date-picker__view-toggle').text()).toContain('Oktober 2026')
    expect(wrapper.find('[role="columnheader"]').attributes('aria-label')).toBe('Montag')
  })

  it('switches to a typed date, read on Enter in the locale\'s order', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { locale: 'de-DE', modelValue: null } })

    await wrapper.find('.ui-date-picker__mode').trigger('click')
    const input = wrapper.find('.ui-date-picker__input input')
    expect(wrapper.emitted('update:mode')!.at(-1)).toEqual(['input'])

    await input.setValue('14.10.2026')
    await input.trigger('keydown', { key: 'Enter' })

    const date = wrapper.emitted('update:modelValue')!.at(-1)![0] as Date
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 14])
  })

  it('says why a typed date is refused, without touching the value', async () => {
    const wrapper = await mountSuspended(MDatePicker, {
      props: { mode: 'input', minDate: new Date(2026, 0, 1), errorPattern: 'Bad pattern', errorRange: 'Out of range' },
    })
    const input = wrapper.find('.ui-date-picker__input input')

    await input.setValue('nonsense')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('[role="alert"]').text()).toBe('Bad pattern')

    await input.setValue('01/01/2020')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('[role="alert"]').text()).toBe('Out of range')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('lets a host read a typed date not yet committed, and refuse it', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { mode: 'input' } })
    const input = wrapper.find('.ui-date-picker__input input')

    await input.setValue('nonsense')
    expect((wrapper.vm as unknown as { validate: () => boolean }).validate()).toBe(false)

    await input.setValue('10/14/2026')
    expect((wrapper.vm as unknown as { validate: () => boolean }).validate()).toBe(true)
    expect((wrapper.emitted('update:modelValue')!.at(-1)![0] as Date).getDate()).toBe(14)
  })

  it('shows the locale\'s pattern in the empty typed field', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { mode: 'input', locale: 'de-DE' } })

    expect(wrapper.find('.ui-date-picker__input input').attributes('placeholder')).toBe('DD.MM.YYYY')
  })

  it('takes no choice while read-only', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14), readonly: true } })

    await cell(wrapper, 'Thursday, October 15, 2026').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('takes every day out of the tab order while disabled', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 14), disabled: true } })

    expect(wrapper.findAll('[role="gridcell"][tabindex="0"]')).toHaveLength(0)
  })

  it('renders the actions slot under the picker', async () => {
    const wrapper = await mountSuspended(MDatePicker, { slots: { actions: () => 'Done' } })

    expect(wrapper.find('.ui-date-picker__actions').text()).toBe('Done')
  })

  it('keeps no support line while it is not a form control', async () => {
    const wrapper = await mountSuspended(MDatePicker)

    expect(wrapper.find('.ui-picker-support').exists()).toBe(false)
    expect(wrapper.find('.ui-date-picker').attributes('aria-describedby')).toBeUndefined()
  })

  it('reserves its support line in a form; an error takes the place of the helper, with a glyph', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { helperText: 'Working days only', name: 'delivery' } })
    const group = wrapper.find('.ui-date-picker')

    expect(wrapper.find(`#${group.attributes('aria-describedby')}`).text()).toBe('Working days only')
    expect(wrapper.find('[role="alert"]').text()).toBe('')

    await wrapper.setProps({ error: true, errorMessage: 'Pick a working day' })
    expect(wrapper.find('[role="alert"]').text()).toBe('Pick a working day')
    expect(wrapper.find('[role="alert"] .ui-icon').exists()).toBe(true)
    expect(wrapper.find('.ui-picker-support').text()).not.toContain('Working days only')
    expect(group.attributes('aria-describedby')).toBe(wrapper.find('[role="alert"]').attributes('id'))
  })

  it('submits the chosen day with a form', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { modelValue: new Date(2026, 9, 4), name: 'delivery' } })
    const hidden = wrapper.find('input[type="hidden"]')

    expect(hidden.attributes('name')).toBe('delivery')
    expect((hidden.element as HTMLInputElement).value).toBe('2026-10-04')
  })

  it('refuses an empty required picker on validate()', async () => {
    const wrapper = await mountSuspended(MDatePicker, { props: { required: true } })
    const picker = wrapper.vm as unknown as { validate: () => boolean }

    expect(picker.validate()).toBe(false)
    await wrapper.setProps({ modelValue: new Date(2026, 9, 4) })
    expect(picker.validate()).toBe(true)
  })

  it('flips only the arrow glyphs for right-to-left, never the buttons', async () => {
    const wrapper = await mountSuspended(MDatePicker)

    expect(wrapper.findAll('.ui-date-picker__arrow-icon')).toHaveLength(2)
    expect(wrapper.findAll('.ui-date-picker__arrow .ui-date-picker__arrow-icon')).toHaveLength(2)
  })
})
