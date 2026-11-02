import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MLoading from '../index.vue'
import type { MLoadingType } from '../props'

const start = vi.fn()

vi.mock('#kit/composables/useTimer', () => ({
  useTimer: () => ({ start, stop: vi.fn() }),
}))

const PHRASING = new Set(['p', 'span', 'svg', 'path'])

const paragraph = (type: MLoadingType) => () =>
  h('p', ['Saving the draft ', h(MLoading, { type, inline: true, ariaLabel: 'Saving' }), ' to the server.'])

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

// LDG.B-1: a server render has no unmount, so a cycle started in setup kept
// rescheduling itself for the life of the process.
describe('m-loading cycle', () => {
  it('starts the expressive cycle only once mounted, never in a server render', async () => {
    await renderToString(createSSRApp({ render: () => h(MLoading, { type: 'shape', ariaLabel: 'Loading' }) }))
    expect(start).not.toHaveBeenCalled()

    const wrapper = await mountSuspended(MLoading, { props: { type: 'shape', ariaLabel: 'Loading' } })
    expect(start).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('m-loading inline in a paragraph', () => {
  it.each(['spinner', 'shape'] as const)('renders the %s with phrasing elements only', async (type) => {
    const html = await renderToString(createSSRApp({ render: paragraph(type) }))
    const tags = Array.from(html.matchAll(/<([a-z][a-z0-9-]*)/g), match => match[1])

    expect(tags.filter(tag => !PHRASING.has(tag!))).toEqual([])
    expect(html.match(/<p[\s>]/g)).toHaveLength(1)
    expect(html.trim().endsWith('</p>')).toBe(true)
  })

  it.each(['spinner', 'shape'] as const)('hydrates the %s without a mismatch', async (type) => {
    const html = await renderToString(createSSRApp({ render: paragraph(type) }))
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const app = createSSRApp({ render: paragraph(type) })
    app.mount(container)
    await new Promise(resolve => setTimeout(resolve, 50))

    const reports = [...warn.mock.calls, ...error.mock.calls].map(call => String(call[0]))
    expect(reports.filter(report => /hydration/i.test(report))).toEqual([])
    expect(container.querySelector('p > .ui-loading')).not.toBeNull()
    app.unmount()
  })
})
