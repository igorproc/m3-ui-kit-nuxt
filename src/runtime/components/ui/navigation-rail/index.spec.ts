import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MNavigationRail from './index.vue'

const items = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'search', icon: 'search', label: 'Search' },
  { id: 'profile', icon: 'person', label: 'Profile', badge: 2 },
]

describe('m-navigation-rail', () => {
  it('renders a <nav> landmark with an accessible name', async () => {
    const wrapper = await mountSuspended(MNavigationRail, {
      props: { items, ariaLabel: 'Rail' },
    })

    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Rail')
  })

  it('renders one rail item per entry', async () => {
    const wrapper = await mountSuspended(MNavigationRail, { props: { items } })

    expect(wrapper.findAll('.ui-navigation-rail-item')).toHaveLength(3)
  })

  it('applies the expanded modifier when expanded', async () => {
    const wrapper = await mountSuspended(MNavigationRail, {
      props: { items, expanded: true },
    })

    expect(wrapper.classes()).toContain('ui-navigation-rail--expanded')
  })

  it('marks the selected destination active with aria-current="page"', async () => {
    const wrapper = await mountSuspended(MNavigationRail, {
      props: { items, modelValue: 'profile' },
    })

    const active = wrapper.find('.ui-navigation-rail-item--active')
    expect(active.exists()).toBe(true)
    expect(active.text()).toContain('Profile')
    expect(active.attributes('aria-current')).toBe('page')
  })

  it('updates the v-model when a destination is clicked', async () => {
    const wrapper = await mountSuspended(MNavigationRail, {
      props: { items, modelValue: 'home' },
    })

    await wrapper.findAll('.ui-navigation-rail-item')[1]!.trigger('click')

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events!.at(-1)).toEqual(['search'])
  })
})
