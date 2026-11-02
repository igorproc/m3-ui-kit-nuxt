import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MNavigationBar from '../index.vue'
import type { MNavigationBarItem } from '../props'

const items: MNavigationBarItem[] = [
  { id: 'home', icon: 'outline-home', label: 'Home' },
  { id: 'search', icon: 'outline-search', label: 'Search' },
  { id: 'profile', icon: 'outline-person', label: 'Profile', badge: 3, badgeLabel: '3 new' },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MNavigationBar, { props: { items, ...props }, attrs })

  return current as VueWrapper
}

const buttonsOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-navigation-bar__item')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-navigation-bar · a11y', () => {
  describe('landmark', () => {
    it('is a native nav landmark', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('NAV')
      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('takes its name from ariaLabel', async () => {
      const wrapper = await mount({ ariaLabel: 'Primary navigation' })

      expect(wrapper.attributes('aria-label')).toBe('Primary navigation')
    })

    // B8.5: a lone navigation landmark needs no name, so the kit ships no English one.
    it('ships no name of its own', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it('takes its name from a visible heading', async () => {
      const wrapper = await mount({}, { 'aria-labelledby': 'nav-heading' })

      expect(wrapper.attributes('aria-labelledby')).toBe('nav-heading')
    })
  })

  describe('destinations', () => {
    it('renders each destination as a native button named by its label', async () => {
      const wrapper = await mount()

      for (const button of buttonsOf(wrapper)) {
        expect(button.element.tagName).toBe('BUTTON')
        expect(button.attributes('type')).toBe('button')
        expect(button.attributes('role')).toBeUndefined()
      }
      expect(buttonsOf(wrapper).map(button => button.find('.ui-navigation-item__label').text())).toEqual(['Home', 'Search', 'Profile'])
    })

    it('reads the badge after the name, through badgeLabel', async () => {
      const wrapper = await mount()
      const profile = buttonsOf(wrapper)[2]!

      expect(profile.find('.ui-navigation-item__badge').attributes('aria-hidden')).toBe('true')
      expect(profile.find(`#${profile.attributes('aria-describedby')}`).text()).toBe('3 new')
    })

    it('disables a disabled destination natively', async () => {
      const wrapper = await mount({ items: [{ ...items[0]!, disabled: true }] })

      expect(buttonsOf(wrapper)[0]!.attributes('disabled')).toBeDefined()
    })
  })

  describe('current destination', () => {
    it('marks the selected destination with aria-current="page" and nothing else', async () => {
      const wrapper = await mount({ modelValue: 'search' })

      expect(buttonsOf(wrapper).map(button => button.attributes('aria-current'))).toEqual([undefined, 'page', undefined])
    })

    it('sets no aria-current with an empty model', async () => {
      const wrapper = await mount()

      expect(wrapper.find('[aria-current]').exists()).toBe(false)
    })

    it('marks the current destination in the server HTML', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MNavigationBar, { items, modelValue: 'profile' }),
      })))

      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
      expect(html.slice(html.indexOf('aria-current="page"'))).toContain('Profile')
    })
  })

  // W56-А: every destination is a Tab stop, as in any site navigation.
  describe('focus order', () => {
    it('keeps every destination in the Tab order', async () => {
      const wrapper = await mount({ modelValue: 'search' })

      expect(buttonsOf(wrapper).map(button => button.attributes('tabindex'))).toEqual([undefined, undefined, undefined])
    })

    it('renders no roving tabindex in the server HTML', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MNavigationBar, { items, modelValue: 'search' }),
      })))

      expect(html).not.toContain('tabindex')
    })
  })
})
