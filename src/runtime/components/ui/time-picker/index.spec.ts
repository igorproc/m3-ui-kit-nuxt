import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import MTimePicker from './index.vue'

describe('m-time-picker', () => {
  it('turns a dial by default, with two selectors over it and no fields', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { modelValue: '14:30' } })

    expect(wrapper.find('.ui-time-picker--picker').exists()).toBe(true)
    expect(wrapper.findAll('[role="radio"]').map(radio => radio.text())).toEqual(['14', '30'])
    expect(wrapper.find('[role="slider"]').attributes('aria-valuenow')).toBe('14')
    expect(wrapper.find('input:not([type="hidden"])').exists()).toBe(false)
  })

  it('is a group named by its headline, or by a phrase when there is none', async () => {
    const named = await mountSuspended(MTimePicker, { props: { label: 'Alarm' } })
    const group = named.find('[role="group"]')
    expect(named.find(`#${group.attributes('aria-labelledby')}`).text()).toBe('Alarm')

    const bare = await mountSuspended(MTimePicker)
    expect(bare.find('[role="group"]').attributes('aria-label')).toBe('Select time')
  })

  it('pads the hour to two digits', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { modelValue: '09:05' } })

    expect(wrapper.find('.ui-time-picker__selector').text()).toBe('09')
  })

  it('shows nothing chosen on an empty model', async () => {
    const wrapper = await mountSuspended(MTimePicker)

    expect(wrapper.find('.ui-time-picker__selector--selected').exists()).toBe(false)
    expect(wrapper.find('.ui-time-picker__hand').exists()).toBe(false)
  })

  it('switches the dial to minutes from the minute selector', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { modelValue: '14:30' } })

    await wrapper.findAll('.ui-time-picker__selector')[1]!.trigger('click')
    await nextTick()

    const dial = wrapper.find('[role="slider"]')
    expect(dial.attributes('aria-label')).toBe('Minute')
    expect(dial.attributes('aria-valuetext')).toBe('30 minutes')
  })

  it('draws the period as a radio group of toggle buttons in a 12-hour cycle only', async () => {
    const h23 = await mountSuspended(MTimePicker, { props: { modelValue: '21:00' } })
    expect(h23.find('.ui-time-picker__period').exists()).toBe(false)
    // The cycle is a modifier, so a 24-hour picker keeps no column for a period.
    expect(h23.find('.ui-time-picker').classes()).toContain('ui-time-picker--h23')

    const h12 = await mountSuspended(MTimePicker, { props: { modelValue: '21:00', hourCycle: 'h12' } })
    const options = h12.findAll('.ui-time-picker__period-option')
    expect(h12.find('.ui-time-picker__period').attributes('role')).toBe('radiogroup')
    expect(options.map(option => option.attributes('type'))).toEqual(['button', 'button'])
    expect(options.map(option => option.attributes('aria-checked'))).toEqual(['false', 'true'])
    expect(h12.find('.ui-time-picker__selector').text()).toBe('09')
    expect(h12.find('.ui-time-picker').classes()).toContain('ui-time-picker--h12')
  })

  it('re-reads the same model when the cycle changes', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { modelValue: '00:15', hourCycle: 'h23' } })
    expect(wrapper.find('.ui-time-picker__selector').text()).toBe('00')

    await wrapper.setProps({ hourCycle: 'h12' })
    expect(wrapper.find('.ui-time-picker__selector').text()).toBe('12')
    expect(wrapper.find('.ui-time-picker').classes()).toContain('ui-time-picker--h12')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('types the time in two fields named by the labels under them', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { mode: 'input', modelValue: '08:30' } })
    const fields = wrapper.findAll('.ui-time-picker__field')

    expect(fields.map(field => (field.element as HTMLInputElement).value)).toEqual(['08', '30'])
    expect(fields.map(field => field.attributes('type'))).toEqual(['text', 'text'])
    expect(wrapper.find(`#${fields[0]!.attributes('aria-labelledby')}`).text()).toBe('Hour')
  })

  it('shows a refused hour as an error instead of clamping it', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { mode: 'input', modelValue: '08:30', hourError: 'No such hour' } })
    const hours = wrapper.find('.ui-time-picker__field')

    await hours.setValue('75')
    await hours.trigger('keydown', { key: 'Enter' })

    expect(wrapper.find('[role="alert"]').text()).toBe('No such hour')
    expect(hours.classes()).toContain('ui-time-picker__field--error')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('lets a host read a typed time not yet committed', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { mode: 'input', required: true } })
    const validate = (wrapper.vm as unknown as { validate: () => boolean }).validate

    expect(validate()).toBe(false)
    await wrapper.find('.ui-time-picker__field').setValue('7')
    await wrapper.findAll('.ui-time-picker__field')[1]!.setValue('5')
    expect(validate()).toBe(true)
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['07:05'])
  })

  it('shows the app\'s error and marks the fields invalid', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { mode: 'input', error: true, errorMessage: 'Too late' } })

    expect(wrapper.find('[role="alert"]').text()).toBe('Too late')
    expect(wrapper.find('.ui-time-picker__field').attributes('aria-invalid')).toBe('true')
  })

  it('takes no change while read-only, and leaves the tab order while disabled', async () => {
    const readonly = await mountSuspended(MTimePicker, { props: { modelValue: '10:00', readonly: true } })
    await readonly.find('[role="slider"]').trigger('keydown', { key: 'ArrowUp' })
    expect(readonly.emitted('update:modelValue')).toBeFalsy()
    expect(readonly.find('[role="slider"]').attributes('aria-readonly')).toBe('true')

    const disabled = await mountSuspended(MTimePicker, { props: { modelValue: '10:00', disabled: true } })
    expect(disabled.find('[role="slider"]').attributes('tabindex')).toBe('-1')
    expect(disabled.find('.ui-time-picker__selector').attributes('disabled')).toBeDefined()
  })

  it('submits the value with a form under its name', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { modelValue: '10:15', name: 'start' } })
    const hidden = wrapper.find('input[type="hidden"]')

    expect(hidden.attributes('name')).toBe('start')
    expect((hidden.element as HTMLInputElement).value).toBe('10:15')
  })

  it('renders the helper slot and points the fields at it', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { mode: 'input' }, slots: { helper: () => 'Opening hours 9–18' } })
    const helper = wrapper.find('.ui-picker-support__line:not([role="alert"])')

    expect(helper.text()).toBe('Opening hours 9–18')
    expect(wrapper.find('.ui-time-picker__field').attributes('aria-describedby')).toContain(helper.attributes('id'))
  })

  it('keeps one support line while typing; a refused part takes the helper’s place', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { mode: 'input', helperText: 'Opening hours 9–18', modelValue: '14:30' } })
    const minutes = wrapper.findAll('.ui-time-picker__field')[1]!

    expect(wrapper.find('[role="alert"]').text()).toBe('')
    await minutes.setValue('75')
    await minutes.trigger('blur')

    expect(wrapper.find('[role="alert"]').text()).not.toBe('')
    expect(wrapper.find('[role="alert"] .ui-icon').exists()).toBe(true)
    expect(wrapper.find('.ui-picker-support').text()).not.toContain('Opening hours')
    expect(minutes.attributes('aria-describedby')).toBe(wrapper.find('[role="alert"]').attributes('id'))
  })

  it('reserves no support line for a dial outside a form', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { modelValue: '14:30' } })

    expect(wrapper.find('.ui-picker-support').exists()).toBe(false)
  })

  it('offers the mode switch only when asked, named by the app', async () => {
    const plain = await mountSuspended(MTimePicker)
    expect(plain.find('.ui-time-picker__actions').exists()).toBe(false)

    const wrapper = await mountSuspended(MTimePicker, {
      props: { 'modeToggle': true, 'switchToInputLabel': 'Type the time', 'switchToPickerLabel': 'Use the dial', 'onUpdate:mode': () => {} },
    })
    const toggle = wrapper.find('.ui-time-picker__actions button')

    expect(toggle.attributes('aria-label')).toBe('Type the time')
    await toggle.trigger('click')
    expect(wrapper.emitted('update:mode')!.at(-1)).toEqual(['input'])
  })

  it('keeps the focus on the chosen period while read-only', async () => {
    const wrapper = await mountSuspended(MTimePicker, { props: { modelValue: '09:00', hourCycle: 'h12', readonly: true }, attachTo: document.body })
    const chosen = wrapper.find('.ui-time-picker__period-option--selected')

    ;(chosen.element as HTMLElement).focus()
    await chosen.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(chosen.element)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    wrapper.unmount()
  })
})
