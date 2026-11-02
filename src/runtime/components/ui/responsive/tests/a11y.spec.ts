import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MResponsive from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MResponsive, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-responsive · a11y', () => {
  it('is a generic box with no role', async () => {
    const wrapper = await mount({ aspectRatio: '16 / 9' })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('leaves a focusable child in the tab order and its name intact', async () => {
    const wrapper = await mount({ aspectRatio: 1 }, {
      default: () => h('iframe', { title: 'Product video', src: 'about:blank' }),
    })
    const frame = wrapper.find('iframe')

    expect(frame.attributes('title')).toBe('Product video')
    expect(frame.attributes('tabindex')).toBeUndefined()
    expect(wrapper.attributes('inert')).toBeUndefined()
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
  })
})
