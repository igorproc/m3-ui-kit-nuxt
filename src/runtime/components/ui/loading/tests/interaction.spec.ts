import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MLoading from '../index.vue'
import MShape from '#kit/components/ui/shape/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MLoading, { props: { ariaLabel: 'Loading', ...props } })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const shapeName = (wrapper: VueWrapper) => wrapper.findComponent(MShape).props('name')

describe('m-loading · interaction', () => {
  describe('expressive cycle', () => {
    it('steps to the next shape once the morph settles', async () => {
      const wrapper = await mount({ type: 'shape', transition: { duration: 40, hold: 0 } })
      // The shape is an async component: let its chunk resolve first.
      await wait(5)
      expect(shapeName(wrapper)).toBe('circle')

      await wait(80)

      expect(shapeName(wrapper)).not.toBe('circle')
    })

    it('swaps to the spinner markup when the type changes', async () => {
      const wrapper = await mount({ type: 'shape' })

      await wrapper.setProps({ type: 'spinner' })

      expect(wrapper.find('.ui-loading__shape').exists()).toBe(false)
      expect(wrapper.find('.ui-loading__spinner').exists()).toBe(true)
    })
  })
})
