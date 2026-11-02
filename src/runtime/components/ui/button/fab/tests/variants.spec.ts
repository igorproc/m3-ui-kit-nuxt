import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MFab from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MFab, { props: { ariaLabel: 'Add', ...props }, slots: { default: () => 'icon' } })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-fab · variants', () => {
  it('renders a native button with the base class and the icon slot', async () => {
    const wrapper = await mount()

    expect(wrapper.find('button.ui-fab').exists()).toBe(true)
    expect(wrapper.find('.ui-fab__icon').text()).toBe('icon')
  })

  describe('variant', () => {
    it.each(['tonal', 'filled'] as const)('maps the %s colour set onto its modifier', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-fab--${variant}`)
    })

    it('defaults to tonal, the role container', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-fab--tonal')
    })
  })

  describe('color', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error'] as const)('maps %s onto its modifier', async (color) => {
      const wrapper = await mount({ color })

      expect(wrapper.classes()).toContain(`ui-fab--${color}`)
    })

    it('defaults to primary', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-fab--primary')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('maps %s onto its modifier', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-fab--${density}`)
    })

    it('defaults to the default step', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-fab--default')
    })
  })

  describe('states', () => {
    it('wears the disabled modifier when disabled', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.classes()).toContain('ui-fab--disabled')
      expect(wrapper.classes()).not.toContain('ui-fab--loading')
    })

    it('swaps the icon for a spinner while loading', async () => {
      const wrapper = await mount({ loading: true })

      expect(wrapper.find('.ui-fab__spinner .ui-loading--inline').exists()).toBe(true)
      expect(wrapper.find('.ui-fab__icon').exists()).toBe(false)
      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-fab--loading', 'ui-fab--disabled']))
    })

    it('carries no toggle modifiers: a FAB is never a toggle', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-fab--selected')
      expect(wrapper.classes()).not.toContain('ui-fab--unselected')
    })
  })
})
