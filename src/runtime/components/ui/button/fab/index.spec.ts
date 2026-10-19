import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MFab from './index.vue'

describe('m-button-fab', () => {
  it('renders a <button> with the base class and default slot icon', async () => {
    const wrapper = await mountSuspended(MFab, {
      slots: { default: () => 'icon' },
    })

    expect(wrapper.find('button.ui-fab').exists()).toBe(true)
    expect(wrapper.find('.ui-fab__icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('icon')
  })

  it('defaults to the tonal set, primary color and default density', async () => {
    const wrapper = await mountSuspended(MFab)

    expect(wrapper.classes()).toContain('ui-fab--tonal')
    expect(wrapper.classes()).toContain('ui-fab--primary')
    expect(wrapper.classes()).toContain('ui-fab--default')
  })

  it('maps color, variant and density props to classes', async () => {
    const wrapper = await mountSuspended(MFab, {
      props: { color: 'secondary', variant: 'filled', density: 'comfortable' },
    })

    expect(wrapper.classes()).toContain('ui-fab--secondary')
    expect(wrapper.classes()).toContain('ui-fab--filled')
    expect(wrapper.classes()).toContain('ui-fab--comfortable')
  })

  it('exposes ariaLabel as the accessible name', async () => {
    const wrapper = await mountSuspended(MFab, {
      props: { ariaLabel: 'Add item' },
    })

    expect(wrapper.find('button').attributes('aria-label')).toBe('Add item')
  })

  it('reflects disabled state in attribute and class', async () => {
    const wrapper = await mountSuspended(MFab, { props: { disabled: true } })

    expect(wrapper.classes()).toContain('ui-fab--disabled')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('renders a spinner (not the icon) with aria-busy when loading', async () => {
    const wrapper = await mountSuspended(MFab, {
      props: { loading: true },
      slots: { default: () => 'icon' },
    })

    expect(wrapper.find('.ui-fab__spinner .ui-loading--inline').exists()).toBe(true)
    expect(wrapper.find('.ui-fab__icon').exists()).toBe(false)
    expect(wrapper.classes()).toContain('ui-fab--loading')
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
  })

  it('fires the click handler when interacted with', async () => {
    let clicks = 0
    const wrapper = await mountSuspended(MFab, {
      attrs: { onClick: () => { clicks += 1 } },
    })

    await wrapper.find('button').trigger('click')

    expect(clicks).toBe(1)
  })
})
