import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MBadge from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MBadge, { props })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-badge · interaction', () => {
  describe('updates', () => {
    it('follows value changes, including past max', async () => {
      const wrapper = await mount({ value: 3 })

      await wrapper.setProps({ value: 120 })

      expect(wrapper.find('.ui-badge__label').text()).toBe('99+')
    })

    it('appears once it gets a value and goes away when it loses it', async () => {
      const wrapper = await mount()
      expect(wrapper.find('.ui-badge').exists()).toBe(false)

      await wrapper.setProps({ value: 2 })
      expect(wrapper.find('.ui-badge__label').text()).toBe('2')

      await wrapper.setProps({ value: '' })
      expect(wrapper.find('.ui-badge').exists()).toBe(false)
    })

    it('switches between dot and label without remounting', async () => {
      const wrapper = await mount({ value: 3 })

      await wrapper.setProps({ dot: true })
      expect(wrapper.find('.ui-badge__label').exists()).toBe(false)
      expect(wrapper.classes()).toContain('ui-badge--small')

      await wrapper.setProps({ dot: false })
      expect(wrapper.find('.ui-badge__label').text()).toBe('3')
    })
  })
})
