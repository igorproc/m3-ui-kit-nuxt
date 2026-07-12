import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MExtendedFab from '../app/components/ui/button/extended-fab/index.vue'

describe('m-button-extended-fab', () => {
  it('renders a <button> with the base class and label slot', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      slots: { default: () => 'Compose' },
    })

    expect(wrapper.find('button.ui-extended-fab').exists()).toBe(true)
    expect(wrapper.find('.ui-extended-fab__label').exists()).toBe(true)
    expect(wrapper.text()).toContain('Compose')
  })

  it('defaults to the filled variant, primary color and md size', async () => {
    const wrapper = await mountSuspended(MExtendedFab)

    expect(wrapper.classes()).toContain('ui-extended-fab--filled')
    expect(wrapper.classes()).toContain('ui-extended-fab--primary')
    expect(wrapper.classes()).toContain('ui-extended-fab--md')
  })

  it('maps color, variant and size props to classes', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      props: { color: 'error', variant: 'tonal', size: 'sm' },
    })

    expect(wrapper.classes()).toContain('ui-extended-fab--error')
    expect(wrapper.classes()).toContain('ui-extended-fab--tonal')
    expect(wrapper.classes()).toContain('ui-extended-fab--sm')
  })

  it('renders the prepend icon slot when provided', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      slots: { default: () => 'Label', prepend: () => 'I' },
    })

    expect(wrapper.find('.ui-extended-fab__icon').exists()).toBe(true)
  })

  it('reflects disabled state in attribute and class', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      props: { disabled: true },
    })

    expect(wrapper.classes()).toContain('ui-extended-fab--disabled')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('renders a spinner (not the icon) with aria-busy when loading', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      props: { loading: true },
      slots: { prepend: () => 'I' },
    })

    expect(wrapper.find('.ui-extended-fab__spinner').exists()).toBe(true)
    expect(wrapper.find('.ui-extended-fab__icon').exists()).toBe(false)
    expect(wrapper.classes()).toContain('ui-extended-fab--loading')
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
  })

  it('fires the click handler when interacted with', async () => {
    let clicks = 0
    const wrapper = await mountSuspended(MExtendedFab, {
      attrs: { onClick: () => { clicks += 1 } },
    })

    await wrapper.find('button').trigger('click')

    expect(clicks).toBe(1)
  })
})
