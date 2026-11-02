import { afterEach, describe, expect, it } from 'vitest'
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

describe('m-surface · a11y', () => {
  it.each(['plain', 'filled', 'elevated', 'outlined'] as const)('adds no role and no tab stop to a %s surface', async (variant) => {
    const wrapper = await mount({ variant })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('takes its semantics from the tag the consumer picks', async () => {
    const wrapper = await mount({ tag: 'aside' })

    expect(wrapper.element.tagName).toBe('ASIDE')
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('passes the consumer ARIA and role through to the root', async () => {
    const wrapper = await mount({}, { 'role': 'region', 'aria-label': 'Panel', 'data-test': 'panel' })

    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('aria-label')).toBe('Panel')
    expect(wrapper.attributes('data-test')).toBe('panel')
  })

  it('gains no role from a click handler — interaction is the consumer’s to declare', async () => {
    const wrapper = await mount({}, { onClick: () => {} })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })
})
