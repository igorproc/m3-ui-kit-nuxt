import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MBreadcrumbs from '../index.vue'
import { mount, unmount } from './helpers'

afterEach(unmount)

describe('m-breadcrumbs · a11y', () => {
  describe('landmark', () => {
    it('is a native navigation landmark around a native ordered list', async () => {
      const wrapper = await mount({ ariaLabel: 'Trail' })

      expect(wrapper.element.tagName).toBe('NAV')
      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.find('ol').attributes('role')).toBeUndefined()
    })

    it('takes its name from ariaLabel', async () => {
      const wrapper = await mount({ ariaLabel: 'Trail' })

      expect(wrapper.attributes('aria-label')).toBe('Trail')
    })

    // B8.5: the kit ships no English copy; an unnamed trail warns in development.
    it('ships no name of its own', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })
  })

  describe('current page', () => {
    it('marks exactly one crumb aria-current="page"', async () => {
      const wrapper = await mount()
      const current = wrapper.findAll('[aria-current]')

      expect(current).toHaveLength(1)
      expect(current[0]!.attributes('aria-current')).toBe('page')
      expect(current[0]!.text()).toBe('Laptops')
    })

    it('keeps the current crumb out of the Tab order: it is text, not a link', async () => {
      const wrapper = await mount({ items: [{ title: 'Home', to: '/' }, { title: 'Catalog', to: '/catalog', current: true }] })
      const current = wrapper.find('[aria-current="page"]')

      expect(current.element.tagName).toBe('SPAN')
      expect(current.attributes('tabindex')).toBeUndefined()
    })

    it('ships the current crumb in the server HTML', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MBreadcrumbs, { ariaLabel: 'Trail', items: [{ title: 'Home' }, { title: 'Laptops' }] }),
      }))

      expect(html).toMatch(/<li class="ui-breadcrumbs__item ui-breadcrumbs__item--current">/)
      expect(html).toContain('aria-current="page"')
    })
  })

  describe('disabled crumb', () => {
    it('says it is disabled and is no link', async () => {
      const wrapper = await mount({ items: [{ title: 'Home', to: '/' }, { title: 'Archive', to: '/archive', disabled: true }, { title: 'Now' }] })
      const disabled = wrapper.find('.ui-breadcrumbs__text--disabled')

      expect(disabled.attributes('aria-disabled')).toBe('true')
      expect(disabled.element.tagName).toBe('SPAN')
      expect(disabled.attributes('href')).toBeUndefined()
    })

    it('is never the current page', async () => {
      const wrapper = await mount({ items: [{ title: 'Home', to: '/' }, { title: 'Archive', disabled: true }] })

      expect(wrapper.find('.ui-breadcrumbs__text--disabled').attributes('aria-current')).toBeUndefined()
    })
  })

  describe('links', () => {
    it('renders every reachable crumb as a native link', async () => {
      const wrapper = await mount()

      for (const link of wrapper.findAll('.ui-breadcrumbs__link')) {
        expect(link.element.tagName).toBe('A')
        expect(link.attributes('href')).toBeTruthy()
      }
    })

    it('names each link by its title', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('.ui-breadcrumbs__link').map(link => link.text())).toEqual(['Home', 'Catalog'])
    })
  })

  describe('dividers', () => {
    it('hides every divider list item from assistive tech, so it is not read between crumbs', async () => {
      const wrapper = await mount()

      for (const divider of wrapper.findAll('.ui-breadcrumbs__divider')) {
        expect(divider.element.tagName).toBe('LI')
        expect(divider.attributes('aria-hidden')).toBe('true')
      }
    })

    it('keeps a slotted divider hidden too', async () => {
      const wrapper = await mount({}, { divider: () => h('span', { class: 'custom-divider' }, '›') })

      expect(wrapper.find('.custom-divider').element.closest('[aria-hidden="true"]')).not.toBeNull()
    })
  })

  describe('slot content', () => {
    it('keeps the leaf semantics around #item content', async () => {
      const wrapper = await mount({}, {
        item: ({ item }: { item: { title: string } }) => h('span', { class: 'custom-item' }, item.title),
      })

      expect(wrapper.find('[aria-current="page"] .custom-item').text()).toBe('Laptops')
      expect(wrapper.find('a.ui-breadcrumbs__link .custom-item').text()).toBe('Home')
    })
  })

  // The missing-title and duplicate-current warnings are guarded by `import.meta.dev`, which Vitest resolves to `false`.
})
