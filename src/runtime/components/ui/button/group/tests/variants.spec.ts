import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MButtonGroup from '../index.vue'
import type { MButtonGroupItem } from '../props'

const periods: MButtonGroupItem[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MButtonGroup, { props: { items: periods, ...props }, attrs: { 'aria-label': 'Period' } })

  return current as VueWrapper
}

const buttons = (wrapper: VueWrapper) => wrapper.findAll('button')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-group · variants', () => {
  it('draws one MButton per item, in reading order', async () => {
    const wrapper = await mount()

    expect(wrapper.findAll('button.ui-button.ui-button-group__item')).toHaveLength(3)
    expect(buttons(wrapper).map(button => button.text())).toEqual(['Day', 'Week', 'Month'])
  })

  it('renders nothing for an empty list', async () => {
    const wrapper = await mount({ items: [] })

    expect(wrapper.find('.ui-button-group').exists()).toBe(false)
  })

  describe('variant', () => {
    it.each(['filled', 'tonal', 'elevated', 'outlined'] as const)('passes %s to every button', async (variant) => {
      const wrapper = await mount({ variant })

      expect(buttons(wrapper).every(button => button.classes().includes(`ui-button--${variant}`))).toBe(true)
    })

    it('defaults to filled', async () => {
      const wrapper = await mount()

      expect(buttons(wrapper)[0]!.classes()).toContain('ui-button--filled')
    })
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('passes %s to every button', async (color) => {
      const wrapper = await mount({ color })

      expect(buttons(wrapper).every(button => button.classes().includes(`ui-button--${color}`))).toBe(true)
    })

    it('defaults to primary', async () => {
      const wrapper = await mount()

      expect(buttons(wrapper)[0]!.classes()).toContain('ui-button--primary')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('passes %s to every button', async (density) => {
      const wrapper = await mount({ density })

      expect(buttons(wrapper).every(button => button.classes().includes(`ui-button--${density}`))).toBe(true)
    })

    it('defaults to the default step', async () => {
      const wrapper = await mount()

      expect(buttons(wrapper)[0]!.classes()).toContain('ui-button--default')
    })
  })

  describe('selection look', () => {
    it.each([
      [false, 'day', ['ui-button--selected', 'ui-button--unselected', 'ui-button--unselected']],
      [true, ['day', 'month'], ['ui-button--selected', 'ui-button--unselected', 'ui-button--selected']],
    ])('multiple=%s wears MButton\'s toggle classes by the model', async (multiple, modelValue, expected) => {
      const wrapper = await mount({ multiple, modelValue })

      expect(buttons(wrapper).map(button => button.classes().find(name => name.endsWith('selected')))).toEqual(expected)
    })

    it('shows every button unselected while the model is empty', async () => {
      const wrapper = await mount()

      expect(buttons(wrapper).every(button => button.classes().includes('ui-button--unselected'))).toBe(true)
    })

    it('moves every button on the toggle spring', async () => {
      const wrapper = await mount({ modelValue: 'day' })

      for (const button of buttons(wrapper)) {
        expect((button.element as HTMLElement).style.transition).toContain('border-radius')
      }
    })
  })

  describe('items', () => {
    it('draws an icon and a label when an item has both', async () => {
      const wrapper = await mount({ items: [{ value: 'grid', icon: 'ic:outline-dashboard', label: 'Grid' }] })
      const button = buttons(wrapper)[0]!

      expect(button.find('.ui-button__icon--prepend').exists()).toBe(true)
      expect(button.find('.ui-button__label').text()).toBe('Grid')
      expect(button.classes()).not.toContain('ui-button--icon-only')
    })

    it('draws an icon-only button for an item with only an icon', async () => {
      const wrapper = await mount({ items: [{ value: 'grid', icon: 'ic:outline-dashboard', ariaLabel: 'Grid' }] })

      expect(buttons(wrapper)[0]!.classes()).toContain('ui-button--icon-only')
      expect(buttons(wrapper)[0]!.find('.ui-button__label').exists()).toBe(false)
    })

    it('draws no icon box for a label-only item', async () => {
      const wrapper = await mount()

      expect(buttons(wrapper)[0]!.find('.ui-button__icon').exists()).toBe(false)
    })
  })

  describe('disabled', () => {
    it('disables one item', async () => {
      const wrapper = await mount({ items: [...periods, { label: 'Year', value: 'year', disabled: true }] })

      expect(buttons(wrapper)[3]!.classes()).toContain('ui-button--disabled')
      expect(buttons(wrapper)[0]!.classes()).not.toContain('ui-button--disabled')
    })

    it('disables the whole group', async () => {
      const wrapper = await mount({ disabled: true })

      expect(buttons(wrapper).every(button => button.classes().includes('ui-button--disabled'))).toBe(true)
    })
  })
})
