import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSystemBar from './index.vue'

describe('m-system-bar', () => {
  it('renders the bar container', async () => {
    const wrapper = await mountSuspended(MSystemBar)

    expect(wrapper.find('.ui-system-bar').exists()).toBe(true)
  })

  it('renders default slot content', async () => {
    const wrapper = await mountSuspended(MSystemBar, {
      slots: { default: () => 'status' },
    })

    expect(wrapper.find('.ui-system-bar').text()).toBe('status')
  })

  it('is not anchored when rendered outside a layout', async () => {
    const wrapper = await mountSuspended(MSystemBar)

    expect(wrapper.classes()).not.toContain('ui-system-bar--anchored')
  })
})
