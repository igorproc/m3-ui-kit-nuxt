import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MAppBar from '../index.vue'
import MAppBarNav from '../nav/index.vue'
import MAppBarTitle from '../title/index.vue'
import MAppBarActions from '../actions/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MAppBar, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-app-bar · a11y', () => {
  describe('headline', () => {
    it('is a heading of the named level, so the screen title is in the outline', async () => {
      const wrapper = await mount({ title: 'Inbox', headingLevel: 1 })

      expect(wrapper.find('h1').text()).toBe('Inbox')
    })

    it('is no heading without a level: the kit does not guess the outline', async () => {
      const wrapper = await mount({ title: 'Inbox' })

      expect(wrapper.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false)
    })

    it('never turns the subtitle into a second heading', async () => {
      const wrapper = await mount({ title: 'Inbox', subtitle: 'unread', headingLevel: 2 })

      expect(wrapper.findAll('h1, h2, h3, h4, h5, h6')).toHaveLength(1)
    })

    it('ships the heading in the server HTML', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MAppBar, { title: 'Inbox', headingLevel: 1 }),
      }))

      // The one-line title holds its text in the box that carries the ellipsis
      expect(html).toMatch(/<h1[^>]*class="ui-app-bar__title[^"]*"[^>]*>(?:(?!<\/h1>)[\s\S])*Inbox(?:(?!<\/h1>)[\s\S])*<\/h1>/)
    })

    it('ships the inherited level of a composed title in the server HTML', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MAppBar, { headingLevel: 2 }, { default: () => h(MAppBarTitle, { title: 'Inbox' }) }),
      }))

      expect(html).toMatch(/<h2[^>]*class="ui-app-bar__title[^"]*"/)
    })
  })

  describe('landmark', () => {
    it('is a native header: a banner at the top of the page, with no invented role', async () => {
      const wrapper = await mount({ title: 'Inbox' })

      expect(wrapper.element.tagName).toBe('HEADER')
      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('ships the header element in the server HTML', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MAppBar, { title: 'Inbox' }) }))

      expect(html).toMatch(/^<header[^>]*class="ui-app-bar/)
    })
  })

  describe('collapsed title', () => {
    it('hides the repeated title from assistive tech: the headline already names the screen', async () => {
      const wrapper = await mount({ type: 'medium', title: 'Inbox', headingLevel: 1, scrollBehavior: 'collapse' })

      expect(wrapper.find('.ui-app-bar__collapsed').attributes('aria-hidden')).toBe('true')
      expect(wrapper.findAll('h1, h2, h3, h4, h5, h6')).toHaveLength(1)
    })

    it('renders the repeated title on the server already, hidden at rest', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MAppBar, { type: 'large', title: 'Inbox', scrollBehavior: 'collapse' }),
      }))

      expect(html).toMatch(/class="ui-app-bar__collapsed"[^>]*aria-hidden="true"/)
      expect(html).not.toContain('ui-app-bar--collapsed')
    })
  })

  describe('focus order', () => {
    it('keeps the DOM order nav → headline → actions, which the Tab order follows', async () => {
      const wrapper = await mount({}, {
        default: () => [
          h(MAppBarNav, null, { default: () => h('button', { 'type': 'button', 'aria-label': 'Back' }) }),
          h(MAppBarTitle, { title: 'Inbox' }),
          h(MAppBarActions, null, { default: () => h('button', { 'type': 'button', 'aria-label': 'Search' }) }),
        ],
      })

      expect(wrapper.findAll('button').map(button => button.attributes('aria-label'))).toEqual(['Back', 'Search'])
    })

    it('adds no Tab stop of its own', async () => {
      const wrapper = await mount({ title: 'Inbox' })

      expect(wrapper.find('[tabindex]').exists()).toBe(false)
    })
  })
})
