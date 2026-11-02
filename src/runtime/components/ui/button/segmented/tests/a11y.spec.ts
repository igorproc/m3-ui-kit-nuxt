import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MSegmented from '../index.vue'
import type { MSegmentedItem } from '../props'

const items: MSegmentedItem[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = { 'aria-label': 'Period' }) {
  if (current) current.unmount()
  current = await mountSuspended(MSegmented, { props: { items, ...props }, attrs })

  return current as VueWrapper
}

const segments = (wrapper: VueWrapper) => wrapper.findAll('button')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-segmented · a11y', () => {
  describe('group', () => {
    it.each([
      [false, 'radiogroup'],
      [true, 'group'],
    ])('multiple=%s makes the root a %s', async (multiple, role) => {
      const wrapper = await mount({ multiple })

      expect(wrapper.attributes('role')).toBe(role)
    })

    it.each([
      ['aria-label', 'Period'],
      ['aria-labelledby', 'period-label'],
    ])('lands the group name (%s) on the root', async (name, value) => {
      const wrapper = await mount({}, { [name]: value })

      expect(wrapper.attributes(name)).toBe(value)
    })
  })

  describe('single choice is a radio group', () => {
    it('makes each segment a radio with its checked state', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      expect(segments(wrapper).map(segment => segment.attributes('role'))).toEqual(['radio', 'radio', 'radio'])
      expect(segments(wrapper).map(segment => segment.attributes('aria-checked'))).toEqual(['false', 'true', 'false'])
      expect(segments(wrapper).every(segment => segment.attributes('aria-pressed') === undefined)).toBe(true)
    })

    it('is one Tab stop on the checked segment', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      expect(segments(wrapper).map(segment => segment.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    })

    it('puts the Tab stop on the first enabled segment while nothing is checked', async () => {
      const wrapper = await mount({ items: [{ label: 'Off', value: 'off', disabled: true }, ...items] })

      expect(segments(wrapper).map(segment => segment.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
    })
  })

  describe('multiple choice is a set of toggle buttons', () => {
    it('states each segment as aria-pressed, with no radio role or roving tabindex', async () => {
      const wrapper = await mount({ multiple: true, modelValue: ['day'] })

      expect(segments(wrapper).map(segment => segment.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
      expect(segments(wrapper).every(segment => segment.attributes('role') === undefined)).toBe(true)
      expect(segments(wrapper).every(segment => segment.attributes('tabindex') === undefined)).toBe(true)
    })
  })

  describe('segments', () => {
    it('names an icon-only segment through its ariaLabel', async () => {
      const wrapper = await mount({ items: [{ icon: 'ic:outline-home', ariaLabel: 'Home', value: 'home' }] })

      expect(segments(wrapper)[0]!.attributes('aria-label')).toBe('Home')
    })

    it('keeps a labelled segment named by its text', async () => {
      const wrapper = await mount()

      expect(segments(wrapper)[0]!.attributes('aria-label')).toBeUndefined()
      expect(segments(wrapper)[0]!.text()).toBe('Day')
    })

    it('never submits a surrounding form', async () => {
      const wrapper = await mount()

      expect(segments(wrapper).every(segment => segment.attributes('type') === 'button')).toBe(true)
    })

    it('takes a disabled segment, or every segment of a disabled group, out of the tab order natively', async () => {
      const one = await mount()
      expect(segments(one).map(segment => segment.attributes('disabled') !== undefined)).toEqual([false, false, true])

      const all = await mount({ disabled: true })
      expect(segments(all).every(segment => segment.attributes('disabled') !== undefined)).toBe(true)
    })

    it('hides the check and the item icon from assistive tech', async () => {
      const wrapper = await mount({ items: [{ value: 'a', icon: 'ic:outline-home', label: 'A' }, { value: 'b', label: 'B' }], modelValue: 'b' })

      for (const icon of wrapper.findAll('.ui-segmented-button__icon .ui-icon')) {
        expect(icon.attributes('aria-hidden')).toBe('true')
      }
    })
  })
})
