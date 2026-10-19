import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { createCalendar } from '#kit/utils/date/createCalendar'
import { useDateGridControl } from './useDateGridControl'
import type { DateGridControlOptions } from './useDateGridControl'

type Control = ReturnType<typeof useDateGridControl>

/** Mounts the bags on anonymous markup — no kit component, no kit class. */
function createHarness(overrides: Partial<DateGridControlOptions> = {}) {
  let control: Control | null = null
  const month = ref(new Date(2026, 9, 1))
  const picked: Date[] = []

  const component = defineComponent({
    setup() {
      control = useDateGridControl({
        calendar: computed(() => createCalendar('en-US')),
        month,
        selected: () => new Date(2026, 9, 14),
        today: () => null,
        bounds: () => ({}),
        disabled: () => false,
        readonly: () => false,
        labelledBy: () => 'caption',
        onSelect: date => picked.push(date),
        ...overrides,
      }, 'harness')

      return () => h('div', control!.gridAttrs.value, control!.weeks.value.map(week =>
        h('div', { role: 'row' }, week.map(cell => h('i', { ...control!.getCellAttrs(cell), key: cell.key }, cell.label)))))
    },
  })

  return { component, month, picked, getControl: () => control! }
}

describe('useDateGridControl', () => {
  it('wires a grid to markup it knows nothing about', async () => {
    const { component } = createHarness()
    const wrapper = await mountSuspended(component)

    expect(wrapper.find('[role="grid"]').attributes('aria-labelledby')).toBe('caption')
    expect(wrapper.findAll('[role="row"]')).toHaveLength(6)
    expect(wrapper.find('[tabindex="0"]').attributes('aria-label')).toBe('Wednesday, October 14, 2026')
  })

  it('chooses with Enter and Space, never an unavailable day', async () => {
    const { component, picked } = createHarness({ bounds: () => ({ max: new Date(2026, 9, 13) }) })
    const wrapper = await mountSuspended(component)

    await wrapper.find('[role="grid"]').trigger('keydown', { key: 'Enter' })
    expect(picked).toHaveLength(0)

    await wrapper.find('[role="grid"]').trigger('keydown', { key: 'ArrowLeft' })
    await wrapper.find('[role="grid"]').trigger('keydown', { key: ' ' })
    expect(picked.map(date => date.getDate())).toEqual([13])
  })

  it('moves the month with the focus past its edge', async () => {
    const { component, month } = createHarness()
    const wrapper = await mountSuspended(component)

    await wrapper.find('[role="grid"]').trigger('keydown', { key: 'PageUp', shiftKey: true })
    await nextTick()

    expect([month.value.getFullYear(), month.value.getMonth()]).toEqual([2025, 9])
  })

  it('keeps the focus inside the bounds', async () => {
    const { component, month } = createHarness({ bounds: () => ({ max: new Date(2026, 9, 20) }) })
    const wrapper = await mountSuspended(component)

    await wrapper.find('[role="grid"]').trigger('keydown', { key: 'PageDown' })
    await nextTick()

    expect(month.value.getMonth()).toBe(9)
    expect(wrapper.find('[tabindex="0"]').attributes('aria-label')).toBe('Tuesday, October 20, 2026')
  })

  it('marks today only once it is known', async () => {
    const today = ref<Date | null>(null)
    const { component } = createHarness({ today: () => today.value })
    const wrapper = await mountSuspended(component)

    expect(wrapper.find('[aria-current="date"]').exists()).toBe(false)
    today.value = new Date(2026, 9, 7)
    await nextTick()
    expect(wrapper.find('[aria-current="date"]').attributes('aria-label')).toBe('Wednesday, October 7, 2026')
  })

  it('rests the tab stop on today once today is known, until the user moves it', async () => {
    const today = ref<Date | null>(null)
    const { component } = createHarness({ selected: () => null, today: () => today.value })
    const wrapper = await mountSuspended(component)

    expect(wrapper.find('[tabindex="0"]').attributes('aria-label')).toBe('Thursday, October 1, 2026')
    today.value = new Date(2026, 9, 18)
    await nextTick()
    expect(wrapper.find('[tabindex="0"]').attributes('aria-label')).toBe('Sunday, October 18, 2026')
  })

  it('leaves a tab stop the user placed where it is when today arrives', async () => {
    const today = ref<Date | null>(null)
    const { component } = createHarness({ selected: () => null, today: () => today.value })
    const wrapper = await mountSuspended(component)

    await wrapper.find('[role="grid"]').trigger('keydown', { key: 'ArrowRight' })
    today.value = new Date(2026, 9, 18)
    await nextTick()
    expect(wrapper.find('[tabindex="0"]').attributes('aria-label')).toBe('Friday, October 2, 2026')
  })

  it('produces no classes and no data attributes — presentation stays with the consumer', async () => {
    const { component, getControl } = createHarness()
    await mountSuspended(component)
    const control = getControl()
    const bags: object[] = [control.gridAttrs.value, ...control.weeks.value.flat().map(cell => control.getCellAttrs(cell))]

    for (const bag of bags) {
      const keys = Object.keys(bag)
      expect(keys).not.toContain('class')
      expect(keys.filter(key => key.startsWith('data-'))).toHaveLength(0)
    }
  })
})
