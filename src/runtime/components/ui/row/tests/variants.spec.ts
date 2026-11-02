import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MRow from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MRow, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-row · variants', () => {
  it('renders a bare subgrid row by default', async () => {
    const wrapper = await mount()

    expect(wrapper.classes()).toEqual(['m-row'])
  })

  it.each(['start', 'center', 'end', 'stretch'] as const)('align=%s maps to its modifier', async (align) => {
    const wrapper = await mount({ align })

    expect(wrapper.classes()).toEqual(['m-row', `m-row--align-${align}`])
  })

  it.each([
    [true, true],
    [false, false],
  ])('noGutters=%s → m-row--no-gutters %s', async (noGutters, expected) => {
    const wrapper = await mount({ noGutters })

    expect(wrapper.classes().includes('m-row--no-gutters')).toBe(expected)
  })

  it('combines align and no-gutters', async () => {
    const wrapper = await mount({ align: 'center', noGutters: true })

    expect(wrapper.classes()).toContain('m-row--align-center')
    expect(wrapper.classes()).toContain('m-row--no-gutters')
  })

  it('renders its columns directly as subgrid items', async () => {
    const wrapper = await mount({}, { default: () => h('div', { 'data-testid': 'col' }) })

    expect(wrapper.find('[data-testid="col"]').element.parentElement).toBe(wrapper.element)
  })
})
