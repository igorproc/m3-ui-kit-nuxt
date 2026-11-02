import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MIconButton from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots: Slots = { default: () => 'X' }) {
  if (current) current.unmount()
  current = await mountSuspended(MIconButton, { props: { ariaLabel: 'Close', ...props }, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-icon · variants', () => {
  it('is an MButton with the icon-button block and its glyph box', async () => {
    const wrapper = await mount()

    expect(wrapper.find('button.ui-button.ui-icon-button').exists()).toBe(true)
    expect(wrapper.find('.ui-icon-button__content').text()).toBe('X')
  })

  describe('variant', () => {
    it.each(['filled', 'tonal', 'outlined', 'text'] as const)('maps %s onto the button modifier', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-button--${variant}`)
    })

    it('defaults to text, the standard icon button', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-button--text')
    })
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('maps %s onto the button modifier and drops the content colour', async (color) => {
      const wrapper = await mount({ color })

      expect(wrapper.classes()).toContain(`ui-button--${color}`)
      expect(wrapper.classes()).not.toContain('ui-button--current')
    })

    it('takes its container\'s content colour while no role is given', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-button--current')
    })
  })

  describe('width', () => {
    it.each(['narrow', 'default', 'wide'] as const)('maps %s onto its modifier', async (width) => {
      const wrapper = await mount({ width })

      expect(wrapper.classes()).toContain(`ui-icon-button--${width}`)
    })

    it('defaults to the default width', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-icon-button--default')
    })
  })

  describe('density and shape', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('passes the %s density to the button', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-button--${density}`)
    })

    it.each(['round', 'square'] as const)('passes the %s shape to the button', async (shape) => {
      const wrapper = await mount({ shape })

      expect(wrapper.classes()).toContain(`ui-button--${shape}`)
    })

    it('defaults to the default step and the round shape', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-button--default', 'ui-button--round']))
    })
  })

  describe('toggle', () => {
    it('is a plain action while selected is unbound', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-button--selected')
      expect(wrapper.classes()).not.toContain('ui-button--unselected')
    })

    it.each([
      [true, 'ui-button--selected'],
      [false, 'ui-button--unselected'],
    ])('selected=%s wears %s', async (selected, modifier) => {
      const wrapper = await mount({ selected })

      expect(wrapper.classes()).toContain(modifier)
    })

    it('hands the toggle state to the slot, so the glyph can swap', async () => {
      const glyph = ({ selected }: { selected?: boolean }) => (selected ? 'filled' : 'outline')
      const wrapper = await mount({ selected: true }, { default: glyph })

      expect(wrapper.text()).toBe('filled')
      await wrapper.setProps({ selected: false })
      expect(wrapper.text()).toBe('outline')
    })

    // W70-А: a selected toggle draws the filled pair of the glyph in its slot.
    it.each([
      [true, 'ic:baseline-star'],
      [false, 'ic:outline-star'],
      [undefined, 'ic:outline-star'],
    ])('selected=%s draws %s for an outline glyph', async (selected, glyph) => {
      const wrapper = await mount({ selected }, { default: () => h(MIcon, { name: 'outline-star' }) })

      expect(wrapper.html()).toContain(glyph)
    })

    it('swaps the glyph pair as the toggle flips', async () => {
      const wrapper = await mount({ selected: false }, { default: () => h(MIcon, { name: 'outline-favorite' }) })

      await wrapper.setProps({ selected: true })
      expect(wrapper.html()).toContain('ic:baseline-favorite')
      await wrapper.setProps({ selected: false })
      expect(wrapper.html()).toContain('ic:outline-favorite')
    })
  })

  describe('states', () => {
    it.each([
      ['disabled', { disabled: true }],
      ['soft-disabled', { softDisabled: true }],
      ['loading', { loading: true }],
    ])('wears the disabled modifier while %s', async (_, props) => {
      const wrapper = await mount(props)

      expect(wrapper.classes()).toContain('ui-button--disabled')
    })

    it('shows a spinner while loading', async () => {
      const wrapper = await mount({ loading: true })

      expect(wrapper.find('.ui-button__spinner .ui-loading--inline').exists()).toBe(true)
      expect(wrapper.classes()).toContain('ui-button--loading')
    })
  })
})
