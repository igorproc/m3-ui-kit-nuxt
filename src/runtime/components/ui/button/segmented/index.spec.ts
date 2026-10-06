import { afterEach, describe, expect, it } from 'vitest'
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

  it('renders nothing for an empty list', async () => {
    const wrapper = await mountSuspended(MSegmented, { props: { items: [] } })

    expect(wrapper.find('.ui-segmented-button').exists()).toBe(false)
  })

  it('never submits a surrounding form', async () => {
    const wrapper = await mountSuspended(MSegmented, { props: { items } })

    for (const segment of wrapper.findAll('button')) {
      expect(segment.attributes('type')).toBe('button')
    }
  })

  it('names an icon-only segment through its ariaLabel', async () => {
    const wrapper = await mountSuspended(MSegmented, {
      props: { items: [{ icon: 'ic:outline-home', ariaLabel: 'Home', value: 'home' }] },
    })

    expect(wrapper.find('button').attributes('aria-label')).toBe('Home')
  })
})

describe('m-button-segmented · single choice is a radio group', () => {
  let current: { unmount: () => void } | null = null

  afterEach(() => {
    current?.unmount()
    current = null
  })

  // Attached: arrow keys move real focus, which jsdom tracks only in the document.
  async function mountGroup(props: Record<string, unknown>) {
    const wrapper = await mountSuspended(MSegmented, { props: { items, ...props }, attachTo: document.body })
    current = wrapper
    return wrapper
  }

  it('exposes radiogroup and radio roles with the checked state', async () => {
    const wrapper = await mountGroup({ modelValue: 'week' })
    const segments = wrapper.findAll('button')

    expect(wrapper.attributes('role')).toBe('radiogroup')
    expect(segments.map(segment => segment.attributes('role'))).toEqual(['radio', 'radio', 'radio'])
    expect(segments.map(segment => segment.attributes('aria-checked'))).toEqual(['false', 'true', 'false'])
  })

  it('is a single Tab stop on the checked segment', async () => {
    const wrapper = await mountGroup({ modelValue: 'week' })

    expect(wrapper.findAll('button').map(segment => segment.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
  })

  it('puts the Tab stop on the first enabled segment while nothing is checked', async () => {
    const wrapper = await mountGroup({ modelValue: undefined })

    expect(wrapper.findAll('button')[0]!.attributes('tabindex')).toBe('0')
  })

  it('moves selection and focus with the arrow keys, skipping disabled segments', async () => {
    const wrapper = await mountGroup({ modelValue: 'week' })
    const segments = wrapper.findAll('button')

    await segments[1]!.trigger('keydown', { key: 'ArrowRight' })

    // `month` is disabled, so the selection wraps to `day`.
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['day'])
    expect(document.activeElement).toBe(segments[0]!.element)

    await segments[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['week'])
  })

  it('jumps to the ends with Home and End', async () => {
    const wrapper = await mountGroup({ modelValue: 'week', items: [...items.slice(0, 2), { label: 'Year', value: 'year' }] })
    const segments = wrapper.findAll('button')

    await segments[1]!.trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['year'])

    await segments[2]!.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['day'])
  })
})

describe('m-button-segmented · multiple choice is a set of toggle buttons', () => {
  it('exposes a group of buttons with aria-pressed and no roving tabindex', async () => {
    const wrapper = await mountSuspended(MSegmented, {
      props: { items, multiple: true, modelValue: ['day'] },
    })
    const segments = wrapper.findAll('button')

    expect(wrapper.attributes('role')).toBe('group')
    expect(segments.map(segment => segment.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
    expect(segments.every(segment => segment.attributes('role') === undefined)).toBe(true)
    expect(segments.every(segment => segment.attributes('tabindex') === undefined)).toBe(true)
  })
})
