import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MIconButton from '../app/components/ui/button/icon/index.vue'

describe('m-icon-button', () => {
  it('renders the icon-button wrapper over a base button', async () => {
    const wrapper = await mountSuspended(MIconButton, {
      slots: { default: () => 'X' },
    })

    expect(wrapper.find('button.ui-button.ui-icon-button').exists()).toBe(true)
    expect(wrapper.find('.ui-icon-button__content').exists()).toBe(true)
    expect(wrapper.text()).toContain('X')
  })

  it('defaults to the text variant (icon buttons are low-emphasis)', async () => {
    const wrapper = await mountSuspended(MIconButton)

    expect(wrapper.classes()).toContain('ui-button--text')
  })

  it('maps variant and color props through to the base button', async () => {
    const wrapper = await mountSuspended(MIconButton, {
      props: { variant: 'filled', color: 'tertiary' },
    })

    expect(wrapper.classes()).toContain('ui-button--filled')
    expect(wrapper.classes()).toContain('ui-button--tertiary')
  })

  it('exposes ariaLabel as the accessible name', async () => {
    const wrapper = await mountSuspended(MIconButton, {
      props: { ariaLabel: 'Close dialog' },
    })

    expect(wrapper.find('button').attributes('aria-label')).toBe('Close dialog')
  })

  it('reflects disabled state', async () => {
    const wrapper = await mountSuspended(MIconButton, {
      props: { disabled: true },
    })

    expect(wrapper.classes()).toContain('ui-button--disabled')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('renders a spinner with aria-busy when loading', async () => {
    const wrapper = await mountSuspended(MIconButton, {
      props: { loading: true },
    })

    expect(wrapper.find('.ui-button__spinner').exists()).toBe(true)
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
  })

  it('fires the click handler when interacted with', async () => {
    let clicks = 0
    const wrapper = await mountSuspended(MIconButton, {
      attrs: { onClick: () => { clicks += 1 } },
    })

    await wrapper.find('button').trigger('click')

    expect(clicks).toBe(1)
  })
})
