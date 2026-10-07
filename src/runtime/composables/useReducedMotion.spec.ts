import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useReducedMotion } from './useReducedMotion'

const listeners = new Set<(event: MediaQueryListEvent) => void>()

function stubMatchMedia(matches: boolean) {
  listeners.clear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  })))
}

const Probe = defineComponent({
  setup() {
    const reduced = useReducedMotion()
    return () => h('span', String(reduced.value))
  },
})

describe('useReducedMotion', () => {
  it('reads the preference once mounted and follows its changes', async () => {
    stubMatchMedia(true)
    const wrapper = await mountSuspended(Probe)

    expect(wrapper.text()).toBe('true')

    for (const listener of listeners) listener({ matches: false } as MediaQueryListEvent)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('false')

    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  it('drops the listener with its last caller', async () => {
    stubMatchMedia(false)
    const first = await mountSuspended(Probe)
    const second = await mountSuspended(Probe)

    expect(listeners.size).toBe(1)
    first.unmount()
    expect(listeners.size).toBe(1)
    second.unmount()
    expect(listeners.size).toBe(0)

    vi.unstubAllGlobals()
  })
})
