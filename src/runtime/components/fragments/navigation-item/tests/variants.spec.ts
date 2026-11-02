import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import NavigationItem from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(NavigationItem, {
    props: { host: 'bar', placement: 'top', label: 'Inbox', icon: 'outline-inbox', ...props },
  })

  return current as VueWrapper
}

const classNames = (wrapper: VueWrapper, selector: string) =>
  Array.from(wrapper.find(selector).element.children).map(child => child.className)

afterEach(() => {
  current?.unmount()
  current = null
})

describe('navigation-item · variants', () => {
  describe('host', () => {
    it.each(['bar', 'rail', 'drawer'] as const)('takes the %s tokens through its modifier', async (host) => {
      const wrapper = await mount({ host })

      expect(wrapper.classes()).toContain(`ui-navigation-item--${host}`)
    })
  })

  describe('placement', () => {
    it('keeps only the icon in the pill and puts the label under it when on top', async () => {
      const wrapper = await mount({ placement: 'top' })

      expect(wrapper.classes()).toContain('ui-navigation-item--top')
      expect(classNames(wrapper, '.ui-navigation-item')).toEqual(['ui-navigation-item__indicator', 'ui-navigation-item__label'])
      expect(classNames(wrapper, '.ui-navigation-item__indicator')).toEqual(['ui-navigation-item__icon'])
    })

    it('puts the icon and the label side by side in the pill at the start', async () => {
      const wrapper = await mount({ placement: 'start' })

      expect(wrapper.classes()).toContain('ui-navigation-item--start')
      expect(classNames(wrapper, '.ui-navigation-item')).toEqual(['ui-navigation-item__indicator'])
      expect(classNames(wrapper, '.ui-navigation-item__indicator')).toEqual(['ui-navigation-item__icon', 'ui-navigation-item__label'])
    })

    it('renders the label it is given', async () => {
      const wrapper = await mount({ label: 'Входящие' })

      expect(wrapper.find('.ui-navigation-item__label').text()).toBe('Входящие')
    })

    it('draws no icon box for a destination without an icon', async () => {
      const wrapper = await mount({ host: 'drawer', placement: 'start', icon: undefined })

      expect(wrapper.find('.ui-navigation-item__icon').exists()).toBe(false)
    })
  })

  describe('state modifiers', () => {
    it.each([
      ['active', 'ui-navigation-item--active'],
      ['disabled', 'ui-navigation-item--disabled'],
    ])('maps %s onto its modifier', async (prop, modifier) => {
      expect((await mount({ [prop]: true })).classes()).toContain(modifier)
      expect((await mount()).classes()).not.toContain(modifier)
    })
  })

  // W70-А: the selected destination draws a filled glyph.
  describe('active glyph', () => {
    it('fills the outline glyph of the active destination', async () => {
      const wrapper = await mount({ active: true })

      expect(wrapper.html()).toContain('ic:baseline-inbox')
    })

    it('keeps the outline glyph while inactive', async () => {
      const wrapper = await mount()

      expect(wrapper.html()).toContain('ic:outline-inbox')
    })

    it('swaps in activeIcon for a glyph without a filled pair', async () => {
      const wrapper = await mount({ icon: 'mdi:star-outline', activeIcon: 'mdi:star', active: true })

      expect(wrapper.html()).toContain('mdi:star')
      expect(wrapper.html()).not.toContain('mdi:star-outline')
    })

    it('ignores activeIcon while inactive', async () => {
      const wrapper = await mount({ icon: 'mdi:star-outline', activeIcon: 'mdi:star' })

      expect(wrapper.html()).toContain('mdi:star-outline')
    })
  })

  describe('badge', () => {
    it.each(['bar', 'rail'] as const)('anchors a count to the icon in the %s', async (host) => {
      const wrapper = await mount({ host, badge: 3 })
      const badge = wrapper.find('.ui-navigation-item__icon .ui-navigation-item__badge')

      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('3')
      expect(badge.classes()).not.toContain('ui-navigation-item__badge--dot')
    })

    it('draws a dot for badge: true', async () => {
      const wrapper = await mount({ badge: true })

      expect(wrapper.find('.ui-navigation-item__badge').classes()).toContain('ui-navigation-item__badge--dot')
      expect(wrapper.find('.ui-badge--small').exists()).toBe(true)
    })

    it.each([0, undefined])('draws no badge for %s', async (badge) => {
      const wrapper = await mount({ badge })

      expect(wrapper.find('.ui-navigation-item__badge').exists()).toBe(false)
    })

    it('shows the badge as trailing text in the drawer', async () => {
      const wrapper = await mount({ host: 'drawer', placement: 'start', badge: 24 })

      expect(wrapper.find('.ui-navigation-item__badge').exists()).toBe(false)
      expect(wrapper.find('.ui-navigation-item__indicator .ui-navigation-item__trailing').text()).toBe('24')
    })

    it('draws no trailing text in the drawer without a badge', async () => {
      const wrapper = await mount({ host: 'drawer', placement: 'start' })

      expect(wrapper.find('.ui-navigation-item__trailing').exists()).toBe(false)
    })
  })
})
