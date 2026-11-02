import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MButtonGroup from '../index.vue'
import type { MButtonGroupItem } from '../props'

const periods: MButtonGroupItem[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = { 'aria-label': 'Period' }) {
  if (current) current.unmount()
  current = await mountSuspended(MButtonGroup, { props: { items: periods, ...props }, attrs })

  return current as VueWrapper
}

const buttons = (wrapper: VueWrapper) => wrapper.findAll('button')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-group · a11y', () => {
  describe('group', () => {
    it.each([
      [false, 'radiogroup'],
      [true, 'group'],
    ])('multiple=%s makes the root a %s', async (multiple, role) => {
      const wrapper = await mount({ multiple })

      expect(wrapper.find('.ui-button-group').attributes('role')).toBe(role)
    })

    it.each([
      ['aria-label', 'Period'],
      ['aria-labelledby', 'period-label'],
    ])('lands the group name (%s) on the root', async (name, value) => {
      const wrapper = await mount({}, { [name]: value })

      expect(wrapper.find('.ui-button-group').attributes(name)).toBe(value)
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest resolves to `false`.
  })

  describe('single choice is a radio group', () => {
    it('makes each button a radio with its checked state and no aria-pressed', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      expect(buttons(wrapper).map(button => button.attributes('role'))).toEqual(['radio', 'radio', 'radio'])
      expect(buttons(wrapper).map(button => button.attributes('aria-checked'))).toEqual(['false', 'true', 'false'])
      expect(buttons(wrapper).every(button => button.attributes('aria-pressed') === undefined)).toBe(true)
    })

    it('is one Tab stop on the checked button', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      expect(buttons(wrapper).map(button => button.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    })

    it('puts the Tab stop on the first enabled button while nothing is checked', async () => {
      const wrapper = await mount({ items: [{ label: 'Off', value: 'off', disabled: true }, ...periods] })

      expect(buttons(wrapper).map(button => button.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
    })
  })

  describe('multiple choice is a set of toggle buttons', () => {
    it('states each button\'s state as aria-pressed, with no radio role or roving tabindex', async () => {
      const wrapper = await mount({ multiple: true, modelValue: ['day'] })

      expect(buttons(wrapper).map(button => button.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
      expect(buttons(wrapper).every(button => button.attributes('role') === undefined)).toBe(true)
      expect(buttons(wrapper).every(button => button.attributes('tabindex') === undefined)).toBe(true)
    })
  })

  describe('buttons', () => {
    it('names an icon-only button from its item', async () => {
      const wrapper = await mount({ items: [{ value: 'grid', icon: 'ic:outline-dashboard', ariaLabel: 'Grid' }] })

      expect(buttons(wrapper)[0]!.attributes('aria-label')).toBe('Grid')
    })

    it('keeps a labelled button named by its text, with no aria-label', async () => {
      const wrapper = await mount()

      expect(buttons(wrapper)[0]!.attributes('aria-label')).toBeUndefined()
      expect(buttons(wrapper)[0]!.text()).toBe('Day')
    })

    it('never submits a surrounding form', async () => {
      const wrapper = await mount()

      expect(buttons(wrapper).every(button => button.attributes('type') === 'button')).toBe(true)
    })

    it('takes a disabled button out of the tab order natively', async () => {
      const wrapper = await mount()

      expect(buttons(wrapper)[2]!.attributes('disabled')).toBeDefined()
      expect(buttons(wrapper)[0]!.attributes('disabled')).toBeUndefined()
    })

    it('disables every button of a disabled group natively', async () => {
      const wrapper = await mount({ disabled: true })

      expect(buttons(wrapper).every(button => button.attributes('disabled') !== undefined)).toBe(true)
    })

    it('hides the item icon from assistive tech', async () => {
      const wrapper = await mount({ items: [{ value: 'grid', icon: 'ic:outline-dashboard', label: 'Grid' }] })
      const icon = buttons(wrapper)[0]!.find('.ui-button__icon--prepend .ui-icon')

      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })
})
