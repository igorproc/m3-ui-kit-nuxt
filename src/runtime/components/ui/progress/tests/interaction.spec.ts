import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MProgress from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MProgress, { props })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const valueNow = (wrapper: VueWrapper) => wrapper.find('[role="progressbar"]').attributes('aria-valuenow')

describe('m-progress · interaction', () => {
  describe('value', () => {
    it.each(['linear', 'circular'] as const)('clamps the %s value into 0…100', async (type) => {
      const over = await mount({ type, value: 140 })
      expect(valueNow(over)).toBe('100')

      const under = await mount({ type, value: -20 })
      expect(valueNow(under)).toBe('0')
    })

    // CT-07: NaN would reach the DOM as an attribute and break the geometry.
    it('reads NaN as nothing done', async () => {
      const wrapper = await mount({ value: Number.NaN })

      expect(valueNow(wrapper)).toBe('0')
    })

    it.each(['linear', 'circular'] as const)('clamps the %s value into 0…max', async (type) => {
      const wrapper = await mount({ type, value: 12, max: 10 })

      expect(valueNow(wrapper)).toBe('10')
    })

    it('follows value changes', async () => {
      const wrapper = await mount({ value: 10 })

      await wrapper.setProps({ value: 60 })

      expect(valueNow(wrapper)).toBe('60')
      expect(wrapper.find('.ui-progress__primary-bar').attributes('style')).toContain('scaleX(0.6)')
    })
  })

  describe('mode switch', () => {
    it('drops the value from the bar when it turns indeterminate', async () => {
      const wrapper = await mount({ value: 30 })

      await wrapper.setProps({ indeterminate: true })

      expect(valueNow(wrapper)).toBeUndefined()
      expect(wrapper.classes()).toContain('ui-progress--indeterminate')
    })

    it('swaps the leaf when the type changes, keeping the value', async () => {
      const wrapper = await mount({ value: 30 })

      await wrapper.setProps({ type: 'circular' })

      expect(wrapper.find('.ui-progress--circular').exists()).toBe(true)
      expect(valueNow(wrapper)).toBe('30')
    })
  })
})
