import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MMain from './index.vue'

describe('m-main (deprecated)', () => {
  it('still renders its content in a main landmark', async () => {
    const wrapper = await mountSuspended(MMain, {
      slots: { default: () => 'Content' },
    })

    expect(wrapper.element.tagName).toBe('MAIN')
    expect(wrapper.classes()).toEqual(['ui-main'])
    expect(wrapper.text()).toBe('Content')
  })
})
