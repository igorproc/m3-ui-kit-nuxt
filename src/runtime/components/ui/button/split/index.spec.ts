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
})
