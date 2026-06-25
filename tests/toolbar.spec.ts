import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MToolbar from '../app/components/ui/toolbar/index.vue'

describe('m-toolbar', () => {
  it('renders with the default standard type and horizontal layout', async () => {
    const wrapper = await mountSuspended(MToolbar)

    expect(wrapper.find('.ui-toolbar').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-toolbar--type-standard')
    expect(wrapper.classes()).toContain('ui-toolbar--layout-horizontal')
  })

  it('maps the new `type` prop to a modifier class', async () => {
    for (const type of ['standard', 'baseline'] as const) {
      const wrapper = await mountSuspended(MToolbar, { props: { type } })
      expect(wrapper.classes()).toContain(`ui-toolbar--type-${type}`)
    }
  })

  it('maps the layout prop to a modifier class', async () => {
    const wrapper = await mountSuspended(MToolbar, { props: { layout: 'vertical' } })

    expect(wrapper.classes()).toContain('ui-toolbar--layout-vertical')
  })

  it('renders default slot content', async () => {
    const wrapper = await mountSuspended(MToolbar, {
      slots: { default: () => 'content' },
    })

    expect(wrapper.find('.ui-toolbar').text()).toContain('content')
  })

  it('emits select with the item when a default item is activated (legacy path)', async () => {
    const wrapper = await mountSuspended(MToolbar, {
      props: { items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
    })

    const firstItem = wrapper.find('.ui-toolbar > *')
    await firstItem.trigger('click')

    const events = wrapper.emitted('select')
    expect(events).toBeTruthy()
    expect((events![0]![0] as { id: string }).id).toBe('a')
  })

  it('does not emit select for a disabled item', async () => {
    const wrapper = await mountSuspended(MToolbar, {
      props: { items: [{ id: 'a', label: 'A', disabled: true }] },
    })

    await wrapper.find('.ui-toolbar > *').trigger('click')

    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
