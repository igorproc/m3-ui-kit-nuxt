import { afterEach, describe, expect, it } from 'vitest'
import { ITEMS, mount, unmount } from './helpers'

afterEach(unmount)

const currentText = (wrapper: Awaited<ReturnType<typeof mount>>) => wrapper.find('.ui-breadcrumbs__text--current').text()

describe('m-breadcrumbs · interaction', () => {
  describe('items change', () => {
    it('moves current to the new last crumb when the trail grows', async () => {
      const wrapper = await mount()

      await wrapper.setProps({ items: [...ITEMS.slice(0, 2), { title: 'Laptops', to: '/laptops' }, { title: 'Gaming' }] })

      expect(currentText(wrapper)).toBe('Gaming')
      expect(wrapper.findAll('.ui-breadcrumbs__link').map(link => link.text())).toEqual(['Home', 'Catalog', 'Laptops'])
    })

    it('turns the former current crumb back into a link when it gets a route', async () => {
      const wrapper = await mount({ items: [{ title: 'Home', to: '/' }, { title: 'Catalog', to: '/catalog', current: true }, { title: 'Laptops' }] })

      expect(currentText(wrapper)).toBe('Catalog')

      await wrapper.setProps({ items: [{ title: 'Home', to: '/' }, { title: 'Catalog', to: '/catalog' }, { title: 'Laptops' }] })

      expect(currentText(wrapper)).toBe('Laptops')
      expect(wrapper.findAll('.ui-breadcrumbs__link').at(-1)!.attributes('href')).toBe('/catalog')
    })

    it('keeps one divider fewer than crumbs as the trail shrinks', async () => {
      const wrapper = await mount()

      await wrapper.setProps({ items: ITEMS.slice(0, 2) })

      expect(wrapper.findAll('.ui-breadcrumbs__divider')).toHaveLength(1)
    })
  })

  describe('overflow change', () => {
    it('switches the list modifier at runtime', async () => {
      const wrapper = await mount()

      await wrapper.setProps({ overflow: 'wrap' })

      const list = wrapper.find('.ui-breadcrumbs__list')
      expect(list.classes()).toContain('ui-breadcrumbs__list--wrap')
      expect(list.classes()).not.toContain('ui-breadcrumbs__list--scroll')
    })
  })
})
