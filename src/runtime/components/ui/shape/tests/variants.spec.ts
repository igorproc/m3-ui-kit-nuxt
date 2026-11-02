import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { M3_SHAPE_SIZE, M3_SHAPES } from '#kit/assets/icon/shapes'
import type { M3ShapeName } from '#kit/assets/icon/shapes'
import MShape from '../index.vue'
import type { MShapeProps } from '../props'

const SHAPE_NAMES = Object.keys(M3_SHAPES) as M3ShapeName[]

let current: { unmount: () => void } | null = null

async function mount(props: MShapeProps, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  const wrapper = await mountSuspended(MShape, { props, attrs })
  current = wrapper

  return wrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-shape · variants', () => {
  describe('markup', () => {
    it('renders one svg carrying only its block class, on the catalog grid', async () => {
      const wrapper = await mount({ name: 'circle' })

      expect(wrapper.element.tagName.toLowerCase()).toBe('svg')
      expect(wrapper.classes()).toEqual(['ui-shape'])
      expect(wrapper.attributes('viewBox')).toBe(`0 0 ${M3_SHAPE_SIZE} ${M3_SHAPE_SIZE}`)
    })

    it('renders a single path filled with currentColor', async () => {
      const wrapper = await mount({ name: 'square' })
      const paths = wrapper.findAll('path')

      expect(paths).toHaveLength(1)
      expect(paths[0]!.attributes('fill')).toBe('currentColor')
      expect(wrapper.attributes('fill')).toBe('none')
    })

    it('sits square at rest — no rotation style', async () => {
      const wrapper = await mount({ name: 'heart' })

      expect(wrapper.attributes('style')).toBeUndefined()
    })
  })

  describe('name', () => {
    it.each(SHAPE_NAMES)('renders the canonical path of %s', async (name) => {
      const wrapper = await mount({ name })

      expect(wrapper.find('path').attributes('d')).toBe(M3_SHAPES[name])
    })

    it('falls back to the circle for a name outside the catalog', async () => {
      // A runtime string the type would reject, as from untyped data.
      const wrapper = await mount({ name: 'not-a-shape' as M3ShapeName })

      expect(wrapper.find('path').attributes('d')).toBe(M3_SHAPES.circle)
    })
  })

  describe('transition', () => {
    it('defaults to the expressive transition', async () => {
      const wrapper = await mount({ name: 'circle' })

      expect(wrapper.vm.transition.duration).toBe(610)
      expect(wrapper.vm.transition.rotate).toBe(60)
      expect(wrapper.vm.transition.preserveArea).toBe(true)
    })

    it('takes a transition by name', async () => {
      const wrapper = await mount({ name: 'circle', transition: 'calm' })

      expect(wrapper.vm.transition.duration).toBe(231)
      expect(wrapper.vm.transition.rotate).toBe(0)
      expect(wrapper.vm.transition.overshoots).toBe(false)
    })

    it('takes a hand-written curve with its own duration', async () => {
      const quartic = (t: number): number => 1 - (1 - t) ** 4
      const wrapper = await mount({ name: 'circle', transition: { easing: quartic, duration: 600 } })

      expect(wrapper.vm.transition.duration).toBe(600)
      expect(wrapper.vm.transition.easing(0.25)).toBeCloseTo(0.6836, 4)
      expect(wrapper.vm.transition.rotate).toBe(0)
    })

    it('lets duration override the transition', async () => {
      const wrapper = await mount({ name: 'circle', transition: 'calm', duration: 900 })

      expect(wrapper.vm.transition.duration).toBe(900)
    })
  })

  describe('attributes', () => {
    it('passes fallthrough attributes to the svg', async () => {
      const wrapper = await mount({ name: 'circle' }, { 'class': 'avatar-mask', 'data-test': 'shape' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-shape', 'avatar-mask']))
      expect(wrapper.attributes('data-test')).toBe('shape')
    })
  })
})
