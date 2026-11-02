import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MButtonGroup from '../index.vue'
import type { MButtonGroupItem } from '../props'

const periods: MButtonGroupItem[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
  { label: 'Year', value: 'year' },
]

let current: { unmount: () => void } | null = null

// Attached: arrow keys move real focus, which the test DOM tracks only in the document.
async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MButtonGroup, {
    props: { items: periods, ...props },
    attrs: { 'aria-label': 'Period' },
    attachTo: document.body,
  })

  return current as VueWrapper
}

const buttons = (wrapper: VueWrapper) => wrapper.findAll('button')
const lastModel = (wrapper: VueWrapper) => wrapper.emitted('update:modelValue')?.at(-1)

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-group · interaction', () => {
  describe('single choice', () => {
    it('selects the clicked value', async () => {
      const wrapper = await mount({ modelValue: 'day' })

      await buttons(wrapper)[1]!.trigger('click')

      expect(lastModel(wrapper)).toEqual(['week'])
    })

    it('keeps the value when the selected button is clicked again: a radio does not uncheck', async () => {
      const wrapper = await mount({ modelValue: 'day' })

      await buttons(wrapper)[0]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(buttons(wrapper)[0]!.attributes('aria-checked')).toBe('true')
    })

    it('moves selection and focus with the arrows, skipping a disabled button', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      await buttons(wrapper)[1]!.trigger('keydown', { key: 'ArrowRight' })
      expect(lastModel(wrapper)).toEqual(['year'])
      expect(document.activeElement).toBe(buttons(wrapper)[3]!.element)

      await buttons(wrapper)[3]!.trigger('keydown', { key: 'ArrowLeft' })
      expect(lastModel(wrapper)).toEqual(['week'])
    })

    it('wraps around at the ends', async () => {
      const wrapper = await mount({ modelValue: 'year' })

      await buttons(wrapper)[3]!.trigger('keydown', { key: 'ArrowDown' })

      expect(lastModel(wrapper)).toEqual(['day'])
    })

    it('jumps to the ends with Home and End', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      await buttons(wrapper)[1]!.trigger('keydown', { key: 'End' })
      expect(lastModel(wrapper)).toEqual(['year'])

      await buttons(wrapper)[3]!.trigger('keydown', { key: 'Home' })
      expect(lastModel(wrapper)).toEqual(['day'])
    })

    it('leaves other keys to the browser', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      await buttons(wrapper)[1]!.trigger('keydown', { key: 'a' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('multiple choice', () => {
    it('adds and removes values by click', async () => {
      const wrapper = await mount({ multiple: true, modelValue: ['day'] })

      await buttons(wrapper)[1]!.trigger('click')
      expect(lastModel(wrapper)).toEqual([['day', 'week']])

      await wrapper.setProps({ modelValue: ['day', 'week'] })
      await buttons(wrapper)[0]!.trigger('click')
      expect(lastModel(wrapper)).toEqual([['week']])
    })

    it('starts an array from an empty model', async () => {
      const wrapper = await mount({ multiple: true })

      await buttons(wrapper)[0]!.trigger('click')

      expect(lastModel(wrapper)).toEqual([['day']])
    })

    it('leaves the arrows to the browser: each button is its own Tab stop', async () => {
      const wrapper = await mount({ multiple: true, modelValue: [] })

      await buttons(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('disabled', () => {
    it('ignores a click on a disabled button', async () => {
      const wrapper = await mount({ modelValue: 'day' })

      await buttons(wrapper)[2]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('ignores clicks and arrows anywhere in a disabled group', async () => {
      const wrapper = await mount({ modelValue: 'day', disabled: true })

      await buttons(wrapper)[1]!.trigger('click')
      await buttons(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })
})
