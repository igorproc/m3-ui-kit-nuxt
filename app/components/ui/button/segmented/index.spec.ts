import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSegmented from './index.vue'

const items = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
]

describe('m-button-segmented', () => {
  it('renders one segment button per item', async () => {
    const wrapper = await mountSuspended(MSegmented, {
      props: { items },
    })

    expect(wrapper.find('.ui-segmented-button').exists()).toBe(true)
    expect(wrapper.findAll('.ui-segmented-button__segment')).toHaveLength(3)
  })

  it('defaults the selected scheme to the secondary color', async () => {
    const wrapper = await mountSuspended(MSegmented, { props: { items } })

    expect(wrapper.classes()).toContain('ui-segmented-button--secondary')
  })

  it('maps the color prop to the scheme class', async () => {
    const wrapper = await mountSuspended(MSegmented, {
      props: { items, color: 'tertiary' },
    })

    expect(wrapper.classes()).toContain('ui-segmented-button--tertiary')
  })

  it('marks the segment matching modelValue as selected', async () => {
    const wrapper = await mountSuspended(MSegmented, {
      props: { items, modelValue: 'week' },
    })

    const segments = wrapper.findAll('.ui-segmented-button__segment')
    expect(segments[1]!.classes()).toContain('ui-segmented-button__segment--selected')
    expect(segments[0]!.classes()).not.toContain('ui-segmented-button__segment--selected')
  })

  it('emits update:modelValue on selection (single mode)', async () => {
    const wrapper = await mountSuspended(MSegmented, {
      props: { items, modelValue: 'day' },
    })

    await wrapper.findAll('.ui-segmented-button__segment')[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['week'])
  })

  it('toggles values as an array in multiple mode', async () => {
    const wrapper = await mountSuspended(MSegmented, {
      props: { items, multiple: true, modelValue: ['day'] },
    })

    await wrapper.findAll('.ui-segmented-button__segment')[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['day', 'week']])
  })

  it('disables a per-item disabled segment', async () => {
    const wrapper = await mountSuspended(MSegmented, { props: { items } })

    const month = wrapper.findAll('.ui-segmented-button__segment')[2]!
    expect(month.attributes('disabled')).toBeDefined()
  })

  it('group-level disabled disables every segment', async () => {
    const wrapper = await mountSuspended(MSegmented, {
      props: { items, disabled: true },
    })

    for (const segment of wrapper.findAll('.ui-segmented-button__segment')) {
      expect(segment.attributes('disabled')).toBeDefined()
    }
  })
})
