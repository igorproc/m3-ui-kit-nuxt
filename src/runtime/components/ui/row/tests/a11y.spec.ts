import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MRow from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MRow, { props })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-row · a11y', () => {
  // A layout row, not a table row: role="row" would claim a grid structure the page does not have.
  it('is a generic box with no row role', async () => {
    const wrapper = await mount({ align: 'center' })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBeUndefined()
  })
})
