import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import MProgress from '../index.vue'
import MProgressLinear from '../linear/index.vue'
import MProgressCircular from '../circular/index.vue'

let current: { unmount: () => void } | null = null

async function mount(component: Component, props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  current?.unmount()
  current = await mountSuspended(component, { props, slots })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const leaves = [
  ['linear', MProgressLinear],
  ['circular', MProgressCircular],
] as const

describe('m-progress · variants', () => {
  describe('type', () => {
    it.each(['linear', 'circular'] as const)('renders the %s leaf', async (type) => {
      const wrapper = await mount(MProgress, { type })

      expect(wrapper.find('.ui-progress').classes()).toContain(`ui-progress--${type}`)
      expect(wrapper.findAll('.ui-progress')).toHaveLength(1)
    })

    it('defaults to linear', async () => {
      const wrapper = await mount(MProgress)

      expect(wrapper.find('.ui-progress--linear').exists()).toBe(true)
    })

    it('forwards every leaf prop through the switch', async () => {
      const wrapper = await mount(MProgress, { type: 'circular', density: 'comfortable', shape: 'wavy', indeterminate: true, showTrack: false, ariaLabel: 'Sync' })
      const root = wrapper.find('.ui-progress')

      expect(root.classes()).toEqual(expect.arrayContaining(['ui-progress--density-comfortable', 'ui-progress--wavy', 'ui-progress--indeterminate']))
      expect(wrapper.find('[role="progressbar"]').attributes('aria-label')).toBe('Sync')
      expect(wrapper.find('.ui-progress__svg-track').exists()).toBe(false)
    })
  })

  describe.each(leaves)('%s leaf', (_, Leaf) => {
    it.each(['compact', 'default', 'comfortable'] as const)('maps density %s onto its modifier', async (density) => {
      const wrapper = await mount(Leaf, { density })

      expect(wrapper.classes()).toContain(`ui-progress--density-${density}`)
    })

    it('defaults to the default density', async () => {
      const wrapper = await mount(Leaf)

      expect(wrapper.classes()).toContain('ui-progress--density-default')
    })

    it('has no size axis any more', async () => {
      const wrapper = await mount(Leaf, { size: 'small' })

      expect(wrapper.classes()).not.toContain('ui-progress--small')
    })

    it('adds a modifier for indeterminate', async () => {
      const off = await mount(Leaf)
      expect(off.classes()).not.toContain('ui-progress--indeterminate')

      const on = await mount(Leaf, { indeterminate: true })
      expect(on.classes()).toContain('ui-progress--indeterminate')
    })

    it.each(['flat', 'wavy'] as const)('maps shape %s onto its modifier', async (shape) => {
      const wrapper = await mount(Leaf, { shape })

      expect(wrapper.classes()).toContain(`ui-progress--${shape}`)
    })

    it('defaults to the flat shape', async () => {
      const wrapper = await mount(Leaf)

      expect(wrapper.classes()).toContain('ui-progress--flat')
    })

    it('has no wavy flag any more', async () => {
      const wrapper = await mount(Leaf, { wavy: true })

      expect(wrapper.classes()).not.toContain('ui-progress--wavy')
    })

    it('renders the default slot as a label beside the progressbar', async () => {
      const wrapper = await mount(Leaf, {}, { default: () => 'extra' })
      const label = wrapper.find('.ui-progress__label')

      expect(label.text()).toBe('extra')
      expect(wrapper.find('[role="progressbar"]').text()).toBe('')
      expect(wrapper.classes()).toContain('ui-progress--labelled')
    })

    it('renders no label without a slot', async () => {
      const wrapper = await mount(Leaf)

      expect(wrapper.find('.ui-progress__label').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('ui-progress--labelled')
    })
  })

  describe('linear', () => {
    it.each([
      [true, true],
      [false, false],
    ] as const)('show-track=%s renders the track: %s', async (showTrack, rendered) => {
      const wrapper = await mount(MProgressLinear, { showTrack })

      expect(wrapper.find('.ui-progress__track').exists()).toBe(rendered)
    })

    it('scales the bar to the determinate value', async () => {
      const wrapper = await mount(MProgressLinear, { value: 40 })

      expect(wrapper.find('.ui-progress__primary-bar').attributes('style')).toContain('scaleX(0.4)')
    })

    it('adds the secondary bar only to an indeterminate standard bar', async () => {
      const determinate = await mount(MProgressLinear, { value: 40 })
      expect(determinate.find('.ui-progress__secondary-bar').exists()).toBe(false)

      const indeterminate = await mount(MProgressLinear, { indeterminate: true })
      expect(indeterminate.find('.ui-progress__secondary-bar').exists()).toBe(true)
      expect(indeterminate.find('.ui-progress__primary-bar').attributes('style') ?? '').not.toContain('scaleX')

      const wavy = await mount(MProgressLinear, { indeterminate: true, shape: 'wavy' })
      expect(wavy.find('.ui-progress__secondary-bar').exists()).toBe(false)
    })

    it('draws a wave over a flat track instead of flat bars when wavy', async () => {
      const flat = await mount(MProgressLinear)
      expect(flat.find('.ui-progress__bar-inner').exists()).toBe(true)
      expect(flat.find('.ui-progress__wave').exists()).toBe(false)

      const wavy = await mount(MProgressLinear, { shape: 'wavy' })
      expect(wavy.findAll('.ui-progress__wave')).toHaveLength(1)
      expect(wavy.find('.ui-progress__track').exists()).toBe(true)
      expect(wavy.find('.ui-progress__bar-inner').exists()).toBe(false)
    })

    it('leaves the track out of an indeterminate wave, which covers it', async () => {
      const wrapper = await mount(MProgressLinear, { shape: 'wavy', indeterminate: true })

      expect(wrapper.find('.ui-progress__track').exists()).toBe(false)
      expect(wrapper.find('.ui-progress__wave').exists()).toBe(true)
    })

    // A scaled wave squeezes its period; the wave is clipped by CSS to the share
    // the component writes into its runtime bridge.
    it('hands the wave its share instead of scaling it', async () => {
      const wrapper = await mount(MProgressLinear, { shape: 'wavy', value: 40 })

      expect(wrapper.attributes('style')).toContain('--ui-progress-value: 40%')
      expect(wrapper.find('.ui-progress__wave').attributes('style')).toBeUndefined()
    })

    it('writes no share while indeterminate', async () => {
      const wrapper = await mount(MProgressLinear, { shape: 'wavy', indeterminate: true })

      expect(wrapper.attributes('style') ?? '').not.toContain('--ui-progress-value')
    })

    // M3 2024: once there is progress, the track starts a gap after the bar.
    it.each([
      [{ value: 0 }, false],
      [{ value: 30 }, true],
      [{ value: 30, indeterminate: true }, false],
    ] as const)('%o marks the bar as started: %s', async (props, started) => {
      const wrapper = await mount(MProgressLinear, props)

      expect(wrapper.classes().includes('ui-progress--started')).toBe(started)
    })

    it('scales the bar to a share of max', async () => {
      const wrapper = await mount(MProgressLinear, { value: 3, max: 4 })

      expect(wrapper.find('.ui-progress__primary-bar').attributes('style')).toContain('scaleX(0.75)')
    })

    it.each(['flat', 'wavy'] as const)('keeps track and bars in the mirrored indicator, the label outside it (%s)', async (shape) => {
      const wrapper = await mount(MProgressLinear, { shape, value: 40 }, { default: () => 'note' })
      const indicator = wrapper.find('.ui-progress__indicator')

      expect(indicator.findAll('.ui-progress__wave, .ui-progress__track, .ui-progress__bar').length).toBeGreaterThan(1)
      expect(indicator.text()).toBe('')
      expect(wrapper.text()).toContain('note')
    })
  })

  describe('circular', () => {
    it.each([
      [true, true],
      [false, false],
    ] as const)('show-track=%s renders the track ring: %s', async (showTrack, rendered) => {
      const wrapper = await mount(MProgressCircular, { showTrack })

      expect(wrapper.find('.ui-progress__svg-track').exists()).toBe(rendered)
      expect(wrapper.find('.ui-progress__svg-value').exists()).toBe(true)
    })

    it('leaves the line caps to the stylesheet, where both ends are round', async () => {
      const wrapper = await mount(MProgressCircular, { value: 40 })

      expect(wrapper.find('.ui-progress__svg-value').attributes('stroke-linecap')).toBeUndefined()
      expect(wrapper.find('.ui-progress__svg-track').attributes('stroke-linecap')).toBeUndefined()
    })

    it('starts the flat ring at 3 o\'clock, which the quarter turn puts at 12', async () => {
      const wrapper = await mount(MProgressCircular, { value: 40 })

      expect(wrapper.find('.ui-progress__svg-value').attributes('d')).toMatch(/^M 42 24 a 18 18 0 1 1 -36 0/)
    })

    it('marks a ring with progress as started, so an empty one draws no value cap', async () => {
      const empty = await mount(MProgressCircular, { value: 0 })
      expect(empty.classes()).not.toContain('ui-progress--started')

      const started = await mount(MProgressCircular, { value: 10 })
      expect(started.classes()).toContain('ui-progress--started')
    })

    it('uses a thinner stroke at the compact density', async () => {
      const small = await mount(MProgressCircular, { density: 'compact' })
      expect(small.find('.ui-progress__svg-value').attributes('stroke-width')).toBe('3')

      const medium = await mount(MProgressCircular)
      expect(medium.find('.ui-progress__svg-value').attributes('stroke-width')).toBe('4')
    })

    it('leaves the gap plus a round cap on each side of the value, as Compose does', async () => {
      const wrapper = await mount(MProgressCircular, { value: 50 })
      const track = wrapper.find('.ui-progress__svg-track')
      const total = Number(wrapper.find('.ui-progress__svg-value').attributes('stroke-dasharray'))

      expect(Number(track.attributes('stroke-dashoffset'))).toBeCloseTo(-(total / 2 + 8))
      expect(Number(track.attributes('stroke-dasharray')!.split(' ')[0])).toBeCloseTo(total / 2 - 16)
    })

    it('drops the track ring once the value fills it', async () => {
      const wrapper = await mount(MProgressCircular, { value: 100 })

      expect(wrapper.find('.ui-progress__svg-track').exists()).toBe(false)
    })

    it('draws the whole track ring with nothing done', async () => {
      const wrapper = await mount(MProgressCircular, { value: 0 })

      expect(Number(wrapper.find('.ui-progress__svg-track').attributes('stroke-dashoffset'))).toBe(0)
    })

    it('leaves the unfilled share of the ring as the dash offset', async () => {
      const wrapper = await mount(MProgressCircular, { value: 75 })
      const value = wrapper.find('.ui-progress__svg-value')
      const length = Number(value.attributes('stroke-dasharray'))

      expect(Number(value.attributes('stroke-dashoffset'))).toBeCloseTo(length * 0.25)
    })
  })
})
