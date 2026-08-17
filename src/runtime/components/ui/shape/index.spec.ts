import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MShape from './index.vue'

describe('m-shape', () => {
  it('renders an <svg> root with the ui-shape class', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'circle' } })

    expect(wrapper.element.tagName.toLowerCase()).toBe('svg')
    expect(wrapper.classes()).toContain('ui-shape')
  })

  it('renders a single path filled with currentColor', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'square' } })

    const path = wrapper.find('path')
    expect(path.exists()).toBe(true)
    expect(path.attributes('fill')).toBe('currentColor')
  })

  it('emits a non-empty path `d` for a known shape', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'heart' } })

    const d = wrapper.find('path').attributes('d')
    expect(d).toBeTruthy()
    expect(d!.length).toBeGreaterThan(0)
  })
})
