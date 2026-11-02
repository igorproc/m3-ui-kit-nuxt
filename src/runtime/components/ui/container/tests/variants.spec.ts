import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MRow from '#kit/components/ui/row/index.vue'
import MCol from '#kit/components/ui/col/index.vue'
import MContainer from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MContainer, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-container · variants', () => {
  describe('defaults', () => {
    it('renders the bare grid: the column count comes from the breakpoint defaults', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toEqual(['m-container'])
    })
  })

  describe('fluid', () => {
    it.each([
      [true, true],
      [false, false],
    ])('fluid=%s → m-container--fluid %s', async (fluid, expected) => {
      const wrapper = await mount({ fluid })

      expect(wrapper.classes().includes('m-container--fluid')).toBe(expected)
    })
  })

  describe('cols', () => {
    it.each([1, 4, 8, 12, '6'])('cols=%j overrides the base column count', async (cols) => {
      const wrapper = await mount({ cols })

      expect(wrapper.classes()).toContain(`m-container--cols-${cols}`)
    })

    it.each([
      ['colsMobile', 'mobile'],
      ['colsTabletXs', 'tablet-xs'],
      ['colsTablet', 'tablet'],
      ['colsDesktopXs', 'desktop-xs'],
      ['colsDesktop', 'desktop'],
    ])('%s maps to the %s class', async (prop, key) => {
      const wrapper = await mount({ [prop]: 6 })

      expect(wrapper.classes()).toEqual(['m-container', `m-container--${key}-cols-6`])
    })

    it('combines fluid with a base and per-breakpoint counts', async () => {
      const wrapper = await mount({ fluid: true, cols: 6, colsTablet: 8, colsDesktop: 12 })

      expect(wrapper.classes()).toEqual([
        'm-container',
        'm-container--fluid',
        'm-container--cols-6',
        'm-container--tablet-cols-8',
        'm-container--desktop-cols-12',
      ])
    })
  })

  describe('slots', () => {
    it('renders its content directly as grid items', async () => {
      const wrapper = await mount({}, { default: () => h('p', { 'data-testid': 'cell' }, 'Cell') })

      expect(wrapper.find('[data-testid="cell"]').element.parentElement).toBe(wrapper.element)
    })

    it('composes container → row → cols', async () => {
      if (current) current.unmount()
      current = await mountSuspended(defineComponent({
        render: () => h(MContainer, { colsDesktop: 12 }, () => [
          h(MRow, { align: 'center' }, () => [
            h(MCol, { cols: 2 }),
            h(MCol, { cols: 2, offset: 1 }),
          ]),
        ]),
      }))
      const wrapper = current as VueWrapper

      expect(wrapper.find('.m-row').exists()).toBe(true)
      expect(wrapper.findAll('.m-col')).toHaveLength(2)
      expect(wrapper.findAll('.m-col')[1]!.classes()).toContain('m-col--offset-1')
    })
  })

  // Layout step 10 (owner, question 3 = 1): columns from the container's own
  // width. A box cannot query itself, so the grid moves onto an inner element.
  describe('container queries', () => {
    it('keeps the bare grid without an inner element by default', async () => {
      const wrapper = await mount({}, { default: () => h('span', { class: 'cell' }) })

      expect(wrapper.find('.m-container__grid').exists()).toBe(false)
      expect(wrapper.find('.cell').element.parentElement).toBe(wrapper.element)
    })

    it('makes the root the size container and puts the grid inside it', async () => {
      const wrapper = await mount({ container: true }, { default: () => h('span', { class: 'cell' }) })
      const grid = wrapper.find('.m-container__grid')

      expect(wrapper.classes()).toContain('m-container--container')
      expect(grid.exists()).toBe(true)
      expect(wrapper.find('.cell').element.parentElement).toBe(grid.element)
    })

    it('moves the column overrides onto the grid, under its own breakpoint prefix', async () => {
      const wrapper = await mount({ container: true, cols: 2, colsTabletXs: 6, colsDesktop: 10 })
      const grid = wrapper.find('.m-container__grid')

      expect(grid.classes()).toEqual(expect.arrayContaining([
        'm-container__grid--cols-2',
        'm-container__grid--tablet-xs-cols-6',
        'm-container__grid--desktop-cols-10',
      ]))
      expect(wrapper.classes().some(name => name.includes('cols'))).toBe(false)
    })

    it('keeps fluid on the root', async () => {
      const wrapper = await mount({ container: true, fluid: true })

      expect(wrapper.classes()).toContain('m-container--fluid')
    })

    it('hands its columns the container breakpoints', async () => {
      if (current) current.unmount()
      current = await mountSuspended(defineComponent({
        render: () => h(MContainer, { container: true }, () => [h(MCol, { cols: 2, tabletXs: 4, offsetDesktop: 1 })]),
      }))
      const col = (current as VueWrapper).find('.m-col')

      expect(col.classes()).toEqual(expect.arrayContaining(['m-col--span-2', 'm-col--cq-tablet-xs-span-4', 'm-col--cq-desktop-offset-1']))
      expect(col.classes()).not.toContain('m-col--tablet-xs-span-4')
    })

    it('lets a window-based container inside a container-based one take its columns back', async () => {
      if (current) current.unmount()
      current = await mountSuspended(defineComponent({
        render: () => h(MContainer, { container: true }, () => [
          h(MContainer, null, () => [h(MCol, { tabletXs: 4 })]),
        ]),
      }))

      expect((current as VueWrapper).find('.m-col').classes()).toContain('m-col--tablet-xs-span-4')
    })
  })
})
