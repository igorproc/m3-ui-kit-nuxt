import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MLoading from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  current?.unmount()
  current = await mountSuspended(MLoading, { props })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-loading · a11y', () => {
  describe('naming', () => {
    it('ships no accessible name of its own and takes the consumer’s', async () => {
      const unnamed = await mount()
      expect(unnamed.attributes('aria-label')).toBeUndefined()

      const named = await mount({ ariaLabel: 'Fetching results' })
      expect(named.attributes('aria-label')).toBe('Fetching results')
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; it cannot be asserted here.
  })

  describe('role', () => {
    // An empty status announces nothing; a named progressbar is found and read.
    it.each(['spinner', 'shape'] as const)('renders the %s indicator as an indeterminate progressbar', async (type) => {
      const wrapper = await mount({ type, ariaLabel: 'Loading' })

      expect(wrapper.attributes('role')).toBe('progressbar')
      expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    })

    it('is not a live region', async () => {
      const wrapper = await mount({ ariaLabel: 'Loading' })

      expect(wrapper.attributes('aria-live')).toBeUndefined()
    })
  })
})
