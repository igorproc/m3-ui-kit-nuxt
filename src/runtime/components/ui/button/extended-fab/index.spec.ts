import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MExtendedFab from './index.vue'

describe('m-button-extended-fab', () => {
  it('renders a <button> with the base class and label slot', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      slots: { default: () => 'Compose' },
    })

    expect(wrapper.find('button.ui-extended-fab').exists()).toBe(true)
    expect(wrapper.find('.ui-extended-fab__label').exists()).toBe(true)
    expect(wrapper.text()).toContain('Compose')
  })

  it('defaults to the tonal set, primary color and default density', async () => {
    const wrapper = await mountSuspended(MExtendedFab)

    expect(wrapper.classes()).toContain('ui-extended-fab--tonal')
    expect(wrapper.classes()).toContain('ui-extended-fab--primary')
    expect(wrapper.classes()).toContain('ui-extended-fab--default')
  })

  it('maps color, variant and density props to classes', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      props: { color: 'error', variant: 'filled', density: 'compact' },
    })

    expect(wrapper.classes()).toContain('ui-extended-fab--error')
    expect(wrapper.classes()).toContain('ui-extended-fab--filled')
    expect(wrapper.classes()).toContain('ui-extended-fab--compact')
  })

  // EXT.B-1: the label closes on one line, and the window ends with its fade.
  it('keeps the label on one line only while it folds', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      slots: { default: () => 'Compose', prepend: () => 'I' },
    })
    const label = () => wrapper.find('.ui-extended-fab__label')

    expect(label().classes()).not.toContain('ui-extended-fab__label--folding')
    await wrapper.setProps({ expanded: false })
    expect(label().classes()).toContain('ui-extended-fab__label--folding')

    label().element.dispatchEvent(Object.assign(new Event('transitionend'), { propertyName: 'opacity' }))
    await wrapper.vm.$nextTick()
    expect(label().classes()).not.toContain('ui-extended-fab__label--folding')
  })

  it('folds when not expanded but keeps the label as the accessible name', async () => {
    const wrapper = await mountSuspended(MExtendedFab, {
      props: { expanded: false },
      slots: { default: () => 'Compose', prepend: () => 'I' },
    })

    expect(wrapper.classes()).toContain('ui-extended-fab--collapsed')
    expect(wrapper.find('.ui-extended-fab__label').text()).toBe('Compose')
  })

  it('is expanded by default', async () => {
    const wrapper = await mountSuspended(MExtendedFab, { slots: { default: () => 'Compose' } })

    expect(wrapper.classes()).not.toContain('ui-extended-fab--collapsed')
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

    expect(wrapper.find('.ui-extended-fab__spinner .ui-loading--inline').exists()).toBe(true)
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
