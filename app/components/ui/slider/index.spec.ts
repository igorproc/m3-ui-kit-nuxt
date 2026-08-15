import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSlider from './index.vue'

describe('m-slider', () => {
  it('renders the root with a single role="slider" thumb', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { modelValue: 40 },
    })

    expect(wrapper.find('.ui-slider').exists()).toBe(true)

    const thumbs = wrapper.findAll('[role="slider"]')

    expect(thumbs).toHaveLength(1)
    expect(thumbs[0]!.attributes('aria-valuenow')).toBe('40')
    expect(thumbs[0]!.attributes('aria-valuemin')).toBe('0')
    expect(thumbs[0]!.attributes('aria-valuemax')).toBe('100')
  })

  it('renders an optional label', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { modelValue: 10, label: 'Volume' },
    })

    expect(wrapper.find('.ui-slider__label').text()).toBe('Volume')
  })

  it('renders two thumbs in range mode', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { range: true, modelValue: [20, 80] },
    })

    const thumbs = wrapper.findAll('[role="slider"]')

    expect(thumbs).toHaveLength(2)
    expect(thumbs[0]!.attributes('aria-valuenow')).toBe('20')
    expect(thumbs[1]!.attributes('aria-valuenow')).toBe('80')
  })

  it('increments the value with ArrowRight and emits update:modelValue', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { modelValue: 40, step: 5 },
    })

    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([45])
  })

  it('decrements the value with ArrowLeft', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { modelValue: 40, step: 5 },
    })

    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowLeft' })

    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([35])
  })

  it('jumps to min/max on Home/End', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { modelValue: 40, min: 0, max: 100 },
    })

    const thumb = wrapper.find('[role="slider"]')

    await thumb.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([0])

    await thumb.trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([100])
  })

  it('does not emit on keyboard interaction when disabled', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { modelValue: 40, disabled: true },
    })

    const thumb = wrapper.find('[role="slider"]')

    expect(thumb.attributes('aria-disabled')).toBe('true')
    expect(thumb.attributes('tabindex')).toBe('-1')

    await thumb.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('does not emit on keyboard interaction when readonly', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { modelValue: 40, readonly: true },
    })

    const thumb = wrapper.find('[role="slider"]')

    expect(thumb.attributes('aria-readonly')).toBe('true')

    await thumb.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('reflects the orientation on the thumb aria-orientation', async () => {
    const wrapper = await mountSuspended(MSlider, {
      props: { modelValue: 40, orientation: 'vertical' },
    })

    expect(wrapper.find('[role="slider"]').attributes('aria-orientation')).toBe('vertical')
  })
})
