import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { createCalendar } from '#kit/utils/date/createCalendar'
import { useYearGridControl } from './useYearGridControl'
import type { YearGridControlOptions } from './useYearGridControl'

type Control = ReturnType<typeof useYearGridControl>

const YEARS = Array.from({ length: 12 }, (_, index) => 2020 + index)

/** Mounts the bags on anonymous markup — no kit component, no kit class. */
function createHarness(overrides: Partial<YearGridControlOptions> = {}) {
  let control: Control | null = null
  const picked: number[] = []

  const component = defineComponent({
    setup() {
      control = useYearGridControl({
        calendar: () => createCalendar('en-US'),
        years: () => YEARS,
        shownYear: () => 2026,
        selectedYear: () => 2026,
        currentYear: () => 2025,
        disabled: () => false,
        labelledBy: () => 'caption',
        columns: 3,
        onSelect: year => picked.push(year),
        ...overrides,
      }, 'years')
      return () => h('div', control!.gridAttrs.value, control!.rows.value.map(row =>
        h('div', { role: 'row' }, row.map(year => h('i', { ...control!.getCellAttrs(year), key: year }, String(year))))))
    },
  })

  return { component, picked, getControl: () => control! }
}

describe('useYearGridControl', () => {
  it('wires a year grid to markup it knows nothing about', async () => {
    const { component } = createHarness()
    const wrapper = await mountSuspended(component)

    expect(wrapper.find('[role="grid"]').attributes('aria-labelledby')).toBe('caption')
    expect(wrapper.findAll('[role="row"]')).toHaveLength(4)
    expect(wrapper.find('[tabindex="0"]').text()).toBe('2026')
    expect(wrapper.find('[aria-selected="true"]').text()).toBe('2026')
    expect(wrapper.find('[aria-current="date"]').text()).toBe('2025')
  })

  it('moves the tab stop by one, by a row and to the ends', async () => {
    const { component } = createHarness()
    const wrapper = await mountSuspended(component, { attachTo: document.body })
    const grid = wrapper.find('[role="grid"]')
    const stop = () => wrapper.find('[tabindex="0"]').text()

    await grid.trigger('keydown', { key: 'ArrowRight' })
    expect(stop()).toBe('2027')
    await grid.trigger('keydown', { key: 'ArrowDown' })
    expect(stop()).toBe('2030')
    await grid.trigger('keydown', { key: 'Home' })
    expect(stop()).toBe('2020')
    await grid.trigger('keydown', { key: 'End' })
    expect(stop()).toBe('2031')
    wrapper.unmount()
  })

  it('chooses with Enter and Space, nothing while disabled', async () => {
    const { component, picked } = createHarness()
    const wrapper = await mountSuspended(component)

    await wrapper.find('[role="grid"]').trigger('keydown', { key: 'Enter' })
    await wrapper.find('[role="grid"]').trigger('keydown', { key: ' ' })
    expect(picked).toEqual([2026, 2026])

    const disabled = createHarness({ disabled: () => true })
    const locked = await mountSuspended(disabled.component)
    await locked.find('[role="grid"]').trigger('keydown', { key: 'Enter' })
    expect(disabled.picked).toEqual([])
    expect(locked.find('[tabindex="0"]').exists()).toBe(false)
  })

  it('produces no classes and no data attributes — presentation stays with the consumer', async () => {
    const { component, getControl } = createHarness()
    await mountSuspended(component)
    const control = getControl()
    const bags: object[] = [control.gridAttrs.value, ...YEARS.map(year => control.getCellAttrs(year))]

    for (const bag of bags) {
      const keys = Object.keys(bag)
      expect(keys).not.toContain('class')
      expect(keys.filter(key => key.startsWith('data-'))).toHaveLength(0)
    }
  })
})
