import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MIconButton from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MIconButton, { props: { ariaLabel: 'Favourite', ...props }, attrs, slots: { default: () => 'X' } })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-icon · interaction', () => {
  it('reaches the consumer\'s click handler', async () => {
    const onClick = vi.fn()
    const wrapper = await mount({}, { onClick })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledOnce()
  })

  it.each([
    ['loading', { loading: true }],
    ['soft-disabled', { softDisabled: true }],
  ])('swallows the click of a %s button', async (_, props) => {
    const onClick = vi.fn()
    const wrapper = await mount(props, { onClick })

    await wrapper.trigger('click')

    expect(onClick).not.toHaveBeenCalled()
  })

  describe('toggle', () => {
    it.each([true, false])('reports the opposite of selected=%s through v-model:selected', async (selected) => {
      const wrapper = await mount({ selected })

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:selected')).toEqual([[!selected]])
    })

    it.each([
      ['disabled', { disabled: true }],
      ['loading', { loading: true }],
      ['soft-disabled', { softDisabled: true }],
    ])('does not toggle while %s', async (_, props) => {
      const wrapper = await mount({ selected: false, ...props })

      await wrapper.trigger('click')

      expect(wrapper.emitted('update:selected')).toBeUndefined()
    })
  })

  it.each(['submit', 'reset'] as const)('forwards the native type %s', async (type) => {
    const wrapper = await mount({ type })

    expect(wrapper.attributes('type')).toBe(type)
  })

  it('is a link with its destination when tag is link', async () => {
    const wrapper = await mount({ tag: 'link', to: '/inbox' })

    expect(wrapper.find('a.ui-icon-button').attributes('href')).toBe('/inbox')
  })
})
