import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSplitButton from './index.vue'

const menu = () => h('button', { class: 'ui-menu__item', type: 'button' }, 'Save as draft')

describe('m-split-button', () => {
  it('renders the action and trailing buttons', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      slots: { default: () => 'Save' },
    })

    expect(wrapper.find('.ui-split-button').exists()).toBe(true)
    expect(wrapper.find('.ui-split-button__action').exists()).toBe(true)
    expect(wrapper.find('.ui-split-button__trailing').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save')
  })

  it('forwards color, variant and density to both buttons', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { color: 'tertiary', variant: 'tonal', density: 'compact' },
    })

    for (const half of ['action', 'trailing']) {
      const button = wrapper.find(`.ui-split-button__${half}`)
      expect(button.classes()).toContain('ui-button--tonal')
      expect(button.classes()).toContain('ui-button--tertiary')
      expect(button.classes()).toContain('ui-button--compact')
    }
  })

  it('passes a leading icon to the action button', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      slots: { default: () => 'Save', prepend: () => 'I' },
    })

    expect(wrapper.find('.ui-split-button__action .ui-button__icon--prepend').text()).toBe('I')
  })

  it('emits click when the main action is pressed', async () => {
    const wrapper = await mountSuspended(MSplitButton)

    await wrapper.find('.ui-split-button__action').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('emits trailing when the trailing button is pressed', async () => {
    const wrapper = await mountSuspended(MSplitButton)

    await wrapper.find('.ui-split-button__trailing').trigger('click')

    expect(wrapper.emitted('trailing')).toHaveLength(1)
  })

  it('does nothing on the trailing button while disabled', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { disabled: true },
      slots: { menu },
    })

    await wrapper.find('.ui-split-button__trailing').trigger('click')

    expect(wrapper.emitted('trailing')).toBeUndefined()
    expect(wrapper.find('.ui-split-button__trailing').attributes('aria-expanded')).toBe('false')
  })

  it('reflects disabled on the action button', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { disabled: true },
    })

    expect(wrapper.find('.ui-split-button__action').classes())
      .toContain('ui-button--disabled')
  })

  // B-2: loading shows on the action and holds both buttons. The trailing one
  // stays focusable (В-6): a native `disabled` would drop its focus.
  it('loads on the action button and holds the trailing one', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { loading: true },
      slots: { default: () => 'Save', menu },
    })

    const action = wrapper.find('.ui-split-button__action')
    const trailing = wrapper.find('.ui-split-button__trailing')
    expect(action.attributes('aria-busy')).toBe('true')
    expect(action.find('.ui-loading--inline').exists()).toBe(true)
    expect(trailing.attributes('disabled')).toBeUndefined()
    expect(trailing.attributes('aria-disabled')).toBe('true')
    expect(trailing.classes()).toContain('ui-button--disabled')

    await action.trigger('click')
    await trailing.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.emitted('trailing')).toBeUndefined()
    expect(trailing.attributes('aria-expanded')).toBe('false')
  })

  it('puts class and style on the root and every other attribute on the main button', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { trailingAriaLabel: 'More' },
      attrs: { 'class': 'extra', 'style': 'margin: 1px', 'aria-describedby': 'hint', 'data-x': '1' },
    })
    const root = wrapper.find('.ui-split-button')
    const action = wrapper.find('.ui-split-button__action')

    expect(root.classes()).toContain('extra')
    expect(root.attributes('style')).toContain('margin')
    expect(root.attributes('aria-describedby')).toBeUndefined()
    expect(action.attributes('aria-describedby')).toBe('hint')
    expect(action.attributes('data-x')).toBe('1')
  })

  it('makes the main button a submit button or a link', async () => {
    const submit = await mountSuspended(MSplitButton, { props: { type: 'submit' } })
    expect(submit.find('.ui-split-button__action').attributes('type')).toBe('submit')
    expect(submit.find('.ui-split-button__trailing').attributes('type')).toBe('button')

    const link = await mountSuspended(MSplitButton, { props: { tag: 'link', to: '/orders' } })
    expect(link.find('a.ui-split-button__action').attributes('href')).toBe('/orders')
  })

  it('names the trailing button and announces the menu it opens', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { trailingAriaLabel: 'More save options' },
      slots: { menu },
    })
    const trailing = wrapper.find('.ui-split-button__trailing')

    expect(trailing.attributes('aria-label')).toBe('More save options')
    expect(trailing.attributes('aria-haspopup')).toBe('menu')
    expect(trailing.attributes('aria-expanded')).toBe('false')

    await trailing.trigger('click')

    expect(trailing.attributes('aria-expanded')).toBe('true')
  })

  it('is a plain button, claiming no popup, without a menu slot', async () => {
    const wrapper = await mountSuspended(MSplitButton)
    const trailing = wrapper.find('.ui-split-button__trailing')

    expect(trailing.attributes('aria-haspopup')).toBeUndefined()
    expect(trailing.attributes('aria-expanded')).toBeUndefined()
  })

  it('lets the consumer replace the trailing icon', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      slots: { trailing: () => 'T' },
    })

    expect(wrapper.find('.ui-split-button__trailing').text()).toBe('T')
  })

  it('keeps both buttons from submitting a surrounding form', async () => {
    const wrapper = await mountSuspended(MSplitButton)

    for (const half of wrapper.findAll('.ui-split-button__wrapper > button')) {
      expect(half.attributes('type')).toBe('button')
    }
  })
})
