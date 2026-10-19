import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { createClock } from '#kit/utils/time/createClock'
import type { HourCycle } from '#kit/utils/time/createClock'
import { useTimeDialControl } from './useTimeDialControl'
import { useTimeFieldsControl } from './useTimeFieldsControl'
import { useTimePickerControl } from './useTimePickerControl'

type Bag = object

/** Mounts the bags on anonymous markup — no kit component, no kit class. */
function createHarness(initial = '09:30', cycle: HourCycle = 'h23') {
  const model = ref(initial)
  const exposed: { bags: () => Bag[], control?: ReturnType<typeof useTimePickerControl>, dial?: ReturnType<typeof useTimeDialControl> } = { bags: () => [] }

  const component = defineComponent({
    setup() {
      const clock = computed(() => createClock('en-US', cycle))
      const state = { disabled: () => false, readonly: () => false }
      const labels = () => ({ hour: 'Hour', minute: 'Minute', period: 'Period' })
      const control = useTimePickerControl({ model, clock, ...state, labels, labelledBy: () => undefined, label: () => 'Time' }, 'harness')
      const dial = useTimeDialControl({ clock, control, ...state, labels })
      const fields = useTimeFieldsControl({
        clock,
        control,
        ...state,
        required: () => false,
        labels: () => ({ hourError: 'Bad hour', minuteError: 'Bad minute' }),
        externalError: () => undefined,
        describedBy: () => undefined,
      }, 'fields')

      exposed.control = control
      exposed.dial = dial
      exposed.bags = () => [
        control.rootAttrs.value,
        control.getSelectorAttrs('hours'),
        control.getSelectorAttrs('minutes'),
        control.periodGroupAttrs.value,
        control.getPeriodAttrs('am'),
        dial.dialAttrs.value,
        fields.getFieldAttrs('hours'),
      ]

      return () => h('div', control.rootAttrs.value, [
        h('div', { role: 'radiogroup' }, [h('button', control.getSelectorAttrs('hours')), h('button', control.getSelectorAttrs('minutes'))]),
        h('div', control.periodGroupAttrs.value, [h('button', control.getPeriodAttrs('am')), h('button', control.getPeriodAttrs('pm'))]),
        h('div', dial.dialAttrs.value),
        h('input', fields.getFieldAttrs('hours')),
        h('input', fields.getFieldAttrs('minutes')),
        h('output', fields.errorText.value),
      ])
    },
  })

  return { component, model, exposed }
}

describe('useTimePickerControl', () => {
  it('wires a group, two selectors, a period and a dial to anonymous markup', async () => {
    const { component } = createHarness('21:30', 'h12')
    const wrapper = await mountSuspended(component)

    expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('Time')
    expect(wrapper.find('#harness-hours').attributes('aria-checked')).toBe('true')
    expect(wrapper.find('#harness-hours').attributes('aria-label')).toBe('Hour 09')
    expect(wrapper.find('#harness-pm').attributes('aria-checked')).toBe('true')
    expect(wrapper.find('[role="slider"]').attributes('aria-valuetext')).toBe('9 PM')
  })

  it('wraps the dial past its top with the arrows', async () => {
    const { component, model } = createHarness('23:30')
    const wrapper = await mountSuspended(component)

    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowUp' })
    expect(model.value).toBe('00:30')

    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowDown' })
    expect(model.value).toBe('23:30')
  })

  it('turns the minutes once the minute selector is chosen', async () => {
    const { component, model } = createHarness('09:59')
    const wrapper = await mountSuspended(component)

    await wrapper.find('#harness-minutes').trigger('click')
    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    expect(model.value).toBe('09:00')
  })

  it('moves the period without touching the face hour', async () => {
    const { component, model } = createHarness('09:30', 'h12')
    const wrapper = await mountSuspended(component)

    await wrapper.find('#harness-am').trigger('keydown', { key: 'ArrowRight' })
    expect(model.value).toBe('21:30')
  })

  it('holds nothing chosen on an empty model', async () => {
    const { component } = createHarness('')
    const wrapper = await mountSuspended(component)

    expect(wrapper.findAll('[aria-checked="true"]').filter(node => node.attributes('id')?.startsWith('harness-h'))).toHaveLength(0)
    expect(wrapper.find('#harness-hours').attributes('tabindex')).toBe('0')
    // A slider always has a value: with nothing chosen it is where the keyboard starts.
    expect(wrapper.find('[role="slider"]').attributes('aria-valuenow')).toBe(wrapper.find('[role="slider"]').attributes('aria-valuemin'))
    expect(wrapper.find('[role="slider"]').attributes('aria-valuetext')).toBeUndefined()
  })

  it('shows nothing chosen for a model it cannot read', async () => {
    const { component } = createHarness('25:00')
    const wrapper = await mountSuspended(component)

    expect(wrapper.find('[role="slider"]').attributes('aria-valuenow')).toBe(wrapper.find('[role="slider"]').attributes('aria-valuemin'))
    expect(wrapper.find('[role="slider"]').attributes('aria-valuetext')).toBeUndefined()
  })

  it('reads typed parts on blur, shows a refusal and never clamps', async () => {
    const { component, model } = createHarness('09:30')
    const wrapper = await mountSuspended(component)
    const hours = wrapper.find('#fields-hours-field')

    await hours.setValue('75')
    await hours.trigger('blur')
    expect(wrapper.find('output').text()).toBe('Bad hour')
    expect(hours.attributes('aria-invalid')).toBe('true')
    expect(model.value).toBe('09:30')

    await hours.setValue('14')
    await hours.trigger('blur')
    await nextTick()
    expect(model.value).toBe('14:30')
  })

  it('takes a pasted time in one go', async () => {
    const { component, model } = createHarness('09:30')
    const wrapper = await mountSuspended(component)
    const hours = wrapper.find('#fields-hours-field')

    const event = new Event('paste', { cancelable: true }) as ClipboardEvent
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => '9:45 pm' } })
    hours.element.dispatchEvent(event)

    expect(model.value).toBe('21:45')
    expect(event.defaultPrevented).toBe(true)
  })

  it('carries the hand under a dragging pointer and settles it on the value at release', async () => {
    const { component, exposed } = createHarness('09:30')
    const wrapper = await mountSuspended(component)
    const dial = wrapper.find('[role="slider"]')

    // The dial measures nothing here (no layout), so its centre is the origin:
    // (10, -10) is 45° clockwise from 12 o'clock.
    await dial.trigger('pointerdown', { button: 0, clientX: 10, clientY: -10, pointerId: 1 })
    expect(exposed.dial!.hand.value.dragging).toBe(false)
    await dial.trigger('pointermove', { clientX: 10, clientY: -10, pointerId: 1 })
    expect(exposed.dial!.hand.value.dragging).toBe(true)
    expect(((exposed.dial!.hand.value.angle % 360) + 360) % 360).toBeCloseTo(45, 5)

    await dial.trigger('pointerup', { pointerId: 1 })
    expect(exposed.dial!.hand.value.dragging).toBe(false)
    expect(((exposed.dial!.hand.value.angle % 360) + 360) % 360 % 30).toBe(0)
  })

  it('produces no classes and no data attributes — presentation stays with the consumer', async () => {
    const { component, exposed } = createHarness('09:30', 'h12')
    await mountSuspended(component)

    for (const bag of exposed.bags()) {
      const keys = Object.keys(bag)
      expect(keys).not.toContain('class')
      expect(keys.filter(key => key.startsWith('data-'))).toHaveLength(0)
    }
  })
})
