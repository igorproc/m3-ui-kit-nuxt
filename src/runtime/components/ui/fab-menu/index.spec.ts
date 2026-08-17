import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MFabMenu from './index.vue'

const items = [
  { label: 'Share', icon: 'ic:baseline-share', value: 'share' },
  { label: 'Edit', icon: 'ic:baseline-edit', value: 'edit' },
]

describe('m-fab-menu', () => {
  it('renders the root with default size, align and color classes', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    expect(wrapper.find('.ui-fab-menu').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-fab-menu--md')
    expect(wrapper.classes()).toContain('ui-fab-menu--right')
    expect(wrapper.classes()).toContain('ui-fab-menu--primary')
  })

  it('maps color, size and align props to classes', async () => {
    const wrapper = await mountSuspended(MFabMenu, {
      props: { items, color: 'secondary', size: 'lg', align: 'left' },
    })

    expect(wrapper.classes()).toContain('ui-fab-menu--secondary')
    expect(wrapper.classes()).toContain('ui-fab-menu--lg')
    expect(wrapper.classes()).toContain('ui-fab-menu--left')
  })

  it('renders the default FAB activator', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    expect(wrapper.find('.ui-fab-menu__activator').exists()).toBe(true)
    expect(wrapper.find('button.ui-fab').exists()).toBe(true)
  })

  it('keeps the drawer closed until the activator is toggled', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    expect(wrapper.find('.ui-fab-menu__drawer').exists()).toBe(false)
  })

  it('opens the drawer and renders items when the activator is clicked', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    await wrapper.find('.ui-fab-menu__activator').trigger('click')

    expect(wrapper.find('.ui-fab-menu__drawer').exists()).toBe(true)
    expect(wrapper.findAll('.ui-fab-menu__item')).toHaveLength(2)
  })

  it('emits select with the item when a drawer item is clicked', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    await wrapper.find('.ui-fab-menu__activator').trigger('click')
    await wrapper.findAll('.ui-fab-menu__item')[1]!.trigger('click')

    expect(wrapper.emitted('select')?.at(-1)).toEqual([items[1]])
  })

  it('does not open when disabled', async () => {
    const wrapper = await mountSuspended(MFabMenu, {
      props: { items, disabled: true },
    })

    await wrapper.find('.ui-fab-menu__activator').trigger('click')

    expect(wrapper.find('.ui-fab-menu__drawer').exists()).toBe(false)
  })
})
