import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MShape from '../index.vue'
import type { MShapeProps } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: MShapeProps) {
  if (current) current.unmount()
  const wrapper = await mountSuspended(MShape, { props })
  current = wrapper

  return wrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-shape · a11y', () => {
  it('is hidden from assistive technology by default', async () => {
    const wrapper = await mount({ name: 'circle' })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('is announced as a named image when it has a label', async () => {
    const wrapper = await mount({ name: 'sunny', label: 'Online' })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Online')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
  })

  it('trims the label it is named by', async () => {
    const wrapper = await mount({ name: 'sunny', label: '  Online ' })

    expect(wrapper.attributes('aria-label')).toBe('Online')
  })

  it.each(['', '   '])('stays decorative for the blank label %j', async (label) => {
    const wrapper = await mount({ name: 'circle', label })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('switches between decoration and image when the label changes', async () => {
    const wrapper = await mount({ name: 'circle' })

    await wrapper.setProps({ label: 'Away' })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()

    await wrapper.setProps({ label: undefined })
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  it('never takes focus, named or not (legacy IE/Edge focusable svg)', async () => {
    const decorative = await mount({ name: 'circle' })
    expect(decorative.attributes('focusable')).toBe('false')

    const named = await mount({ name: 'circle', label: 'Online' })
    expect(named.attributes('focusable')).toBe('false')
    expect(named.attributes('tabindex')).toBeUndefined()
  })
})
