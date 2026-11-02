import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router } from 'vue-router'
import MTabs from '../index.vue'
import MTab from '../tab/index.vue'
import type { MTabItem } from '../props'

const items: MTabItem[] = [
  { value: 'overview', label: 'Overview', to: '/button/overview' },
  { value: 'reference', label: 'Reference', to: '/button/reference' },
  { value: 'archive', label: 'Archive', to: '/button/archive', disabled: true },
]

let current: { unmount: () => void } | null = null

async function routerAt(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  await router.push(path)
  await router.isReady()

  return router
}

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>, router?: Router) {
  if (current) current.unmount()
  current = await mountSuspended(MTabs, {
    props: { items, ariaLabel: 'Button pages', ...props },
    slots,
    global: { plugins: [router ?? await routerAt('/button/overview')] },
    attachTo: document.body,
  })

  return current as VueWrapper
}

const links = (wrapper: VueWrapper) => wrapper.findAll('.ui-tabs__tab')

afterEach(() => {
  current?.unmount()
  current = null
})

// W55-А: tabs that lead to routes are a navigation, not a tablist.
describe('m-tabs · routes', () => {
  describe('markup', () => {
    it('renders a named nav landmark of links, without the tab roles', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('NAV')
      expect(wrapper.attributes('aria-label')).toBe('Button pages')
      expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
      expect(wrapper.find('[role="tab"]').exists()).toBe(false)
      expect(links(wrapper).slice(0, 2).every(link => link.element.tagName === 'A')).toBe(true)
      expect(links(wrapper)[1]!.attributes('href')).toBe('/button/reference')
    })

    it('names the landmark through a visible heading', async () => {
      const wrapper = await mount({ ariaLabel: undefined, ariaLabelledby: 'pages-heading' })

      expect(wrapper.attributes('aria-labelledby')).toBe('pages-heading')
      expect(wrapper.find('.ui-tabs__list').attributes('aria-labelledby')).toBeUndefined()
    })

    it('renders no panel, even with a panel slot', async () => {
      const wrapper = await mount({}, { default: () => 'Body', panels: () => h('div', { class: 'panel' }) })

      expect(wrapper.find('.ui-tabs__content').exists()).toBe(false)
      expect(wrapper.find('.panel').exists()).toBe(false)
    })

    it('treats slotted tabs with a route the same way', async () => {
      if (current) current.unmount()
      current = await mountSuspended(defineComponent({
        render: () => h(MTabs, { ariaLabel: 'Button pages' }, {
          tabs: () => items.slice(0, 2).map(item => h(MTab, { value: item.value, label: item.label, to: item.to })),
        }),
      }), { global: { plugins: [await routerAt('/button/reference')] } })
      const wrapper = current as VueWrapper

      expect(wrapper.find('nav').exists()).toBe(true)
      expect(wrapper.find('[role="tab"]').exists()).toBe(false)
      expect(wrapper.find('[aria-current="page"]').text()).toBe('Reference')
    })
  })

  describe('selection follows the route', () => {
    it('marks the link of the current route with aria-current="page" and the active modifier', async () => {
      const wrapper = await mount({}, undefined, await routerAt('/button/reference'))

      expect(links(wrapper).map(link => link.attributes('aria-current'))).toEqual([undefined, 'page', undefined])
      expect(links(wrapper)[1]!.classes()).toContain('ui-tabs__tab--active')
      expect(links(wrapper)[0]!.classes()).not.toContain('ui-tabs__tab--active')
    })

    it('moves the mark when the route changes', async () => {
      const router = await routerAt('/button/overview')
      const wrapper = await mount({}, undefined, router)

      await router.push('/button/reference')
      await nextTick()

      expect(wrapper.find('[aria-current="page"]').text()).toBe('Reference')
    })

    it('ignores the model: the route is the selection', async () => {
      const wrapper = await mount({ modelValue: 'reference' })

      expect(wrapper.find('[aria-current="page"]').text()).toBe('Overview')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('marks nothing on a route no tab leads to', async () => {
      const wrapper = await mount({}, undefined, await routerAt('/elsewhere'))

      expect(wrapper.find('[aria-current]').exists()).toBe(false)
      expect(wrapper.find('.ui-tabs__tab--active').exists()).toBe(false)
    })

    it('marks the current link in the server HTML', async () => {
      const router = await routerAt('/button/reference')
      const app = createSSRApp(defineComponent({ render: () => h(MTabs, { items, ariaLabel: 'Button pages' }) }))
      app.use(router)
      const html = await renderToString(app)

      expect(html).toMatch(/^<nav/)
      expect(html).not.toContain('role="tab')
      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    })
  })

  describe('keyboard', () => {
    it('leaves the arrows to the browser: every link is a Tab stop', async () => {
      const wrapper = await mount()
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })

      wrapper.find('.ui-tabs__list').element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
      expect(links(wrapper).slice(0, 2).every(link => link.attributes('tabindex') === undefined)).toBe(true)
    })
  })

  describe('disabled', () => {
    it('marks a disabled link with aria-disabled and does not follow it', async () => {
      const router = await routerAt('/button/overview')
      const wrapper = await mount({}, undefined, router)
      const archive = links(wrapper)[2]!

      expect(archive.attributes('aria-disabled')).toBe('true')

      await archive.trigger('click')
      await nextTick()

      expect(router.currentRoute.value.path).toBe('/button/overview')
    })
  })
})
