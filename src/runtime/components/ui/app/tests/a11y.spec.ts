import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MApp from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(options: Parameters<typeof mountSuspended>[1] = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MApp, options)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-app · a11y', () => {
  describe('landmarks', () => {
    // The page's own header/main/footer are the landmarks; a boundary role would wrap them all in one.
    it.each(['div', 'section'])('adds no landmark role of its own (tag=%s)', async (tag) => {
      const wrapper = await mount({ props: { tag } })

      expect(wrapper.find('.ui-app').attributes('role')).toBeUndefined()
    })
  })

  describe('skip link', () => {
    it('is a real link, the first Tab stop of the page, pointing at the target', async () => {
      const wrapper = await mount({
        props: { skipLinkLabel: 'Skip to content', skipLinkTarget: 'content' },
        slots: { default: () => h('button', 'Menu') },
      })
      const link = wrapper.find('.ui-app__skip-link')

      expect(link.element.tagName).toBe('A')
      expect(link.text()).toBe('Skip to content')
      expect(link.attributes('href')).toBe('#content')
      expect(wrapper.find('.ui-app').element.firstElementChild).toBe(link.element)
    })

    it('stays in the tab order: it is hidden visually, never from assistive tech', async () => {
      const wrapper = await mount({ props: { skipLinkLabel: 'Skip to content' } })
      const link = wrapper.find('.ui-app__skip-link')

      expect(link.attributes('tabindex')).toBeUndefined()
      expect(link.attributes('aria-hidden')).toBeUndefined()
      expect(link.attributes('hidden')).toBeUndefined()
    })
  })

  describe('overlay host', () => {
    it('is one unnamed host after the content, holding only the announcement regions, so overlays follow the page in reading order', async () => {
      const wrapper = await mount({ slots: { default: () => h('main', { id: 'main' }, 'Page') } })
      const host = wrapper.find('#ui-overlay-host')
      const main = wrapper.find('main')

      expect(host.attributes('role')).toBeUndefined()
      expect(host.attributes('aria-hidden')).toBeUndefined()
      expect(Array.from(host.element.children).map(child => child.className)).toEqual(['ui-live-region'])
      expect(main.element.compareDocumentPosition(host.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })
})
