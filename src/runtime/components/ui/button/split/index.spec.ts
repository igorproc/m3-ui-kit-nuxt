import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSplitButton from './index.vue'

const items = [
  { label: 'Save as draft', value: 'draft' },
  { label: 'Save and publish', value: 'publish' },
]

describe('m-split-button', () => {
  it('renders the action + dropdown pieces', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { items },
      slots: { default: () => 'Save' },
    })

    expect(wrapper.find('.ui-split-button').exists()).toBe(true)
    expect(wrapper.find('.ui-split-button__action').exists()).toBe(true)
    expect(wrapper.find('.ui-split-button__dropdown').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save')
  })

  it('forwards color and variant to both inner buttons', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { items, color: 'tertiary', variant: 'tonal' },
    })

    const action = wrapper.find('.ui-split-button__action')
    expect(action.classes()).toContain('ui-button--tonal')
    expect(action.classes()).toContain('ui-button--tertiary')
  })

  it('emits click when the main action is pressed', async () => {
    const wrapper = await mountSuspended(MSplitButton, { props: { items } })

    await wrapper.find('.ui-split-button__action').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('emits dropdown when the dropdown trigger is pressed', async () => {
    const wrapper = await mountSuspended(MSplitButton, { props: { items } })

    await wrapper.find('.ui-split-button__dropdown').trigger('click')

    expect(wrapper.emitted('dropdown')).toHaveLength(1)
  })

  it('does not toggle the menu when disabled', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { items, disabled: true },
    })

    await wrapper.find('.ui-split-button__dropdown').trigger('click')

    expect(wrapper.emitted('dropdown')).toBeUndefined()
  })

  it('reflects disabled on the inner action button', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { items, disabled: true },
    })

    expect(wrapper.find('.ui-split-button__action').classes())
      .toContain('ui-button--disabled')
  })

  it('names the dropdown and announces the menu it opens', async () => {
    const wrapper = await mountSuspended(MSplitButton, {
      props: { items, dropdownAriaLabel: 'More save options' },
    })
    const dropdown = wrapper.find('.ui-split-button__dropdown')

    expect(dropdown.attributes('aria-label')).toBe('More save options')
    expect(dropdown.attributes('aria-haspopup')).toBe('menu')
    expect(dropdown.attributes('aria-expanded')).toBe('false')

    await dropdown.trigger('click')

    expect(dropdown.attributes('aria-expanded')).toBe('true')
  })

  it('claims no popup when there is no menu', async () => {
    const wrapper = await mountSuspended(MSplitButton, { props: { items: [] } })
    const dropdown = wrapper.find('.ui-split-button__dropdown')

    expect(dropdown.attributes('aria-haspopup')).toBeUndefined()
    expect(dropdown.attributes('aria-expanded')).toBeUndefined()
  })

  it('keeps both halves from submitting a surrounding form', async () => {
    const wrapper = await mountSuspended(MSplitButton, { props: { items } })

    for (const half of wrapper.findAll('.ui-split-button__wrapper > button')) {
      expect(half.attributes('type')).toBe('button')
    }
  })
})
