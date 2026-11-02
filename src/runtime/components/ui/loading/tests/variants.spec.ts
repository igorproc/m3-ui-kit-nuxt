import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MLoading from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MLoading, { props: { ariaLabel: 'Loading', ...props } })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-loading · variants', () => {
  describe('type', () => {
    it.each([
      ['spinner', '.ui-loading__spinner', '.ui-loading__shape'],
      ['shape', '.ui-loading__shape', '.ui-loading__spinner'],
    ] as const)('renders the %s indicator markup only', async (type, present, absent) => {
      const wrapper = await mount({ type })

      expect(wrapper.classes()).toContain(`ui-loading--${type}`)
      expect(wrapper.find(present).exists()).toBe(true)
      expect(wrapper.find(absent).exists()).toBe(false)
    })

    it('defaults to the spinner', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-loading--spinner')
    })

    it('builds the spinner from two clipped half rings', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-loading__left .ui-loading__circle').exists()).toBe(true)
      expect(wrapper.find('.ui-loading__right .ui-loading__circle').exists()).toBe(true)
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('maps density %s onto its modifier', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-loading--density-${density}`)
    })

    it('defaults to the default density', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-loading--density-default')
    })

    it('has no size axis any more', async () => {
      const wrapper = await mount({ size: 'small' })

      expect(wrapper.classes()).not.toContain('ui-loading--small')
    })
  })

  describe('contained', () => {
    it.each(['spinner', 'shape'] as const)('wraps the %s in the contained modifier', async (type) => {
      const off = await mount({ type })
      expect(off.classes()).not.toContain('ui-loading--contained')

      const on = await mount({ type, contained: true })
      expect(on.classes()).toContain('ui-loading--contained')
    })
  })

  describe('inline', () => {
    it('adds the inline modifier', async () => {
      const off = await mount()
      expect(off.classes()).not.toContain('ui-loading--inline')

      const on = await mount({ inline: true })
      expect(on.classes()).toContain('ui-loading--inline')
    })

    // A block inside the span is invalid in a <p> or a <button>: the parser
    // splits the paragraph and SSR hydration mismatches.
    it.each(['spinner', 'shape'] as const)('renders only phrasing elements for %s', async (type) => {
      const wrapper = await mount({ type, inline: true })

      expect(wrapper.element.tagName).toBe('SPAN')
      expect(wrapper.find('div').exists()).toBe(false)
    })
  })
})
