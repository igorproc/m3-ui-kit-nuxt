import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MCard from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MCard, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-card · a11y', () => {
  describe('role', () => {
    it('relies on the native article role rather than an invented one', async () => {
      const wrapper = await mount({ title: 'Hello' })

      expect(wrapper.element.tagName).toBe('ARTICLE')
      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('is neither a link nor a Tab stop without tag="link"', async () => {
      const wrapper = await mount({ title: 'Static', to: '/next' })

      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.find('[tabindex]').exists()).toBe(false)
    })

    it('relies on the native anchor for a link card', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', title: 'Go' })

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })
  })

  describe('naming', () => {
    it('names the article by its title', async () => {
      const wrapper = await mount({ title: 'Hello' })
      const title = wrapper.find('.ui-card__title')

      expect(title.attributes('id')).toBeTruthy()
      expect(wrapper.attributes('aria-labelledby')).toBe(title.attributes('id'))
    })

    it('keeps the card named by a title filled through #title', async () => {
      const wrapper = await mount({}, { title: () => h('em', 'Rich title') })

      expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ui-card__title').attributes('id'))
    })

    it('does not point at a title the header slot replaced', async () => {
      const wrapper = await mount({ title: 'Hello' }, { header: () => 'Custom' })

      expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
    })

    it('leaves the article unnamed with a subhead alone', async () => {
      const wrapper = await mount({ subtitle: 'Only a subhead' })

      expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
    })

    it('names a link card by its title, not by all of its content', async () => {
      const wrapper = await mount(
        { tag: 'link', to: '/next', title: 'Go', subtitle: 'Somewhere' },
        { default: () => 'Long supporting text' },
      )

      expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ui-card__title').attributes('id'))
    })

    it('lets a titleless link card fall back to its content for a name', async () => {
      const titleless = await mount({ tag: 'link', to: '/next', subtitle: 'Somewhere' })
      expect(titleless.attributes('aria-labelledby')).toBeUndefined()

      const replaced = await mount({ tag: 'link', to: '/next', title: 'Go' }, { header: () => 'Custom' })
      expect(replaced.attributes('aria-labelledby')).toBeUndefined()
    })

    it('gives every card its own title id', async () => {
      const wrapper = await mountSuspended(defineComponent({
        render: () => h('div', [h(MCard, { title: 'One' }), h(MCard, { title: 'Two' })]),
      }))
      const [first, second] = wrapper.findAll('article')

      expect(first!.attributes('aria-labelledby')).toBeTruthy()
      expect(first!.attributes('aria-labelledby')).not.toBe(second!.attributes('aria-labelledby'))
      wrapper.unmount()
    })
  })

  describe('landmarks', () => {
    it('scopes header and footer to the article', async () => {
      const wrapper = await mount({ title: 'Hello' }, { actions: () => 'A' })

      expect(wrapper.find('header.ui-card__header').exists()).toBe(true)
      expect(wrapper.find('footer.ui-card__actions').exists()).toBe(true)
    })

    it('draws the parts of a link card with plain elements — inside a link they would be page landmarks', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', title: 'Go' }, { actions: () => 'A' })

      expect(wrapper.find('header').exists()).toBe(false)
      expect(wrapper.find('footer').exists()).toBe(false)
      expect(wrapper.find('div.ui-card__header').exists()).toBe(true)
      expect(wrapper.find('div.ui-card__actions').exists()).toBe(true)
    })
  })

  describe('disabled link', () => {
    it('stays a link to assistive tech and says it is disabled', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', disabled: true })

      expect(wrapper.attributes('role')).toBe('link')
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('drops out of the Tab order with its destination', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', disabled: true })

      expect(wrapper.attributes('href')).toBeUndefined()
      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })

    it('reports no disabled state on an enabled link or a static card', async () => {
      const link = await mount({ tag: 'link', to: '/next' })
      expect(link.attributes('aria-disabled')).toBeUndefined()

      const article = await mount({ disabled: true })
      expect(article.attributes('aria-disabled')).toBeUndefined()
    })
  })
})
