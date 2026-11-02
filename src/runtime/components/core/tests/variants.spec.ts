import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import CoreScope from '../scope.vue'
import CoreGlobalContainer from '../global-container.vue'

let current: { unmount: () => void } | null = null

async function mount(component: Parameters<typeof mountSuspended>[0]) {
  if (current) current.unmount()
  current = await mountSuspended(component)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('core · variants', () => {
  describe('core-scope', () => {
    it('renders the shared overlay host and the programmatic modal host side by side', async () => {
      const wrapper = await mount(CoreScope)
      const host = wrapper.find('#ui-overlay-host')

      expect(host.classes()).toEqual(['ui-app__overlay-host'])
      expect(wrapper.find('.ui-dialog-global-container').exists()).toBe(true)
      expect(host.element.nextElementSibling).toBe(wrapper.find('.ui-dialog-global-container').element)
    })

    it('renders no loading presentation: that belongs to the MApp loading slot', async () => {
      const wrapper = await mount(CoreScope)

      expect(wrapper.text()).toBe('')
    })
  })

  describe('core-global-container', () => {
    it('renders an empty host while no programmatic modal is open', async () => {
      const wrapper = await mount(CoreGlobalContainer)

      expect(wrapper.classes()).toEqual(['ui-dialog-global-container'])
      expect(wrapper.element.childElementCount).toBe(0)
    })
  })
})
