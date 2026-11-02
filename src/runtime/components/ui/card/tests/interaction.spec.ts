import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
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

describe('m-card · interaction', () => {
  describe('link destination', () => {
    it('follows the route it is given', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next' })

      expect(wrapper.attributes('href')).toBe('/next')
    })

    it('loses its destination when disabled, so a click goes nowhere', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', disabled: true })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBeUndefined()
    })

    it('gets its destination back when re-enabled', async () => {
      const wrapper = await mount({ tag: 'link', to: '/next', disabled: true })

      await wrapper.setProps({ disabled: false })

      expect(wrapper.attributes('href')).toBe('/next')
      expect(wrapper.classes()).not.toContain('ui-card--disabled')
    })
  })

  describe('reactivity', () => {
    it('starts pointing at the title once a title arrives', async () => {
      const wrapper = await mount({ subtitle: 'Only a subhead' })
      expect(wrapper.attributes('aria-labelledby')).toBeUndefined()

      await wrapper.setProps({ title: 'Now titled' })

      expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ui-card__title').attributes('id'))
    })

    it('switches between article and link with the tag', async () => {
      const wrapper = await mount({ title: 'Go', to: '/next' })
      expect(wrapper.element.tagName).toBe('ARTICLE')

      await wrapper.setProps({ tag: 'link' })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.find('header').exists()).toBe(false)
    })
  })

  // The contract warnings (`disabled` on a static card, interactive content
  // inside a link card) are guarded by `import.meta.dev`, which Vitest
  // resolves to `false`; they cannot be asserted here without weakening the
  // guard. Left uncovered on purpose, as in otp-input.

  describe('server render', () => {
    it('names the article by its title in the first paint', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MCard, { title: 'Hello', headingLevel: 2 }) }))
      const labelledBy = html.match(/aria-labelledby="([^"]+)"/)?.[1]

      expect(labelledBy).toBeTruthy()
      expect(html).toMatch(new RegExp(`<h2[^>]*id="${labelledBy}"`))
    })
  })
})
