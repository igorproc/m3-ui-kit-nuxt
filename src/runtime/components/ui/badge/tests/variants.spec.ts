import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MBadge from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  current?.unmount()
  current = await mountSuspended(MBadge, { props, slots })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const label = (wrapper: VueWrapper) => wrapper.find('.ui-badge__label')

describe('m-badge · variants', () => {
  describe('size', () => {
    it.each([
      [{ value: 5 }, 'ui-badge--large', 'ui-badge--small'],
      [{ dot: true }, 'ui-badge--small', 'ui-badge--large'],
    ] as const)('maps %o onto %s', async (props, present, absent) => {
      const wrapper = await mount(props)

      expect(wrapper.classes()).toContain(present)
      expect(wrapper.classes()).not.toContain(absent)
    })
  })

  describe('value', () => {
    it.each([
      [5, '5'],
      ['7', '7'],
      [0, '0'],
      ['new', 'new'],
    ] as const)('renders %o as %s', async (value, text) => {
      const wrapper = await mount({ value })

      expect(label(wrapper).text()).toBe(text)
    })

    it.each([
      [150, 99, '99+'],
      [12, 9, '9+'],
      [99, 99, '99'],
    ] as const)('caps %i at max %i as %s', async (value, max, text) => {
      const wrapper = await mount({ value, max })

      expect(label(wrapper).text()).toBe(text)
    })

    // An empty circle is not a badge: with nothing to show, nothing renders.
    it.each([undefined, null, ''])('renders nothing for an empty value (%o)', async (value) => {
      const wrapper = await mount({ value })

      expect(wrapper.find('.ui-badge').exists()).toBe(false)
    })
  })

  describe('dot', () => {
    it('renders no label even with a value', async () => {
      const wrapper = await mount({ dot: true, value: 5 })

      expect(label(wrapper).exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('prefers the default slot over the value', async () => {
      const wrapper = await mount({ value: 5 }, { default: () => 'X' })

      expect(label(wrapper).text()).toBe('X')
    })

    it('renders the slot without a value', async () => {
      const wrapper = await mount({}, { default: () => 'new' })

      expect(wrapper.classes()).toContain('ui-badge--large')
      expect(label(wrapper).text()).toBe('new')
    })
  })
})
