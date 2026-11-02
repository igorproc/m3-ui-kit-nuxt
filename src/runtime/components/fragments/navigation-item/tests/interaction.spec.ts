import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import NavigationItem from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(NavigationItem, {
    props: { host: 'rail', placement: 'top', label: 'Inbox', icon: 'outline-inbox', ...props },
  })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('navigation-item · interaction', () => {
  it('emits select with the native event on a click', async () => {
    const wrapper = await mount()

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')![0]![0]).toBeInstanceOf(MouseEvent)
  })

  it('emits select for the active destination too', async () => {
    const wrapper = await mount({ active: true })

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('does not emit select while disabled', async () => {
    const wrapper = await mount({ disabled: true })

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('switches its layout with the placement prop', async () => {
    const wrapper = await mount({ placement: 'top' })

    await wrapper.setProps({ placement: 'start' })

    expect(wrapper.classes()).toContain('ui-navigation-item--start')
    expect(wrapper.find('.ui-navigation-item__indicator .ui-navigation-item__label').exists()).toBe(true)
  })
})
