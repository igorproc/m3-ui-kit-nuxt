import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import CoreScope from '../scope.vue'

let current: { unmount: () => void } | null = null

async function mount() {
  if (current) current.unmount()
  current = await mountSuspended(CoreScope)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('core · a11y', () => {
  // Overlays bring their own roles (dialog, menu, status); the hosts must not wrap them in another one.
  it('adds no role, name or hiding to the hosts', async () => {
    const wrapper = await mount()

    for (const host of [wrapper.find('#ui-overlay-host'), wrapper.find('.ui-dialog-global-container')]) {
      expect(host.attributes('role')).toBeUndefined()
      expect(host.attributes('aria-label')).toBeUndefined()
      expect(host.attributes('aria-hidden')).toBeUndefined()
      expect(host.attributes('inert')).toBeUndefined()
    }
  })

  // B4.9b: announcements need a region that is in the document before the
  // message and lives where teleported surfaces do, outside any inert subtree.
  it('holds one pair of announcement regions as the first direct child of the overlay host', async () => {
    const wrapper = await mount()
    const host = wrapper.find('#ui-overlay-host').element
    const regions = Array.from(host.children).filter(child => child.classList.contains('ui-live-region'))

    expect(regions).toHaveLength(1)
    expect(host.firstElementChild).toBe(regions[0])
    expect(regions[0]!.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(regions[0]!.querySelectorAll('[role="alert"]')).toHaveLength(1)
    expect(regions[0]!.closest('[inert]')).toBeNull()
  })

  it('renders the announcement regions empty', async () => {
    const wrapper = await mount()

    expect(wrapper.find('#ui-overlay-host .ui-live-region').text()).toBe('')
  })
})
