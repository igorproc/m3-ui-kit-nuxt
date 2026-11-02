import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MDivider from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MDivider, { props })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-divider · interaction', () => {
  it('follows an orientation change in class and ARIA together', async () => {
    const wrapper = await mount()

    await wrapper.setProps({ orientation: 'vertical' })

    expect(wrapper.classes()).toContain('ui-divider--vertical')
    expect(wrapper.classes()).not.toContain('ui-divider--horizontal')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
  })

  it('drops the inset modifier when the inset is cleared', async () => {
    const wrapper = await mount({ inset: 'start' })

    await wrapper.setProps({ inset: undefined })

    expect(wrapper.classes().some(name => name.startsWith('ui-divider--inset'))).toBe(false)
  })

  it('is never a tab stop', async () => {
    const wrapper = await mount()

    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })
})
