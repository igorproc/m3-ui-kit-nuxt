import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MSpacer from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount() {
  if (current) current.unmount()
  current = await mountSuspended(MSpacer)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-spacer · a11y', () => {
  // An empty generic div is already absent from the accessibility tree; aria-hidden would add nothing.
  it('adds nothing to the accessibility tree: no role, no text, no focus stop', async () => {
    const wrapper = await mount()

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.text()).toBe('')
  })
})
