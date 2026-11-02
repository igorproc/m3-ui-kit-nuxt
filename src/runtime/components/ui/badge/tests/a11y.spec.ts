import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MBadge from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MBadge, { props })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-badge · a11y', () => {
  // A badge is usually described by its host; a status on every instance is noise.
  describe('live region', () => {
    it('is not a live region by default', async () => {
      const wrapper = await mount({ value: 5 })

      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.attributes('aria-live')).toBeUndefined()
    })

    it.each([
      ['polite', 'status', 'polite'],
      ['off', undefined, undefined],
    ] as const)('announce=%s renders role %s, aria-live %s', async (announce, role, live) => {
      const wrapper = await mount({ value: 5, announce })

      expect(wrapper.attributes('role')).toBe(role)
      expect(wrapper.attributes('aria-live')).toBe(live)
    })
  })

  describe('content', () => {
    it('keeps the shown count as text, so a host label can include it', async () => {
      const wrapper = await mount({ value: 150 })

      expect(wrapper.text()).toBe('99+')
    })

    it('renders no text for a dot', async () => {
      const wrapper = await mount({ dot: true })

      expect(wrapper.text()).toBe('')
    })

    // A dot says nothing to a screen reader: the host's name carries the news.
    it('hides a dot from assistive tech', async () => {
      const dot = await mount({ dot: true })
      expect(dot.attributes('aria-hidden')).toBe('true')

      const count = await mount({ value: 3 })
      expect(count.attributes('aria-hidden')).toBeUndefined()
    })
  })
})
