import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MNavigationRail from '../index.vue'
import type { MNavigationRailItem as RailItem } from '../props'

const items: RailItem[] = [
  { id: 'home', icon: 'outline-home', label: 'Home' },
  { id: 'search', icon: 'outline-search', label: 'Search' },
  { id: 'profile', icon: 'outline-person', label: 'Profile', badge: 2, badgeLabel: '2 new' },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MNavigationRail, { props: { items, ...props }, attrs, slots })

  return current as VueWrapper
}

const itemsOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-navigation-rail .ui-navigation-item')
const menu = { header: ({ toggleAttrs }: { toggleAttrs: Record<string, unknown> }) => h('button', { ...toggleAttrs, class: 'menu' }, 'Menu') }

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-navigation-rail · a11y', () => {
  describe('landmark', () => {
    it('is a native nav landmark', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('NAV')
      expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('takes its name from ariaLabel', async () => {
      const wrapper = await mount({ ariaLabel: 'Sections' })

      expect(wrapper.attributes('aria-label')).toBe('Sections')
    })

    // B8.5: a lone navigation landmark needs no name, so the kit ships no English one.
    it('ships no name of its own', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it('takes its name from a visible heading', async () => {
      const wrapper = await mount({}, { 'aria-labelledby': 'rail-heading' })

      expect(wrapper.attributes('aria-labelledby')).toBe('rail-heading')
    })
  })

  describe('destinations', () => {
    it('renders each destination as a native button named by its label', async () => {
      const wrapper = await mount()

      for (const item of itemsOf(wrapper)) {
        expect(item.element.tagName).toBe('BUTTON')
        expect(item.attributes('type')).toBe('button')
      }
      expect(itemsOf(wrapper).map(item => item.find('.ui-navigation-item__label').text())).toEqual(['Home', 'Search', 'Profile'])
    })

    it('hides the icon and the badge from assistive tech and reads badgeLabel after the name', async () => {
      const wrapper = await mount()
      const profile = itemsOf(wrapper)[2]!

      expect(profile.find('.ui-icon').attributes('aria-hidden')).toBe('true')
      expect(profile.find('.ui-navigation-item__badge').attributes('aria-hidden')).toBe('true')
      expect(profile.find(`#${profile.attributes('aria-describedby')}`).text()).toBe('2 new')
    })
  })

  describe('current destination', () => {
    it('marks the selected destination with aria-current="page" and nothing else', async () => {
      const wrapper = await mount({ modelValue: 'profile' })

      expect(itemsOf(wrapper).map(item => item.attributes('aria-current'))).toEqual([undefined, undefined, 'page'])
    })

    it('marks the current destination in the server HTML', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MNavigationRail, { items, modelValue: 'search' }),
      })))

      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    })
  })

  // W56-А
  describe('focus order', () => {
    it('keeps every destination in the Tab order', async () => {
      const wrapper = await mount({ modelValue: 'search' })

      expect(itemsOf(wrapper).map(item => item.attributes('tabindex'))).toEqual([undefined, undefined, undefined])
    })

    it('takes a disabled destination out of the Tab order natively', async () => {
      const wrapper = await mount({ items: [{ ...items[0]!, disabled: true }] })

      expect(itemsOf(wrapper)[0]!.attributes('disabled')).toBeDefined()
    })
  })

  // W60-Б: the kit ships no text, the consumer's menu button takes the bindings.
  describe('menu button', () => {
    it.each([
      [false, 'false'],
      [true, 'true'],
    ])('reports expanded=%s through aria-expanded', async (expanded, value) => {
      const wrapper = await mount({ expanded }, {}, menu)

      expect(wrapper.find('.menu').attributes('aria-expanded')).toBe(value)
    })

    it('points aria-controls at the list it expands', async () => {
      const wrapper = await mount({}, {}, menu)
      const controls = wrapper.find('.menu').attributes('aria-controls')

      expect(controls).toBeTruthy()
      expect(wrapper.find('.ui-navigation-rail__list').attributes('id')).toBe(controls)
    })

    it('renders the bindings as ARIA attributes on the server', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MNavigationRail, { items, expanded: true }, menu),
      })))
      const button = html.match(/<button[^>]*class="menu"[^>]*>/)?.[0] ?? ''

      expect(button).toContain('aria-expanded="true"')
      expect(button).toMatch(/aria-controls="[^"]+"/)
      expect(html).not.toMatch(/ariaexpanded|ariacontrols/i)
    })
  })
})
