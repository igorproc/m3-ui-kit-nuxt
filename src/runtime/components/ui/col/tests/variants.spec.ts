import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MCol from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MCol, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const BREAKPOINTS = [
  ['mobile', 'mobile', 'offsetMobile'],
  ['tabletXs', 'tablet-xs', 'offsetTabletXs'],
  ['tablet', 'tablet', 'offsetTablet'],
  ['desktopXs', 'desktop-xs', 'offsetDesktopXs'],
  ['desktop', 'desktop', 'offsetDesktop'],
] as const

describe('m-col · variants', () => {
  describe('defaults', () => {
    it('takes the whole row by default (no span classes)', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toEqual(['m-col'])
    })
  })

  describe('span', () => {
    it.each([1, 2, 6, 12, '3'])('cols=%j sets the base span', async (cols) => {
      const wrapper = await mount({ cols })

      expect(wrapper.classes()).toEqual(['m-col', `m-col--span-${cols}`])
    })

    it.each(BREAKPOINTS)('%s maps to the %s span class', async (prop, key) => {
      const wrapper = await mount({ [prop]: 4 })

      expect(wrapper.classes()).toEqual(['m-col', `m-col--${key}-span-4`])
    })
  })

  describe('offset', () => {
    it.each([0, 1, 11, '2'])('offset=%j sets the base offset', async (offset) => {
      const wrapper = await mount({ offset })

      expect(wrapper.classes()).toEqual(['m-col', `m-col--offset-${offset}`])
    })

    it.each(BREAKPOINTS)('%s has the %s offset class beside it', async (_prop, key, offsetProp) => {
      const wrapper = await mount({ [offsetProp]: 2 })

      expect(wrapper.classes()).toEqual(['m-col', `m-col--${key}-offset-2`])
    })
  })

  describe('combinations', () => {
    it('emits base classes first, then breakpoint classes in ascending order', async () => {
      const wrapper = await mount({ cols: 2, tabletXs: 4, desktop: 3, offset: 1, offsetDesktop: 0 })

      expect(wrapper.classes()).toEqual([
        'm-col',
        'm-col--span-2',
        'm-col--offset-1',
        'm-col--tablet-xs-span-4',
        'm-col--desktop-span-3',
        'm-col--desktop-offset-0',
      ])
    })
  })

  describe('slots', () => {
    it('renders its content', async () => {
      const wrapper = await mount({}, { default: () => h('p', 'Cell') })

      expect(wrapper.find('p').text()).toBe('Cell')
    })
  })
})
