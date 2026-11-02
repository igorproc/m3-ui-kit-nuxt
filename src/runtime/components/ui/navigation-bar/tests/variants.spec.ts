import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MLayoutFooter from '#kit/components/ui/layout/footer.vue'
import MNavigationBar from '../index.vue'
import type { MNavigationBarItem } from '../props'

const items: MNavigationBarItem[] = [
  { id: 'home', icon: 'outline-home', label: 'Home' },
  { id: 'search', icon: 'outline-search', label: 'Search' },
  { id: 'profile', icon: 'outline-person', label: 'Profile', badge: 3 },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MNavigationBar, { props: { items, ...props } })

  return current as VueWrapper
}

async function mountInLayout(render: () => unknown) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render }))

  return current as VueWrapper
}

const destinations = (wrapper: VueWrapper) => wrapper.findAll('.ui-navigation-bar__item')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-navigation-bar · variants', () => {
  describe('destinations', () => {
    it('renders one navigation item per destination, in order', async () => {
      const wrapper = await mount()

      expect(destinations(wrapper)).toHaveLength(3)
      expect(destinations(wrapper).every(item => item.classes().includes('ui-navigation-item--bar'))).toBe(true)
      expect(wrapper.findAll('.ui-navigation-item__label').map(label => label.text())).toEqual(['Home', 'Search', 'Profile'])
    })

    it('renders no destination without items', async () => {
      const wrapper = await mount({ items: [] })

      expect(destinations(wrapper)).toHaveLength(0)
    })

    it('follows item changes after mount', async () => {
      const wrapper = await mount()

      await wrapper.setProps({ items: items.slice(0, 2) })

      expect(destinations(wrapper)).toHaveLength(2)
    })
  })

  // W57-А: the consumer picks the item layout, `top` by default.
  describe('iconPlacement', () => {
    it.each(['top', 'start'] as const)('lays every destination out with its icon at the %s', async (iconPlacement) => {
      const wrapper = await mount({ iconPlacement })

      expect(wrapper.classes()).toContain(`ui-navigation-bar--${iconPlacement}`)
      expect(destinations(wrapper).every(item => item.classes().includes(`ui-navigation-item--${iconPlacement}`))).toBe(true)
    })

    it('puts the icon on top by default', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-navigation-bar--top')
    })

    // M3 `Centered`: the side margin shrinks as destinations are added.
    it.each([
      [2, 3],
      [3, 3],
      [4, 4],
      [5, 5],
      [6, 6],
      [7, 6],
    ])('centres %i horizontal destinations with the margin for %i', async (count, step) => {
      const many = Array.from({ length: count }, (_, i) => ({ id: `d${i}`, icon: 'outline-home', label: `D${i}` }))
      const wrapper = await mount({ items: many, iconPlacement: 'start' })

      expect(wrapper.classes()).toContain(`ui-navigation-bar--centered-${step}`)
    })

    it('spreads vertical destinations evenly, with no centred margin', async () => {
      const wrapper = await mount()

      expect(wrapper.classes().some(name => name.startsWith('ui-navigation-bar--centered'))).toBe(false)
    })
  })

  // B5.3a: the active destination carries a pill, not a colour alone.
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

    it('marks nothing active when the model matches no destination', async () => {
      const wrapper = await mount({ modelValue: 'missing' })

      expect(wrapper.find('.ui-navigation-item--active').exists()).toBe(false)
    })

    // W70-А
    it('fills the glyph of the active destination', async () => {
      const wrapper = await mount({ modelValue: 'search' })

      expect(destinations(wrapper)[1]!.html()).toContain('ic:baseline-search')
      expect(destinations(wrapper)[0]!.html()).toContain('ic:outline-home')
    })

    it('draws the activeIcon of the active destination', async () => {
      const wrapper = await mount({ items: [{ id: 'a', icon: 'mdi:star-outline', activeIcon: 'mdi:star', label: 'A' }], modelValue: 'a' })

      expect(wrapper.html()).toMatch(/mdi:star(?![-\w])/)
    })
  })

  // W58-А
  describe('disabled destination', () => {
    it('marks a disabled destination with its modifier', async () => {
      const wrapper = await mount({ items: [items[0]!, { ...items[1]!, disabled: true }] })

      expect(destinations(wrapper).map(item => item.classes().includes('ui-navigation-item--disabled'))).toEqual([false, true])
    })
  })

  describe('badge', () => {
    it.each([
      ['a positive count', 3, true],
      ['a dot', true, true],
      ['zero', 0, false],
      ['no badge', undefined, false],
    ])('draws a badge for %s', async (_, badge, shown) => {
      const wrapper = await mount({ items: [{ id: 'a', icon: 'outline-home', label: 'A', badge }] })

      expect(wrapper.find('.ui-navigation-item__badge').exists()).toBe(shown)
    })
  })

  describe('layout zone', () => {
    it('anchors itself as a zone when it is a direct child of m-layout', async () => {
      const wrapper = await mountInLayout(() => h(MLayout, null, () => [
        h(MLayoutMain, null, () => 'Body'),
        h(MNavigationBar, { items }),
      ]))
      const bar = wrapper.find('.ui-navigation-bar')

      expect(bar.classes()).toContain('ui-navigation-bar--anchored')
      expect(bar.attributes('data-m3-zone')).toBeTruthy()
      expect(bar.attributes('style')).toContain('grid-area')
    })

    it('stays plain content outside a layout', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-navigation-bar--anchored')
      expect(wrapper.attributes('data-m3-zone')).toBeUndefined()
    })

    it('stays plain content inside a layout zone', async () => {
      const wrapper = await mountInLayout(() => h(MLayout, null, () => [
        h(MLayoutMain, null, () => 'Body'),
        h(MLayoutFooter, null, () => h(MNavigationBar, { items })),
      ]))
      const bar = wrapper.find('.ui-navigation-bar')

      expect(bar.classes()).not.toContain('ui-navigation-bar--anchored')
      expect(bar.attributes('data-m3-zone')).toBeUndefined()
    })
  })

  describe('safe area', () => {
    it('clears the window cutouts itself outside a layout', async () => {
      expect((await mount()).classes()).toContain('ui-navigation-bar--safe-area')
    })

    it('leaves the cutouts to the layout as a zone and inside one', async () => {
      const wrapper = await mountInLayout(() => h(MLayout, null, () => [
        h(MLayoutMain, null, () => h(MNavigationBar, { items })),
        h(MNavigationBar, { items }),
        h(MLayoutFooter, null, () => h(MNavigationBar, { items })),
      ]))

      for (const bar of wrapper.findAll('.ui-navigation-bar')) {
        expect(bar.classes()).not.toContain('ui-navigation-bar--safe-area')
      }
    })
  })
})
