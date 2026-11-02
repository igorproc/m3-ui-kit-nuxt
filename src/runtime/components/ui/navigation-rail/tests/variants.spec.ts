import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutAside from '#kit/components/ui/layout/aside.vue'
import MLayoutItem from '#kit/components/ui/layout/item.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MNavigationRail from '../index.vue'
import type { MNavigationRailItem as RailItem } from '../props'

const items: RailItem[] = [
  { id: 'home', icon: 'outline-home', label: 'Home' },
  { id: 'search', icon: 'outline-search', label: 'Search' },
  { id: 'profile', icon: 'outline-person', label: 'Profile', badge: 2 },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MNavigationRail, { props: { items, ...props }, slots })

  return current as VueWrapper
}

async function mountHost(render: () => unknown) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render }))

  return current as VueWrapper
}

const destinations = (wrapper: VueWrapper) => wrapper.findAll('.ui-navigation-rail .ui-navigation-item')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-navigation-rail · variants', () => {
  describe('destinations', () => {
    it('renders one navigation item per entry inside the list, in order', async () => {
      const wrapper = await mount()
      const list = wrapper.find('.ui-navigation-rail__list')

      expect(list.findAll('.ui-navigation-item--rail')).toHaveLength(3)
      expect(list.findAll('.ui-navigation-item__label').map(label => label.text())).toEqual(['Home', 'Search', 'Profile'])
    })

    it('renders an empty list without items', async () => {
      const wrapper = await mount({ items: [] })

      expect(destinations(wrapper)).toHaveLength(0)
    })

    // W59-В: the public rail item is gone; the rail draws the shared private item.
    it('has no public item component left', () => {
      expect(Object.keys(import.meta.glob('../item/*.vue'))).toEqual([])
    })
  })

  describe('expanded', () => {
    it.each([
      [false, 'top'],
      [true, 'start'],
    ] as const)('expanded=%s lays the destinations out with the icon at the %s', async (expanded, placement) => {
      const wrapper = await mount({ expanded })

      expect(wrapper.classes().includes('ui-navigation-rail--expanded')).toBe(expanded)
      expect(destinations(wrapper).every(item => item.classes().includes(`ui-navigation-item--${placement}`))).toBe(true)
    })

    it('defaults to collapsed', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-navigation-rail--expanded')
    })
  })

  // W63-А
  describe('mode', () => {
    it.each(['standard', 'modal', 'dismissible'] as const)('sets the %s mode modifier', async (mode) => {
      const wrapper = await mount({ mode })

      expect(wrapper.classes()).toContain(`ui-navigation-rail--${mode}`)
    })

    it('defaults to standard', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-navigation-rail--standard')
    })

    it.each(['modal', 'dismissible'] as const)('keeps the rail in the grid collapsed in %s mode, whatever expanded says', async (mode) => {
      const wrapper = await mount({ mode, expanded: true })

      expect(wrapper.classes()).not.toContain('ui-navigation-rail--expanded')
      expect(destinations(wrapper).every(item => item.classes().includes('ui-navigation-item--top'))).toBe(true)
    })
  })

  // W60-Б
  describe('header', () => {
    it('renders the header slot above the list', async () => {
      const wrapper = await mount({}, { header: () => h('button', { class: 'menu' }, 'Menu') })
      const parts = Array.from(wrapper.find('.ui-navigation-rail__content').element.children).map(part => part.className)

      expect(parts).toEqual(['ui-navigation-rail__header', 'ui-navigation-rail__list'])
      expect(wrapper.find('.ui-navigation-rail__header .menu').exists()).toBe(true)
    })

    it('renders no header without the slot', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-navigation-rail__header').exists()).toBe(false)
    })
  })

  describe('active destination', () => {
    it.each(items.map(item => item.id))('marks %s and only it active', async (id) => {
      const wrapper = await mount({ modelValue: id })

      expect(destinations(wrapper).map(item => item.classes().includes('ui-navigation-item--active')))
        .toEqual(items.map(item => item.id === id))
    })

    it('marks nothing active with an empty model', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-navigation-item--active').exists()).toBe(false)
    })

    // W70-А
    it('fills the glyph of the active destination', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      expect(destinations(wrapper)[0]!.html()).toContain('ic:baseline-home')
    })
  })

  describe('badge and disabled', () => {
    it.each([
      ['a positive count', 2, true],
      ['a dot', true, true],
      ['zero', 0, false],
      ['no badge', undefined, false],
    ])('draws a badge for %s', async (_, badge, shown) => {
      const wrapper = await mount({ items: [{ id: 'a', icon: 'outline-home', label: 'A', badge }] })

      expect(wrapper.find('.ui-navigation-item__badge').exists()).toBe(shown)
    })

    it('marks a disabled destination with its modifier', async () => {
      const wrapper = await mount({ items: [{ ...items[0]!, disabled: true }] })

      expect(destinations(wrapper)[0]!.classes()).toContain('ui-navigation-item--disabled')
    })
  })

  // B5.2b (Q21-А): the rail fills only a side zone; anywhere else it keeps its own width.
  describe('hosting', () => {
    it.each([
      ['m-layout-aside', () => h(MLayoutAside, null, () => h(MNavigationRail, { items }))],
      ['a start item', () => h(MLayoutItem, { kind: 'start' }, () => h(MNavigationRail, { items }))],
      ['an end item', () => h(MLayoutItem, { kind: 'end' }, () => h(MNavigationRail, { items }))],
    ])('fills %s as hosted', async (_, zone) => {
      const wrapper = await mountHost(() => h(MLayout, null, () => [zone(), h(MLayoutMain, null, () => 'Body')]))

      expect(wrapper.find('.ui-navigation-rail').classes()).toContain('ui-navigation-rail--hosted')
    })

    it('keeps its own width inside m-layout-main', async () => {
      const wrapper = await mountHost(() => h(MLayout, null, () => [h(MLayoutMain, null, () => h(MNavigationRail, { items }))]))

      expect(wrapper.find('.ui-navigation-rail').classes()).not.toContain('ui-navigation-rail--hosted')
    })

    it.each([
      [true, true],
      [false, false],
    ])('in the main of a layout with fullHeight=%s it sticks to main as its scroller: %s', async (fullHeight, inScroller) => {
      const wrapper = await mountHost(() => h(MLayout, { fullHeight }, () => [h(MLayoutMain, null, () => h(MNavigationRail, { items }))]))

      expect(wrapper.find('.ui-navigation-rail').classes().includes('ui-navigation-rail--in-scroller')).toBe(inScroller)
    })

    it('registers itself as a zone when it is a direct child of m-layout', async () => {
      const wrapper = await mountHost(() => h(MLayout, null, () => [h(MNavigationRail, { items }), h(MLayoutMain, null, () => 'Body')]))
      const rail = wrapper.find('.ui-navigation-rail')

      expect(rail.classes()).not.toContain('ui-navigation-rail--hosted')
      expect(rail.attributes('data-m3-zone')).toBeTruthy()
    })

    it('is neither hosted nor a zone outside a layout', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-navigation-rail--hosted')
      expect(wrapper.attributes('data-m3-zone')).toBeUndefined()
    })

    it('takes the height of its container outside a layout, and only there', async () => {
      expect((await mount()).classes()).toContain('ui-navigation-rail--standalone')

      const wrapper = await mountHost(() => h(MLayout, null, () => [
        h(MNavigationRail, { items }),
        h(MLayoutMain, null, () => h(MNavigationRail, { items })),
      ]))

      for (const rail of wrapper.findAll('.ui-navigation-rail')) {
        expect(rail.classes()).not.toContain('ui-navigation-rail--standalone')
      }
    })
  })
})
