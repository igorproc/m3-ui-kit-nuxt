import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MResponsive from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MResponsive, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-responsive · variants', () => {
  describe('aspect ratio', () => {
    it.each([
      ['16 / 9', '16 / 9'],
      ['4/3', '4 / 3'],
      [1, '1'],
      [1.5, '1.5'],
    ])('aspectRatio=%j is applied inline as %j', async (aspectRatio, expected) => {
      const wrapper = await mount({ aspectRatio })

      expect(wrapper.attributes('style')).toContain(`aspect-ratio: ${expected}`)
    })

    it('without a ratio sets no inline style: the box follows its content', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('style')).toBeUndefined()
    })
  })

  describe('slots', () => {
    it('renders children in flow, without a positioning wrapper', async () => {
      const wrapper = await mount({}, { default: () => 'Media' })

      expect(wrapper.classes()).toEqual(['ui-responsive'])
      expect(wrapper.element.children).toHaveLength(0)
      expect(wrapper.text()).toBe('Media')
    })
  })
})
