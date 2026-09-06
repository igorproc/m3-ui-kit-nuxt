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

  it('defaults to the expressive transition', async () => {
    const wrapper = await mountSuspended(MShape, { props: { name: 'circle' } })

    expect(wrapper.vm.transition.duration).toBe(610)
    expect(wrapper.vm.transition.rotate).toBe(60)
    expect(wrapper.vm.transition.preserveArea).toBe(true)
  })

  it('takes a transition by name', async () => {
    const wrapper = await mountSuspended(MShape, {
      props: { name: 'circle', transition: 'calm' },
    })

    expect(wrapper.vm.transition.duration).toBe(231)
    expect(wrapper.vm.transition.rotate).toBe(0)
    expect(wrapper.vm.transition.overshoots).toBe(false)
  })

  it('takes a hand-written curve with its own duration', async () => {
    const quartic = (t: number): number => 1 - (1 - t) ** 4
    const wrapper = await mountSuspended(MShape, {
      props: { name: 'circle', transition: { easing: quartic, duration: 600 } },
    })

    expect(wrapper.vm.transition.duration).toBe(600)
    expect(wrapper.vm.transition.easing(0.25)).toBeCloseTo(0.6836, 4)
    expect(wrapper.vm.transition.rotate).toBe(0)
  })
})
