import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MContainer from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MContainer, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-container · a11y', () => {
  it('is a generic box: no role, no landmark', async () => {
    const wrapper = await mount()

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  // Columns are placed by span and offset only, never reordered: reading and Tab order follow the source.
  it('keeps the source order of its cells', async () => {
    const wrapper = await mount({ cols: 4 }, {
      default: () => ['one', 'two', 'three'].map(label => h('button', { type: 'button' }, label)),
    })

    expect(wrapper.findAll('button').map(button => button.text())).toEqual(['one', 'two', 'three'])
  })

  it('passes a role and a name through for a region the app defines', async () => {
    if (current) current.unmount()
    current = await mountSuspended(MContainer, { attrs: { 'role': 'region', 'aria-label': 'Results' } })
    const wrapper = current as VueWrapper

    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('aria-label')).toBe('Results')
  })
})
