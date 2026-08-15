import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MNavigationBar from './index.vue'

const items = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'search', icon: 'search', label: 'Search' },
  { id: 'profile', icon: 'person', label: 'Profile', badge: 3 },
]

describe('m-navigation-bar', () => {
  it('renders a <nav> landmark with an accessible name', async () => {
    const wrapper = await mountSuspended(MNavigationBar, {
      props: { items, ariaLabel: 'Primary navigation' },
    })

    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Primary navigation')
  })

  it('defaults the nav aria-label to Primary', async () => {
    const wrapper = await mountSuspended(MNavigationBar, { props: { items } })

    expect(wrapper.attributes('aria-label')).toBe('Primary')
  })

  it('renders one button per item with its label', async () => {
    const wrapper = await mountSuspended(MNavigationBar, { props: { items } })

    const buttons = wrapper.findAll('.ui-navigation-bar__item')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]!.text()).toContain('Home')
  })

  it('marks the selected destination with aria-current="page"', async () => {
    const wrapper = await mountSuspended(MNavigationBar, {
      props: { items, modelValue: 'search' },
    })

    const active = wrapper.find('.ui-navigation-bar__item--active')
    expect(active.exists()).toBe(true)
    expect(active.text()).toContain('Search')
    expect(active.attributes('aria-current')).toBe('page')
  })

  it('updates the v-model when a destination is clicked', async () => {
    const wrapper = await mountSuspended(MNavigationBar, {
      props: { items, modelValue: 'home' },
    })

    await wrapper.findAll('.ui-navigation-bar__item')[1]!.trigger('click')

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events!.at(-1)).toEqual(['search'])
  })

  it('renders a badge for items with a positive badge count', async () => {
    const wrapper = await mountSuspended(MNavigationBar, { props: { items } })

    expect(wrapper.find('.ui-navigation-bar__badge').exists()).toBe(true)
  })
})
