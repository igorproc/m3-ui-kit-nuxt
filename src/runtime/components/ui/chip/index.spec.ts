import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MChip from './index.vue'

describe('m-chip', () => {
  it('renders a button with the default label slot and assist type', async () => {
    const wrapper = await mountSuspended(MChip, {
      slots: { default: () => 'Label' },
    })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.classes()).toContain('ui-chip')
    expect(wrapper.classes()).toContain('ui-chip--assist')
    expect(wrapper.find('.ui-chip__label').text()).toBe('Label')
  })

  it('maps the type prop to a modifier class', async () => {
    for (const type of ['assist', 'filter', 'input', 'suggestion'] as const) {
      const wrapper = await mountSuspended(MChip, { props: { type } })
      expect(wrapper.classes()).toContain(`ui-chip--${type}`)
    }
  })

  it('renders icon and trailing slots only when provided', async () => {
    const bare = await mountSuspended(MChip, { slots: { default: () => 'X' } })
    expect(bare.find('.ui-chip__icon').exists()).toBe(false)
    expect(bare.find('.ui-chip__trailing').exists()).toBe(false)

    const withSlots = await mountSuspended(MChip, {
      slots: {
        default: () => 'X',
        icon: () => 'I',
        trailing: () => 'T',
      },
    })
    expect(withSlots.find('.ui-chip__icon').text()).toBe('I')
    expect(withSlots.find('.ui-chip__trailing').text()).toBe('T')
  })

  it('toggles the v-model on click for filter chips', async () => {
    const wrapper = await mountSuspended(MChip, {
      props: { type: 'filter', modelValue: false },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('reflects the model value via the selected class', async () => {
    const wrapper = await mountSuspended(MChip, {
      props: { type: 'filter', modelValue: true },
    })

    expect(wrapper.classes()).toContain('ui-chip--selected')
  })

  it('does not toggle the model for non-filter types', async () => {
    const wrapper = await mountSuspended(MChip, {
      props: { type: 'assist', modelValue: false },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('sets the disabled attribute and class, and suppresses model toggle when disabled', async () => {
    const wrapper = await mountSuspended(MChip, {
      props: { type: 'filter', disabled: true, modelValue: false },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ui-chip--disabled')

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
