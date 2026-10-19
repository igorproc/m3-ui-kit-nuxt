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

    expect(wrapper.find('.ui-button__spinner .ui-loading--inline').exists()).toBe(true)
    expect(wrapper.find('.ui-button__spinner').attributes('aria-hidden')).toBe('true')
    expect(wrapper.classes()).toContain('ui-button--loading')
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
    // The spinner takes the prepend icon's place and keeps its padding, so the
    // button does not change width when it starts loading.
    expect(wrapper.find('.ui-button__icon--prepend').exists()).toBe(false)
    expect(wrapper.find('.ui-button__spinner--centered').exists()).toBe(false)
    expect(wrapper.classes()).toContain('ui-button--has-prepend')
  })

  it('centres the spinner over the label when there is no icon to replace', async () => {
    const wrapper = await mountSuspended(MButton, {
      props: { loading: true },
      slots: { default: () => 'Save' },
    })

    expect(wrapper.find('.ui-button__spinner--centered').exists()).toBe(true)
    // The label stays in the DOM: it holds the width and the accessible name.
    expect(wrapper.find('.ui-button__label').text()).toBe('Save')
  })

  it('renders no empty label box for an icon-only button', async () => {
    const wrapper = await mountSuspended(MButton, {
      slots: { prepend: () => 'P' },
    })

    expect(wrapper.find('.ui-button__label').exists()).toBe(false)
  })

  // IN-08: a native `disabled` would throw focus to <body> when the work starts.
  it('loading makes the button inert but keeps it focusable', async () => {
    const wrapper = await mountSuspended(MButton, { props: { loading: true } })

    expect(wrapper.classes()).toContain('ui-button--disabled')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('button').attributes('aria-disabled')).toBe('true')
  })

  it('a click on a loading button reaches no handler', async () => {
    let clicks = 0
    const wrapper = await mountSuspended(MButton, {
      props: { loading: true },
      attrs: { onClick: () => { clicks += 1 } },
    })

    await wrapper.find('button').trigger('click')

    expect(clicks).toBe(0)
  })

  it.each(['compact', 'default', 'comfortable'] as const)(
    'maps the %s density to a class',
    async (density) => {
      const wrapper = await mountSuspended(MButton, { props: { density } })

      expect(wrapper.classes()).toContain(`ui-button--${density}`)
    },
  )

  it('defaults to the default density and the round shape', async () => {
    const wrapper = await mountSuspended(MButton)

    expect(wrapper.classes()).toContain('ui-button--default')
    expect(wrapper.classes()).toContain('ui-button--round')
  })

  it('maps the square shape to a class', async () => {
    const wrapper = await mountSuspended(MButton, { props: { shape: 'square' } })

    expect(wrapper.classes()).toContain('ui-button--square')
  })

  it('is a plain action without aria-pressed unless selected is bound', async () => {
    const wrapper = await mountSuspended(MButton)

    expect(wrapper.find('button').attributes('aria-pressed')).toBeUndefined()
  })

  it('toggles through v-model:selected', async () => {
    const wrapper = await mountSuspended(MButton, { props: { selected: false } })

    expect(wrapper.find('button').attributes('aria-pressed')).toBe('false')
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('update:selected')).toEqual([[true]])
  })

  it('moves the shape and colours of a toggle on springs; a plain button keeps the stylesheet', async () => {
    const toggle = await mountSuspended(MButton, { props: { selected: false } })
    const transition = (toggle.element as HTMLElement).style.transition

    expect(transition).toContain('border-radius')
    expect(transition).toContain('linear(')

    const plain = await mountSuspended(MButton)
    expect((plain.element as HTMLElement).style.transition).toBe('')
  })

  // Q-7: a selected text toggle differs in colour alone unless its glyph changes.
  it('hands the toggle state to its slots, so a glyph can follow it', async () => {
    const wrapper = await mountSuspended(MButton, {
      props: { selected: true, variant: 'text' },
      slots: {
        prepend: ({ selected }: { selected: boolean }) => (selected ? 'filled-star' : 'star'),
        default: ({ selected }: { selected: boolean }) => (selected ? 'Starred' : 'Star'),
      },
    })

    expect(wrapper.find('.ui-button__icon--prepend').text()).toBe('filled-star')
    expect(wrapper.find('.ui-button__label').text()).toBe('Starred')

    await wrapper.setProps({ selected: false })
    expect(wrapper.find('.ui-button__label').text()).toBe('Star')
  })

  it('is a Nuxt link with its destination while enabled', async () => {
    const wrapper = await mountSuspended(MButton, { props: { tag: 'link', to: '/orders' }, slots: { default: () => 'Orders' } })

    expect(wrapper.find('a').attributes('href')).toBe('/orders')
    expect(wrapper.find('a').attributes('aria-disabled')).toBeUndefined()
  })

  // Q-12 (kit-wide): a disabled link keeps no destination, not even an `href`
  // the consumer passed, so a middle click or "open in new tab" goes nowhere.
  it('drops every destination of a disabled link', async () => {
    const wrapper = await mountSuspended(MButton, {
      props: { tag: 'link', to: '/orders', disabled: true },
      attrs: { href: '/elsewhere' },
      slots: { default: () => 'Orders' },
    })
    const link = wrapper.find('a')

    expect(link.attributes('href')).toBeUndefined()
    expect(link.attributes()).toMatchObject({ 'role': 'link', 'aria-disabled': 'true' })
    expect(link.attributes('tabindex')).toBeUndefined()
    expect(link.classes()).toContain('ui-button--disabled')
  })

  it('does not toggle while disabled', async () => {
    const wrapper = await mountSuspended(MButton, { props: { selected: false, disabled: true } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('update:selected')).toBeUndefined()
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
