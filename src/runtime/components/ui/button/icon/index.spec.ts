import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MIconButton from './index.vue'

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

  // B-3: a standard icon button takes its container's content colour.
  it('has no colour role unless one is given', async () => {
    const plain = await mountSuspended(MIconButton)
    expect(plain.classes()).toContain('ui-button--current')

    const tinted = await mountSuspended(MIconButton, { props: { color: 'primary' } })
    expect(tinted.classes()).toContain('ui-button--primary')
    expect(tinted.classes()).not.toContain('ui-button--current')
  })

  it.each(['narrow', 'default', 'wide'] as const)('maps the %s width to a class', async (width) => {
    const wrapper = await mountSuspended(MIconButton, { props: { width } })

    expect(wrapper.classes()).toContain(`ui-icon-button--${width}`)
  })

  it('passes density and shape through to the base button', async () => {
    const wrapper = await mountSuspended(MIconButton, { props: { density: 'compact', shape: 'square' } })

    expect(wrapper.classes()).toContain('ui-button--compact')
    expect(wrapper.classes()).toContain('ui-button--square')
  })

  it('toggles through v-model:selected and hands the state to the slot', async () => {
    const wrapper = await mountSuspended(MIconButton, {
      props: { selected: true, ariaLabel: 'Favourite' },
      slots: { default: ({ selected }: { selected?: boolean }) => (selected ? 'filled' : 'outline') },
    })

    expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toBe('filled')

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:selected')).toEqual([[false]])
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
