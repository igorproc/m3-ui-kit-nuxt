import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { M3_SHAPES } from '#kit/assets/icon/shapes'
import MShape from '../index.vue'
import type { MShapeProps } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: MShapeProps) {
  if (current) current.unmount()
  const wrapper = await mountSuspended(MShape, { props })
  current = wrapper

  return wrapper
}

function frames(count: number) {
  for (let i = 0; i < count; i++) vi.advanceTimersToNextFrame()
}

const pathOf = (wrapper: { find: (selector: string) => { attributes: (name: string) => string | undefined } }) => wrapper.find('path').attributes('d')

describe('m-shape · interaction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    current?.unmount()
    current = null
    vi.useRealTimers()
  })

  describe('morph', () => {
    it('morphs through intermediate paths and lands on the new shape', async () => {
      const wrapper = await mount({ name: 'circle' })

      await wrapper.setProps({ name: 'square' })
      frames(2)
      await wrapper.vm.$nextTick()
      expect(pathOf(wrapper)).not.toBe(M3_SHAPES.circle)
      expect(pathOf(wrapper)).not.toBe(M3_SHAPES.square)

      frames(80)
      await wrapper.vm.$nextTick()
      expect(pathOf(wrapper)).toBe(M3_SHAPES.square)
    })

    it('swings while it morphs on the expressive transition and comes to rest square', async () => {
      const wrapper = await mount({ name: 'circle' })
      const angles: number[] = []

      await wrapper.setProps({ name: 'heart' })
      for (let i = 0; i < 80; i++) {
        frames(1)
        angles.push(wrapper.vm.rotate)
      }
      await wrapper.vm.$nextTick()

      expect(Math.max(...angles.map(Math.abs))).toBeGreaterThan(0)
      expect(angles.at(-1)).toBe(0)
      expect(wrapper.attributes('style')).toBeUndefined()
    })

    it('draws the swing as a rotation on the svg, never in the path', async () => {
      const wrapper = await mount({ name: 'circle' })

      await wrapper.setProps({ name: 'heart' })
      let styled: string | undefined
      for (let i = 0; i < 80 && !styled; i++) {
        frames(1)
        await wrapper.vm.$nextTick()
        styled = wrapper.attributes('style')
      }

      expect(styled).toMatch(/transform: rotate\(-?\d+\.\d{2}deg\)/)
    })

    it('does not swing on the calm transition', async () => {
      const wrapper = await mount({ name: 'circle', transition: 'calm' })
      const angles: number[] = []

      await wrapper.setProps({ name: 'square' })
      for (let i = 0; i < 40; i++) {
        frames(1)
        angles.push(wrapper.vm.rotate)
      }

      expect(angles.every(angle => angle === 0)).toBe(true)
    })

    it('rests on its shape while nothing changes', async () => {
      const wrapper = await mount({ name: 'diamond' })

      frames(10)
      await wrapper.vm.$nextTick()

      expect(pathOf(wrapper)).toBe(M3_SHAPES.diamond)
    })
  })

  describe('server render', () => {
    it('draws the canonical path in the first paint, with no rotation', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MShape, { name: 'heart' }) }))

      expect(html).toContain(`d="${M3_SHAPES.heart}"`)
      expect(html).not.toContain('rotate(')
    })
  })
})
