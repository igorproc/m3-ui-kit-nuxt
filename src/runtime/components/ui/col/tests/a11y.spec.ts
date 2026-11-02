import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MCol from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MCol, { props })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-col · a11y', () => {
  // A layout column, not a table cell: a cell role would invent a data grid.
  it('is a generic box with no cell role', async () => {
    const wrapper = await mount({ cols: 2, offset: 1 })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBeUndefined()
  })
})
