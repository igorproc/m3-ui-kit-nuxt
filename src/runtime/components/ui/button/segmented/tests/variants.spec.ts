import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { ICONS } from '#kit/shared/constants/icons'
import MSegmented from '../index.vue'
import type { MSegmentedItem } from '../props'

const items: MSegmentedItem[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MSegmented, { props: { items, ...props }, attrs: { 'aria-label': 'Period' } })

  return current as VueWrapper
}

const segments = (wrapper: VueWrapper) => wrapper.findAll('.ui-segmented-button__segment')
const glyph = (segment: ReturnType<typeof segments>[number]) => segment.find('.ui-segmented-button__icon .ui-icon')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-segmented · variants', () => {
  it('draws one segment button per item, in reading order', async () => {
    const wrapper = await mount()

    expect(wrapper.find('.ui-segmented-button').exists()).toBe(true)
    expect(segments(wrapper).map(segment => segment.text())).toEqual(['Day', 'Week', 'Month'])
  })

  it('renders nothing for an empty list', async () => {
    const wrapper = await mount({ items: [] })

    expect(wrapper.find('.ui-segmented-button').exists()).toBe(false)
  })

  it('has no loading state of its own', async () => {
    const wrapper = await mount()

    expect(Object.keys(wrapper.props())).not.toContain('loading')
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('maps the selected scheme %s onto the root', async (color) => {
      const wrapper = await mount({ color })

      expect(wrapper.classes()).toContain(`ui-segmented-button--${color}`)
    })

    it('defaults the selected scheme to secondary', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-segmented-button--secondary')
    })
  })

  describe('selection look', () => {
    it.each([
      [false, 'week', [false, true, false]],
      [true, ['day', 'month'], [true, false, true]],
    ])('multiple=%s marks the segments of the model as selected', async (multiple, modelValue, expected) => {
      const wrapper = await mount({ multiple, modelValue })

      expect(segments(wrapper).map(segment => segment.classes().includes('ui-segmented-button__segment--selected'))).toEqual(expected)
    })

    it('draws the check in the selected segment, in place of its icon', async () => {
      const wrapper = await mount({ items: [{ value: 'grid', icon: 'ic:outline-dashboard', label: 'Grid' }], modelValue: 'grid' })

      expect(glyph(segments(wrapper)[0]!).exists()).toBe(true)
      expect(segments(wrapper)[0]!.findAllComponents({ name: 'MIcon' }).at(0)?.props('name')).toBe(ICONS.check)
    })

    it('draws the item icon while unselected', async () => {
      const wrapper = await mount({ items: [{ value: 'grid', icon: 'ic:outline-dashboard', label: 'Grid' }] })

      expect(segments(wrapper)[0]!.findAllComponents({ name: 'MIcon' }).at(0)?.props('name')).toBe('ic:outline-dashboard')
    })

    it('keeps the check room in every segment and centres an unselected label over it', async () => {
      const wrapper = await mount({ items: [...items, { value: 'grid', icon: 'ic:outline-dashboard', ariaLabel: 'Grid' }], modelValue: 'week' })

      expect(segments(wrapper).every(segment => segment.find('.ui-segmented-button__icon').exists())).toBe(true)
      expect(segments(wrapper).map(segment => segment.classes().includes('ui-segmented-button__segment--centered'))).toEqual([true, false, true, false])
    })
  })

  describe('items', () => {
    it('renders the label element only for a labelled item', async () => {
      const wrapper = await mount({ items: [{ value: 'grid', icon: 'ic:outline-dashboard', ariaLabel: 'Grid' }, items[0]] })

      expect(segments(wrapper)[0]!.find('.ui-segmented-button__label').exists()).toBe(false)
      expect(segments(wrapper)[1]!.find('.ui-segmented-button__label').text()).toBe('Day')
    })
  })

  describe('disabled', () => {
    it('marks the root of a disabled group', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.classes()).toContain('ui-segmented-button--disabled')
    })

    it('leaves the root unmarked when only an item is disabled', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-segmented-button--disabled')
    })
  })
})
