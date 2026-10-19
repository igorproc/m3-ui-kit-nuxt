import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MResponsive from './index.vue'

describe('m-responsive', () => {
  it('applies the aspect-ratio inline', async () => {
    const wrapper = await mountSuspended(MResponsive, {
      props: { aspectRatio: '16 / 9' },
    })

    expect(wrapper.attributes('style')).toContain('aspect-ratio: 16 / 9')
  })

  it('renders children in flow, without a positioning wrapper', async () => {
    const wrapper = await mountSuspended(MResponsive, {
      slots: { default: () => 'Media' },
    })

    expect(wrapper.classes()).toEqual(['ui-responsive'])
    expect(wrapper.element.children).toHaveLength(0)
    expect(wrapper.text()).toBe('Media')
  })
})
