import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MFab from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MFab, { props: { ariaLabel: 'Add', ...props }, attrs, slots: { default: () => 'icon' } })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-fab · interaction', () => {
  it('reaches the consumer\'s click handler', async () => {
    const onClick = vi.fn()
    const wrapper = await mount({}, { onClick })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('swallows the click of a loading FAB before any handler', async () => {
    const onClick = vi.fn()
    const wrapper = await mount({ loading: true }, { onClick })

    await wrapper.trigger('click')

    expect(onClick).not.toHaveBeenCalled()
  })

  it('never submits a surrounding form', async () => {
    const wrapper = await mount()

    expect(wrapper.attributes('type')).toBe('button')
  })

  it('passes the consumer\'s attributes onto the root', async () => {
    const wrapper = await mount({}, { 'class': 'extra', 'data-test': 'fab' })

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-fab', 'extra']))
    expect(wrapper.attributes('data-test')).toBe('fab')
  })
})
