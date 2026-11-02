import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MExtendedFab from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots: Slots = { default: () => 'Compose', prepend: () => 'I' }) {
  if (current) current.unmount()
  current = await mountSuspended(MExtendedFab, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-extended-fab · variants', () => {
  it('renders a native button with the base class, the icon and the label', async () => {
    const wrapper = await mount()

    expect(wrapper.find('button.ui-extended-fab').exists()).toBe(true)
    expect(wrapper.find('.ui-extended-fab__icon').text()).toBe('I')
    expect(wrapper.find('.ui-extended-fab__label').text()).toBe('Compose')
  })

  it('renders no icon box without a prepend icon', async () => {
    const wrapper = await mount({}, { default: () => 'Compose' })

    expect(wrapper.find('.ui-extended-fab__icon').exists()).toBe(false)
  })

  describe('variant', () => {
    it.each(['tonal', 'filled'] as const)('maps the %s colour set onto its modifier', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-extended-fab--${variant}`)
    })

    it('defaults to tonal', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-extended-fab--tonal')
    })
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('maps %s onto its modifier', async (color) => {
      const wrapper = await mount({ color })

      expect(wrapper.classes()).toContain(`ui-extended-fab--${color}`)
    })

    it('defaults to primary', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-extended-fab--primary')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('maps %s onto its modifier', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-extended-fab--${density}`)
    })

    it('defaults to the default step', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-extended-fab--default')
    })
  })

  describe('expanded', () => {
    it('is expanded by default', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-extended-fab--collapsed')
    })

    it('folds into a FAB when not expanded and keeps the label in the tree', async () => {
      const wrapper = await mount({ expanded: false })

      expect(wrapper.classes()).toContain('ui-extended-fab--collapsed')
      expect(wrapper.find('.ui-extended-fab__label').text()).toBe('Compose')
    })

    it('keeps the label on one line only while it folds', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-extended-fab__label').classes()).not.toContain('ui-extended-fab__label--folding')
      await wrapper.setProps({ expanded: false })
      expect(wrapper.find('.ui-extended-fab__label').classes()).toContain('ui-extended-fab__label--folding')
    })
  })

  describe('states', () => {
    it('wears the disabled modifier when disabled', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.classes()).toContain('ui-extended-fab--disabled')
    })

    it('puts the spinner in the icon\'s place while loading', async () => {
      const wrapper = await mount({ loading: true })

      expect(wrapper.find('.ui-extended-fab__spinner .ui-loading--inline').exists()).toBe(true)
      expect(wrapper.find('.ui-extended-fab__spinner--centered').exists()).toBe(false)
      expect(wrapper.find('.ui-extended-fab__icon').exists()).toBe(false)
      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-extended-fab--loading', 'ui-extended-fab--disabled']))
    })

    it('centres the spinner over the label when there is no icon to stand in for', async () => {
      const wrapper = await mount({ loading: true }, { default: () => 'Compose' })

      expect(wrapper.find('.ui-extended-fab__spinner--centered').exists()).toBe(true)
      expect(wrapper.find('.ui-extended-fab__label').text()).toBe('Compose')
    })
  })
})
