import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import type { MBreadcrumbsOverflow } from '../props'
import { ITEMS, mount, unmount } from './helpers'

afterEach(unmount)

const OVERFLOWS: MBreadcrumbsOverflow[] = ['scroll', 'wrap']

describe('m-breadcrumbs · variants', () => {
  describe('structure', () => {
    it('renders a nav around an ordered list with one list item per crumb', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('NAV')
      expect(wrapper.classes()).toContain('ui-breadcrumbs')
      expect(wrapper.find('ol.ui-breadcrumbs__list').exists()).toBe(true)
      expect(wrapper.findAll('li.ui-breadcrumbs__item')).toHaveLength(3)
    })

    it('renders an empty list for no crumbs', async () => {
      const wrapper = await mount({ items: [] })

      expect(wrapper.find('.ui-breadcrumbs__item').exists()).toBe(false)
      expect(wrapper.find('.ui-breadcrumbs__divider').exists()).toBe(false)
    })

    it('does not mutate the input items', async () => {
      const input = [{ title: 'Home', to: '/' }, { title: 'Catalog', to: '/catalog' }]
      const snapshot = structuredClone(input)

      await mount({ items: input })

      expect(input).toEqual(snapshot)
    })
  })

  describe('overflow', () => {
    it.each(OVERFLOWS)('applies the %s modifier to the list', async (overflow) => {
      const wrapper = await mount({ overflow })

      expect(wrapper.find('.ui-breadcrumbs__list').classes()).toContain(`ui-breadcrumbs__list--${overflow}`)
    })

    it('defaults to scroll', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-breadcrumbs__list').classes()).toContain('ui-breadcrumbs__list--scroll')
    })
  })

  describe('crumb kinds', () => {
    it('renders a crumb with a route as the canonical text link', async () => {
      const wrapper = await mount()
      const links = wrapper.findAll('.ui-breadcrumbs__link')

      expect(links).toHaveLength(2)
      expect(links[0]!.classes()).toContain('ui-button--text')
      expect(links[0]!.attributes('href')).toBe('/')
      expect(links[1]!.attributes('href')).toBe('/catalog')
    })

    it('renders the current crumb as current text', async () => {
      const wrapper = await mount()
      const text = wrapper.find('.ui-breadcrumbs__text')

      expect(text.text()).toBe('Laptops')
      expect(text.classes()).toContain('ui-breadcrumbs__text--current')
    })

    it('keeps a current crumb text even when it has a route', async () => {
      const wrapper = await mount({ items: [{ title: 'Home', to: '/' }, { title: 'Catalog', to: '/catalog', current: true }] })
      const current = wrapper.find('.ui-breadcrumbs__text--current')

      expect(current.element.tagName).toBe('SPAN')
      expect(current.attributes('href')).toBeUndefined()
    })

    it('renders a disabled crumb as disabled text even with a route', async () => {
      const wrapper = await mount({ items: [{ title: 'Home', to: '/' }, { title: 'Archive', to: '/archive', disabled: true }, { title: 'Now' }] })
      const disabled = wrapper.find('.ui-breadcrumbs__text--disabled')

      expect(disabled.text()).toBe('Archive')
      expect(disabled.attributes('href')).toBeUndefined()
    })

    it('renders a crumb without a route as plain text', async () => {
      const wrapper = await mount({ items: [{ title: 'Section' }, { title: 'Page' }] })
      const [first] = wrapper.findAll('.ui-breadcrumbs__text')

      expect(first!.text()).toBe('Section')
      expect(first!.classes()).not.toContain('ui-breadcrumbs__text--current')
      expect(first!.classes()).not.toContain('ui-breadcrumbs__text--disabled')
    })
  })

  describe('current', () => {
    it('makes the last crumb current when none is explicit', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('.ui-breadcrumbs__item').map(item => item.classes('ui-breadcrumbs__item--current'))).toEqual([false, false, true])
    })

    it('marks the list item of an explicit current crumb, wherever it is', async () => {
      const wrapper = await mount({ items: [...ITEMS.slice(0, 2), { title: 'Laptops', current: true }, { title: 'Gaming', to: '/gaming' }] })

      expect(wrapper.findAll('.ui-breadcrumbs__item').map(item => item.classes('ui-breadcrumbs__item--current'))).toEqual([false, false, true, false])
    })

    it('honours the first explicit current only', async () => {
      const wrapper = await mount({
        items: [{ title: 'Home', to: '/' }, { title: 'Catalog', to: '/catalog', current: true }, { title: 'Laptops', to: '/laptops', current: true }],
      })
      const current = wrapper.findAll('.ui-breadcrumbs__text--current')

      expect(current).toHaveLength(1)
      expect(current[0]!.text()).toBe('Catalog')
    })

    it('skips a disabled trailing crumb', async () => {
      const wrapper = await mount({ items: [{ title: 'Home', to: '/' }, { title: 'Archive', disabled: true }] })

      expect(wrapper.find('.ui-breadcrumbs__text--current').text()).toBe('Home')
    })

    it('has no current crumb when every crumb is disabled', async () => {
      const wrapper = await mount({ items: [{ title: 'A', disabled: true }, { title: 'B', disabled: true }] })

      expect(wrapper.find('.ui-breadcrumbs__item--current').exists()).toBe(false)
    })
  })

  describe('divider', () => {
    it('places a divider only between crumbs', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('.ui-breadcrumbs__divider')).toHaveLength(2)
    })

    it('renders no divider for a single crumb', async () => {
      const wrapper = await mount({ items: [{ title: 'Home' }] })

      expect(wrapper.find('.ui-breadcrumbs__divider').exists()).toBe(false)
    })

    it('draws the round chevron by default', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-breadcrumbs-divider__icon').exists()).toBe(true)
      expect(wrapper.html()).toContain('round-chevron-right')
    })

    it.each(['round-chevron-right', 'ic:round-arrow-forward', 'mdi:slash-forward'])('draws an icon-like divider %s as an icon', async (divider) => {
      const wrapper = await mount({ divider })

      expect(wrapper.find('.ui-breadcrumbs-divider__icon').exists()).toBe(true)
    })

    // Q27-А: the chevron points along the reading direction.
    it('mirrors an icon divider in RTL', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-breadcrumbs-divider__icon').classes()).toContain('ui-icon--mirror')
    })

    it.each(['/', '>', '•', 'Chevron'])('renders a divider %s as text', async (divider) => {
      const wrapper = await mount({ divider })

      expect(wrapper.find('.ui-breadcrumbs-divider__icon').exists()).toBe(false)
      expect(wrapper.find('.ui-breadcrumbs-divider').text()).toBe(divider)
    })
  })

  describe('slots', () => {
    it('replaces the content of every crumb through #item and hands it the crumb state', async () => {
      const wrapper = await mount({}, {
        item: ({ item, index, current, disabled }: { item: { title: string }, index: number, current: boolean, disabled: boolean }) =>
          h('span', { class: 'custom-item' }, `${index}:${item.title}${current ? '*' : ''}${disabled ? '-' : ''}`),
      })

      expect(wrapper.findAll('.custom-item').map(item => item.text())).toEqual(['0:Home', '1:Catalog', '2:Laptops*'])
    })

    it('replaces every divider through #divider', async () => {
      const wrapper = await mount({}, { divider: () => h('span', { class: 'custom-divider' }, '›') })

      expect(wrapper.findAll('.custom-divider')).toHaveLength(2)
      expect(wrapper.find('.ui-breadcrumbs-divider__icon').exists()).toBe(false)
    })

    it('renders #prepend and #append inside the list, around the crumbs', async () => {
      const wrapper = await mount({}, {
        prepend: () => h('li', { class: 'lead' }, 'lead'),
        append: () => h('li', { class: 'tail' }, 'tail'),
      })
      const children = Array.from(wrapper.find('ol.ui-breadcrumbs__list').element.children)

      expect(children[0]!.classList.contains('lead')).toBe(true)
      expect(children.at(-1)!.classList.contains('tail')).toBe(true)
    })
  })
})
