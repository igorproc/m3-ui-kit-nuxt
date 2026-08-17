import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MButton from './index.vue'

describe('m-button', () => {
  it('renders a <button> with the base class and default slot', async () => {
    const wrapper = await mountSuspended(MButton, {
      slots: { default: () => 'Click me' },
    })

    expect(wrapper.find('button.ui-button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Click me')
  })

  it('defaults to the filled variant and primary color', async () => {
    const wrapper = await mountSuspended(MButton)

    expect(wrapper.classes()).toContain('ui-button--filled')
    expect(wrapper.classes()).toContain('ui-button--primary')
  })

  it('maps variant and color props to classes', async () => {
    const wrapper = await mountSuspended(MButton, {
      props: { variant: 'outlined', color: 'error' },
    })

    expect(wrapper.classes()).toContain('ui-button--outlined')
    expect(wrapper.classes()).toContain('ui-button--error')
  })

  it.each(['elevated', 'filled', 'tonal', 'outlined', 'text'] as const)(
    'supports the %s variant',
    async (variant) => {
      const wrapper = await mountSuspended(MButton, { props: { variant } })

      expect(wrapper.classes()).toContain(`ui-button--${variant}`)
    },
  )

  it.each(['primary', 'secondary', 'tertiary', 'error'] as const)(
    'supports the %s color',
    async (color) => {
      const wrapper = await mountSuspended(MButton, { props: { color } })

      expect(wrapper.classes()).toContain(`ui-button--${color}`)
    },
  )

  it('forwards the native type attribute', async () => {
    const wrapper = await mountSuspended(MButton, { props: { type: 'submit' } })

    expect(wrapper.find('button').attributes('type')).toBe('submit')
  })

  it('fires the click handler when interacted with', async () => {
    let clicks = 0
    const wrapper = await mountSuspended(MButton, {
      attrs: { onClick: () => { clicks += 1 } },
    })

    await wrapper.find('button').trigger('click')

    expect(clicks).toBe(1)
  })

  it('reflects disabled state in attribute and class', async () => {
    const wrapper = await mountSuspended(MButton, { props: { disabled: true } })

    expect(wrapper.classes()).toContain('ui-button--disabled')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('renders a loading spinner with aria-busy and hides slot icons', async () => {
    const wrapper = await mountSuspended(MButton, {
      props: { loading: true },
      slots: { prepend: () => 'icon' },
    })

    expect(wrapper.find('.ui-button__spinner').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-button--loading')
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
    // Loading suppresses the prepend icon and the has-prepend padding class.
    expect(wrapper.find('.ui-button__icon--prepend').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('ui-button--has-prepend')
  })

  it('loading also disables the button (pointer-events / disabled attr)', async () => {
    const wrapper = await mountSuspended(MButton, { props: { loading: true } })

    expect(wrapper.classes()).toContain('ui-button--disabled')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('renders prepend and append slots with icon wrappers', async () => {
    const wrapper = await mountSuspended(MButton, {
      slots: {
        default: () => 'Label',
        prepend: () => 'P',
        append: () => 'A',
      },
    })

    expect(wrapper.find('.ui-button__icon--prepend').exists()).toBe(true)
    expect(wrapper.find('.ui-button__icon--append').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-button--has-prepend')
    expect(wrapper.classes()).toContain('ui-button--has-append')
  })

  it('marks icon-only when only an icon slot is provided (no default)', async () => {
    const wrapper = await mountSuspended(MButton, {
      slots: { prepend: () => 'P' },
    })

    expect(wrapper.classes()).toContain('ui-button--icon-only')
  })
})
