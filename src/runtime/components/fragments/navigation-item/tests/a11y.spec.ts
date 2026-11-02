import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import NavigationItem from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(NavigationItem, {
    props: { host: 'bar', placement: 'top', label: 'Inbox', icon: 'outline-inbox', ...props },
  })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('navigation-item · a11y', () => {
  describe('role and name', () => {
    it('is a native button named by its label', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('type')).toBe('button')
      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.text()).toBe('Inbox')
    })

    it('hides the icon from assistive tech', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-navigation-item__icon .ui-icon').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('current destination', () => {
    it('marks the active destination aria-current="page"', async () => {
      expect((await mount({ active: true })).attributes('aria-current')).toBe('page')
      expect((await mount()).attributes('aria-current')).toBeUndefined()
    })

    it('renders aria-current in the server HTML', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(NavigationItem, { host: 'rail', placement: 'top', label: 'Inbox', icon: 'outline-inbox', active: true }),
      })))

      expect(html).toContain('aria-current="page"')
    })
  })

  // W58-А: a disabled destination leaves the Tab order like any disabled button.
  describe('disabled', () => {
    it('disables the button natively', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.attributes('disabled')).toBeDefined()
    })
  })

  // A11-04: the count must not be read before the name as "3 Inbox".
  describe('badge', () => {
    it('keeps the badge out of the name', async () => {
      const wrapper = await mount({ badge: 3 })

      expect(wrapper.find('.ui-navigation-item__badge').attributes('aria-hidden')).toBe('true')
    })

    it('keeps the drawer trailing count out of the name', async () => {
      const wrapper = await mount({ host: 'drawer', placement: 'start', badge: 24 })

      expect(wrapper.find('.ui-navigation-item__trailing').attributes('aria-hidden')).toBe('true')
    })

    it('reads badgeLabel as the description of the destination', async () => {
      const wrapper = await mount({ badge: 3, badgeLabel: '3 непрочитанных' })
      const description = wrapper.find(`#${wrapper.attributes('aria-describedby')}`)

      expect(description.text()).toBe('3 непрочитанных')
      expect(wrapper.element.contains(description.element)).toBe(true)
      expect(description.attributes('hidden')).toBeDefined()
    })

    it('describes nothing without badgeLabel', async () => {
      const wrapper = await mount({ badge: 3 })

      expect(wrapper.attributes('aria-describedby')).toBeUndefined()
    })
  })
})
