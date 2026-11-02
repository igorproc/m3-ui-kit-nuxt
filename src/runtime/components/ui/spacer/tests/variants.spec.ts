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

describe('m-spacer · variants', () => {
  it('renders one empty flex filler', async () => {
    const wrapper = await mount()

    expect(wrapper.classes()).toEqual(['ui-spacer'])
    expect(wrapper.element.childNodes).toHaveLength(0)
  })
})
