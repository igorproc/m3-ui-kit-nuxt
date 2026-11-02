import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MListSubheader from '../index.vue'
import MList from '../../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MListSubheader, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-list-subheader · a11y', () => {
  it('is passive: no role and no tab stop', async () => {
    const wrapper = await mount({ title: 'Recent' })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('adds no role inside a list — any role on a list child breaks the list', async () => {
    current = await mountSuspended(defineComponent({ render: () => h(MList, null, { default: () => h(MListSubheader, { title: 'Recent' }) }) }))
    const root = (current as VueWrapper).find('.ui-list-subheader')

    expect(root.element.tagName).toBe('LI')
    expect(root.attributes('role')).toBeUndefined()
  })

  it('invents no heading — the outline level is the consumer’s to choose', async () => {
    const wrapper = await mount({ title: 'Recent' })

    expect(wrapper.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false)
    expect(wrapper.attributes('aria-level')).toBeUndefined()
  })

  it('keeps a slotted heading a heading, so heading navigation still finds it', async () => {
    const wrapper = await mount({}, { default: () => h('h3', 'Archive') })

    expect(wrapper.find('h3').text()).toBe('Archive')
    expect(wrapper.find('h3').element.parentElement).toBe(wrapper.element)
  })

  // The missing-label warning is guarded by `import.meta.dev`, which Vitest
  // resolves to `false`; it cannot be asserted here.
})
