import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MBreadcrumbs from './index.vue'

const items = [
  { title: 'Home', to: '/' },
  { title: 'Catalog', to: '/catalog' },
  { title: 'Laptops' },
]

/**
 * The kit layer ships no pages, so the Nuxt test environment provides no
 * router. Active crumbs delegate to the canonical NuxtLink-backed control, so
 * a memory router is installed to exercise that path for real.
 */
async function mountBreadcrumbs(options: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  await router.push('/')
  await router.isReady()

  return mountSuspended(MBreadcrumbs, { ...options, global: { plugins: [router] } })
}

describe('MBreadcrumbs', () => {
  it('renders a labelled nav with an ordered list', async () => {
    const wrapper = await mountBreadcrumbs({ props: { items } })
    const nav = wrapper.find('nav.ui-breadcrumbs')
    expect(nav.attributes('aria-label')).toBe('Breadcrumbs')
    expect(wrapper.find('ol.ui-breadcrumbs__list').exists()).toBe(true)
    expect(wrapper.findAll('.ui-breadcrumbs__item')).toHaveLength(3)
  })

  it('marks the last non-disabled item current when none is explicit', async () => {
    const wrapper = await mountBreadcrumbs({ props: { items } })
    const current = wrapper.findAll('[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toBe('Laptops')
  })

  it('does not make a disabled trailing crumb current', async () => {
    const wrapper = await mountBreadcrumbs({
      props: { items: [{ title: 'Home', to: '/' }, { title: 'Archive', disabled: true }] },
    })
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Home')
    expect(wrapper.find('.ui-breadcrumbs__text--disabled').attributes('aria-disabled')).toBe('true')
  })

  it('honors the first explicit current only', async () => {
    const wrapper = await mountBreadcrumbs({
      props: {
        items: [
          { title: 'Home', to: '/' },
          { title: 'Catalog', to: '/catalog', current: true },
          { title: 'Laptops', to: '/catalog/laptops', current: true },
        ],
      },
    })
    const current = wrapper.findAll('[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toBe('Catalog')
  })

  it('keeps a current crumb as text even when it has a route', async () => {
    const wrapper = await mountBreadcrumbs({
      props: { items: [{ title: 'Home', to: '/' }, { title: 'Catalog', to: '/catalog', current: true }] },
    })
    const current = wrapper.find('[aria-current="page"]')
    expect(current.element.tagName).toBe('SPAN')
    expect(current.attributes('href')).toBeUndefined()
  })

  it('renders active crumbs through the canonical text-link', async () => {
    const wrapper = await mountBreadcrumbs({ props: { items } })
    const links = wrapper.findAll('.ui-breadcrumbs__link')
    expect(links).toHaveLength(2)
    expect(links[0]!.classes()).toContain('ui-button--text')
    expect(links[0]!.attributes('href')).toBe('/')
  })

  it('places dividers only between crumbs and hides them from assistive tech', async () => {
    const wrapper = await mountBreadcrumbs({ props: { items } })
    const dividers = wrapper.findAll('.ui-breadcrumbs__divider')
    expect(dividers).toHaveLength(2)
    expect(dividers[0]!.attributes('aria-hidden')).toBe('true')
    expect(wrapper.html()).toContain('round-chevron-right')
  })

  it('renders no divider for a single crumb', async () => {
    const wrapper = await mountBreadcrumbs({ props: { items: [{ title: 'Home' }] } })
    expect(wrapper.find('.ui-breadcrumbs__divider').exists()).toBe(false)
  })

  it('renders a non icon-like divider as text', async () => {
    const wrapper = await mountBreadcrumbs({ props: { items, divider: '/' } })
    expect(wrapper.find('.ui-breadcrumbs-divider__icon').exists()).toBe(false)
    expect(wrapper.find('.ui-breadcrumbs-divider').text()).toBe('/')
  })

  it('supports item and divider slots inside leaf-owned semantics', async () => {
    const wrapper = await mountBreadcrumbs({
      props: { items },
      slots: {
        item: ({ item, current }: { item: { title: string }, current: boolean }) =>
          h('span', { class: 'custom-item' }, `${item.title}${current ? '*' : ''}`),
        divider: () => h('span', { class: 'custom-divider' }, '›'),
      },
    })
    expect(wrapper.findAll('.custom-item')).toHaveLength(3)
    expect(wrapper.findAll('.custom-divider')).toHaveLength(2)
    // The slot replaces content only: the current crumb keeps its semantics.
    expect(wrapper.find('[aria-current="page"]').find('.custom-item').text()).toBe('Laptops*')
  })

  it('applies the overflow modifier', async () => {
    const wrapper = await mountBreadcrumbs({ props: { items } })
    expect(wrapper.find('.ui-breadcrumbs__list').classes()).toContain('ui-breadcrumbs__list--scroll')

    await wrapper.setProps({ overflow: 'wrap' })
    expect(wrapper.find('.ui-breadcrumbs__list').classes()).toContain('ui-breadcrumbs__list--wrap')
  })

  it('does not mutate the input items', async () => {
    const input = [{ title: 'Home', to: '/' }, { title: 'Catalog', to: '/catalog' }]
    const snapshot = structuredClone(input)
    await mountBreadcrumbs({ props: { items: input } })
    expect(input).toEqual(snapshot)
  })

  it('renders prepend and append inside the list boundary', async () => {
    const wrapper = await mountBreadcrumbs({
      props: { items },
      slots: {
        prepend: () => h('li', { class: 'lead' }, 'lead'),
        append: () => h('li', { class: 'tail' }, 'tail'),
      },
    })
    expect(wrapper.find('ol.ui-breadcrumbs__list > .lead').exists()).toBe(true)
    expect(wrapper.find('ol.ui-breadcrumbs__list > .tail').exists()).toBe(true)
  })
})
