import { describe, expect, expectTypeOf, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MAlert from './index.vue'
import type {
  MAlertActionsSlot,
  MAlertIconSlot,
  MAlertProps,
  MAlertResolvedProps,
} from './props'

describe('MAlert', () => {
  it('exposes public and resolved prop contracts', () => {
    expectTypeOf<MAlertProps>().toMatchTypeOf<{
      type?: 'info' | 'success' | 'warning' | 'error'
      title?: string
      icon?: string | false
    }>()
    expectTypeOf<MAlertResolvedProps>().toMatchTypeOf<{
      type: 'info' | 'success' | 'warning' | 'error'
      title: string
      icon: string | false
    }>()
  })

  it('renders a polite tonal info alert by default', async () => {
    const wrapper = await mountSuspended(MAlert, { props: { text: 'Saved' } })
    const root = wrapper.find('.ui-alert')
    expect(root.classes()).toContain('ui-alert--info')
    expect(root.classes()).toContain('ui-alert--tonal')
    expect(root.attributes('role')).toBe('status')
    expect(root.attributes('aria-live')).toBe('polite')
    expect(wrapper.find('.ui-alert__body').text()).toBe('Saved')
    expect(wrapper.find('.ui-alert__icon').exists()).toBe(false)
    expect(wrapper.find('.ui-alert__close').exists()).toBe(false)
  })

  it('announces errors assertively and honors explicit overrides', async () => {
    const wrapper = await mountSuspended(MAlert, { props: { type: 'error' } })
    expect(wrapper.find('.ui-alert').attributes('role')).toBe('alert')
    expect(wrapper.find('.ui-alert').attributes('aria-live')).toBe('assertive')

    await wrapper.setProps({ announce: 'polite' })
    expect(wrapper.find('.ui-alert').attributes('role')).toBe('status')
    expect(wrapper.find('.ui-alert').attributes('aria-live')).toBe('polite')

    await wrapper.setProps({ announce: 'off' })
    expect(wrapper.find('.ui-alert').attributes('role')).toBe('group')
    expect(wrapper.find('.ui-alert').attributes('aria-live')).toBeUndefined()
  })

  it('renders only an explicit icon or icon slot', async () => {
    const wrapper = await mountSuspended(MAlert, { props: { type: 'warning' } })
    expect(wrapper.find('.ui-alert__icon').exists()).toBe(false)

    await wrapper.setProps({ icon: 'round-bolt' })
    expect(wrapper.find('.ui-alert__icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.html()).toContain('round-bolt')

    await wrapper.setProps({ icon: false })
    expect(wrapper.find('.ui-alert__icon').exists()).toBe(false)
  })

  it('types slot input while allowing polymorphic icon content', async () => {
    const wrapper = await mountSuspended(MAlert, {
      props: { type: 'success' },
      slots: {
        icon: ({ type, icon }: MAlertIconSlot) => h('svg', {
          'class': 'custom-icon',
          'data-type': type,
          'data-icon': String(icon),
        }),
      },
    })

    const icon = wrapper.get('.custom-icon')
    expect(icon.attributes('data-type')).toBe('success')
    expect(icon.attributes('data-icon')).toBe('false')
  })

  it('wires labelledby/describedby only for rendered content', async () => {
    const wrapper = await mountSuspended(MAlert, { props: { title: 'Offline' } })
    const root = wrapper.find('.ui-alert')
    expect(root.attributes('aria-labelledby')).toBe(wrapper.find('.ui-alert__title').attributes('id'))
    expect(root.attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.find('.ui-alert__body').exists()).toBe(false)
  })

  it('prefers slots over the title/text props', async () => {
    const wrapper = await mountSuspended(MAlert, {
      props: { title: 'prop title', text: 'prop text' },
      slots: { title: () => 'slot title', default: () => 'slot text' },
    })
    expect(wrapper.find('.ui-alert__title').text()).toBe('slot title')
    expect(wrapper.find('.ui-alert__body').text()).toBe('slot text')
  })

  it('emits close once on user dismissal and hides the alert', async () => {
    const wrapper = await mountSuspended(MAlert, { props: { closable: true, modelValue: true } })
    await wrapper.find('.ui-alert__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
    expect(wrapper.find('.ui-alert').exists()).toBe(false)
  })

  it('hides on an external model change without emitting close', async () => {
    const wrapper = await mountSuspended(MAlert, { props: { closable: true, modelValue: true } })
    expect(wrapper.find('.ui-alert').exists()).toBe(true)

    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.ui-alert').exists()).toBe(false)
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('.ui-alert').exists()).toBe(true)
  })

  it('gives the default close control an accessible name', async () => {
    const wrapper = await mountSuspended(MAlert, { props: { closable: true, closeLabel: 'Скрыть' } })
    expect(wrapper.find('.ui-alert__close').attributes('aria-label')).toBe('Скрыть')
  })

  it('replaces the close control through the close slot', async () => {
    const wrapper = await mountSuspended(MAlert, {
      props: { closable: true },
      slots: {
        close: ({ props }: { props: Record<string, unknown> }) =>
          h('button', { ...props, class: [props.class, 'custom-close'] }, 'x'),
      },
    })
    expect(wrapper.find('.ui-icon-button').exists()).toBe(false)
    const custom = wrapper.find('.custom-close')
    expect(custom.classes()).toContain('ui-alert__close')
    await custom.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('ignores the close slot when the alert is not closable', async () => {
    const wrapper = await mountSuspended(MAlert, {
      slots: { close: () => h('button', { class: 'custom-close' }, 'x') },
    })
    expect(wrapper.find('.custom-close').exists()).toBe(false)
  })

  it('renders actions only when the slot is provided', async () => {
    const bare = await mountSuspended(MAlert, { props: { text: 'msg' } })
    expect(bare.find('.ui-alert__actions').exists()).toBe(false)

    const wrapper = await mountSuspended(MAlert, {
      props: { type: 'error', closable: true },
      slots: {
        actions: ({ type, close }: MAlertActionsSlot) =>
          h('button', { 'class': 'retry', 'data-type': type, 'onClick': close }, 'Retry'),
      },
    })
    expect(wrapper.find('.ui-alert__actions').exists()).toBe(false)
    expect(wrapper.get('.retry').element.parentElement).toBe(wrapper.get('.ui-alert').element)
    expect(wrapper.get('.retry').attributes('data-type')).toBe('error')
    await wrapper.find('.retry').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('keeps visibility while severity changes', async () => {
    const wrapper = await mountSuspended(MAlert, { props: { type: 'info', text: 'msg' } })
    await wrapper.setProps({ type: 'error' })
    expect(wrapper.find('.ui-alert').classes()).toContain('ui-alert--error')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
