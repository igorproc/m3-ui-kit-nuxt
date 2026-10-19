import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MLoading from './index.vue'

const start = vi.fn()

vi.mock('#kit/composables/useTimer', () => ({
  useTimer: () => ({ start, stop: vi.fn() }),
}))

// LDG.B-1: a server render has no unmount, so a cycle started in setup kept
// rescheduling itself for the life of the process.
describe('m-loading cycle', () => {
  it('starts the expressive cycle only once mounted, never in a server render', async () => {
    await renderToString(createSSRApp({ render: () => h(MLoading, { type: 'expressive', ariaLabel: 'Loading' }) }))
    expect(start).not.toHaveBeenCalled()

    const wrapper = await mountSuspended(MLoading, { props: { type: 'expressive', ariaLabel: 'Loading' } })
    expect(start).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
