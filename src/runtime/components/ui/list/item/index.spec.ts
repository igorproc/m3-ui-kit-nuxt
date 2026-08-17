import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MListItem from './index.vue'

describe('m-list-item', () => {
  it('renders a non-interactive <div> by default without a button role', async () => {
    const wrapper = await mountSuspended(MListItem)

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('ui-list-item')
    expect(wrapper.classes()).not.toContain('ui-list-item--interactive')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('renders headline / supporting / overline content props', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: {
        headline: 'Title',
        supportingText: 'Subtitle',
        overline: 'Over',
      },
    })

    expect(wrapper.find('.ui-list-item__headline').text()).toBe('Title')
    expect(wrapper.find('.ui-list-item__supporting').text()).toBe('Subtitle')
    expect(wrapper.find('.ui-list-item__overline').text()).toBe('Over')
  })

  it('renders the default slot', async () => {
    const wrapper = await mountSuspended(MListItem, {
      slots: { default: () => 'Body' },
    })

    expect(wrapper.text()).toContain('Body')
  })

  it('applies the selected modifier', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { selected: true },
    })

    expect(wrapper.classes()).toContain('ui-list-item--selected')
  })

  it('emulates a button (role + tabindex) when interactive', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { interactive: true },
    })

    expect(wrapper.classes()).toContain('ui-list-item--interactive')
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')
  })

  it('triggers click on Enter and Space when emulating a button', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { interactive: true },
      attrs: { onClick: () => {} },
    })

    let clicks = 0
    wrapper.element.addEventListener('click', () => {
      clicks += 1
    })

    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keydown', { key: ' ' })

    expect(clicks).toBe(2)
  })

  it('does not handle keyboard activation for a native button tag', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { tag: 'button' },
    })

    // Native <button> provides its own role/semantics — no emulated role/tabindex.
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('disables interaction: tabindex -1, aria-disabled and disabled class', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { interactive: true, disabled: true },
    })

    expect(wrapper.classes()).toContain('ui-list-item--disabled')
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('-1')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  it('does not activate on keyboard when disabled', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { interactive: true, disabled: true },
    })

    let clicks = 0
    wrapper.element.addEventListener('click', () => {
      clicks += 1
    })

    await wrapper.trigger('keydown', { key: 'Enter' })

    expect(clicks).toBe(0)
  })

  it('renders leading and trailing slots', async () => {
    const wrapper = await mountSuspended(MListItem, {
      slots: {
        leading: () => 'L',
        trailing: () => 'T',
      },
    })

    expect(wrapper.find('.ui-list-item__leading').text()).toBe('L')
    expect(wrapper.find('.ui-list-item__trailing').text()).toBe('T')
  })
})
