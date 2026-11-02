import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MSegmented from '../index.vue'
import type { MSegmentedItem } from '../props'

const items: MSegmentedItem[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
  { label: 'Year', value: 'year' },
]

let current: { unmount: () => void } | null = null
let host: HTMLElement | null = null

// Attached: arrow keys move real focus, which the test DOM tracks only in the document.
async function mount(props: Record<string, unknown> = {}, direction: 'ltr' | 'rtl' = 'ltr') {
  if (current) current.unmount()
  host?.remove()
  host = document.createElement('div')
  host.setAttribute('dir', direction)
  host.style.direction = direction
  document.body.append(host)
  current = await mountSuspended(MSegmented, { props: { items, ...props }, attrs: { 'aria-label': 'Period' }, attachTo: host })

  return current as VueWrapper
}

const segments = (wrapper: VueWrapper) => wrapper.findAll('button')
const lastModel = (wrapper: VueWrapper) => wrapper.emitted('update:modelValue')?.at(-1)

afterEach(() => {
  current?.unmount()
  current = null
  host?.remove()
  host = null
})

describe('m-button-segmented · interaction', () => {
  describe('single choice', () => {
    it('selects the clicked value', async () => {
      const wrapper = await mount({ modelValue: 'day' })

      await segments(wrapper)[1]!.trigger('click')

      expect(lastModel(wrapper)).toEqual(['week'])
    })

    it('moves selection and focus with the arrows, skipping a disabled segment', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      await segments(wrapper)[1]!.trigger('keydown', { key: 'ArrowRight' })
      expect(lastModel(wrapper)).toEqual(['year'])
      expect(document.activeElement).toBe(segments(wrapper)[3]!.element)

      await segments(wrapper)[3]!.trigger('keydown', { key: 'ArrowUp' })
      expect(lastModel(wrapper)).toEqual(['week'])
    })

    it('wraps around at the ends', async () => {
      const wrapper = await mount({ modelValue: 'day' })

      await segments(wrapper)[0]!.trigger('keydown', { key: 'ArrowLeft' })

      expect(lastModel(wrapper)).toEqual(['year'])
    })

    it('jumps to the ends with Home and End', async () => {
      const wrapper = await mount({ modelValue: 'week' })

      await segments(wrapper)[1]!.trigger('keydown', { key: 'End' })
      expect(lastModel(wrapper)).toEqual(['year'])

      await segments(wrapper)[3]!.trigger('keydown', { key: 'Home' })
      expect(lastModel(wrapper)).toEqual(['day'])
    })

    it('mirrors the horizontal arrows in a right-to-left layout', async () => {
      const wrapper = await mount({ modelValue: 'week' }, 'rtl')

      await segments(wrapper)[1]!.trigger('keydown', { key: 'ArrowRight' })
      expect(lastModel(wrapper)).toEqual(['day'])

      await segments(wrapper)[0]!.trigger('keydown', { key: 'ArrowDown' })
      expect(lastModel(wrapper)).toEqual(['week'])
    })
  })

  describe('multiple choice', () => {
    it('adds and removes values by click', async () => {
      const wrapper = await mount({ multiple: true, modelValue: ['day'] })

      await segments(wrapper)[1]!.trigger('click')
      expect(lastModel(wrapper)).toEqual([['day', 'week']])

      await wrapper.setProps({ modelValue: ['day', 'week'] })
      await segments(wrapper)[0]!.trigger('click')
      expect(lastModel(wrapper)).toEqual([['week']])
    })

    it('leaves the arrows to the browser', async () => {
      const wrapper = await mount({ multiple: true, modelValue: [] })

      await segments(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('disabled', () => {
    it('ignores a click on a disabled segment', async () => {
      const wrapper = await mount({ modelValue: 'day' })

      await segments(wrapper)[2]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('ignores the arrows in a disabled group', async () => {
      const wrapper = await mount({ modelValue: 'day', disabled: true })

      await segments(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })
})
