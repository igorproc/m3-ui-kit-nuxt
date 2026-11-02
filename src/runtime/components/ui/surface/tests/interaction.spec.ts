import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MSurface from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MSurface, { props, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-surface · interaction', () => {
  it('passes a consumer click handler through and stays passive', async () => {
    const onClick = vi.fn()
    const wrapper = await mount({}, { onClick })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledOnce()
    expect(wrapper.classes()).toEqual(['ui-surface', 'ui-surface--plain', 'ui-surface--shape-none'])
  })

  it('follows a variant and shape change', async () => {
    const wrapper = await mount({ variant: 'filled' })

    await wrapper.setProps({ variant: 'elevated', shape: 'large' })

    expect(wrapper.classes()).toEqual(['ui-surface', 'ui-surface--elevated', 'ui-surface--shape-large'])
  })

  it('swaps its element with the tag', async () => {
    const wrapper = await mount({ tag: 'div' })

    await wrapper.setProps({ tag: 'section' })

    expect(wrapper.element.tagName).toBe('SECTION')
  })

  // The click-without-role warning is guarded by `import.meta.dev`, which
  // Vitest resolves to `false`; it cannot be asserted here.
})
