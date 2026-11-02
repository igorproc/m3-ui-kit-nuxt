import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MExtendedFab from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MExtendedFab, { props, slots: { default: () => 'Compose', prepend: () => 'I' } })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-extended-fab · a11y', () => {
  it('relies on the native button role and never submits a form', async () => {
    const wrapper = await mount()

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('type')).toBe('button')
  })

  it.each([true, false])('is named by its label whether expanded=%s', async (expanded) => {
    const wrapper = await mount({ expanded })
    const label = wrapper.find('.ui-extended-fab__label')

    expect(label.text()).toBe('Compose')
    expect(label.attributes('aria-hidden')).toBeUndefined()
  })

  it('leaves the tab order with a native disabled', async () => {
    const wrapper = await mount({ disabled: true })

    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('keeps a loading button focusable: aria-disabled and aria-busy, no native disabled', async () => {
    const wrapper = await mount({ loading: true })

    expect(wrapper.attributes('disabled')).toBeUndefined()
    expect(wrapper.attributes()).toMatchObject({ 'aria-disabled': 'true', 'aria-busy': 'true' })
  })

  it('hides the spinner from assistive tech and keeps the label as the name', async () => {
    const wrapper = await mount({ loading: true })

    expect(wrapper.find('.ui-extended-fab__spinner').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.ui-extended-fab__label').text()).toBe('Compose')
  })

  it('has no pressed state', async () => {
    const wrapper = await mount()

    expect(wrapper.attributes('aria-pressed')).toBeUndefined()
  })
})
