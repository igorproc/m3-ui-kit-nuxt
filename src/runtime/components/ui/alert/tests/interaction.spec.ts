import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import MAlert from '../index.vue'
import type { MAlertActionsSlot } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  current?.unmount()
  current = await mountSuspended(MAlert, { props, slots, global: { stubs: { transition: false } } })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-alert · interaction', () => {
  describe('dismissal', () => {
    it('emits close once on user dismissal and hides the alert', async () => {
      const wrapper = await mount({ closable: true, modelValue: true })

      await wrapper.find('.ui-alert__close').trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
      expect(wrapper.find('.ui-alert').exists()).toBe(false)
    })

    it('hides on an external model change without emitting close', async () => {
      const wrapper = await mount({ closable: true, modelValue: true })

      await wrapper.setProps({ modelValue: false })
      expect(wrapper.find('.ui-alert').exists()).toBe(false)
      expect(wrapper.emitted('close')).toBeUndefined()

      await wrapper.setProps({ modelValue: true })
      expect(wrapper.find('.ui-alert').exists()).toBe(true)
    })

    it('replaces the close control through the close slot', async () => {
      const wrapper = await mount({ closable: true }, {
        close: ({ props }: { props: Record<string, unknown> }) => h('button', { ...props, class: [props.class, 'custom-close'] }, 'x'),
      })

      expect(wrapper.find('.ui-icon-button').exists()).toBe(false)
      const custom = wrapper.find('.custom-close')
      expect(custom.classes()).toContain('ui-alert__close')

      await custom.trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('hands the close slot a close() of its own', async () => {
      const wrapper = await mount({ closable: true }, {
        close: ({ close }: { close: () => void }) => h('button', { class: 'custom-close', onClick: close }, 'x'),
      })

      await wrapper.find('.custom-close').trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })

  // W50: a dismissed alert must not drop focus on <body>.
  describe('focus after closing', () => {
    async function mountInPage(props: Record<string, unknown> = {}, after = true) {
      const Page = defineComponent({
        setup: () => () => h('main', [
          h('h2', { class: 'heading' }, 'Billing'),
          h(MAlert, { closable: true, closeLabel: 'Скрыть', title: 'Card expired', ...props }),
          after ? h('button', { class: 'next' }, 'Next') : null,
        ]),
      })
      current?.unmount()
      current = await mountSuspended(Page, { attachTo: document.body })
      return current as VueWrapper
    }

    it('moves focus to what follows the alert', async () => {
      const wrapper = await mountInPage()
      const close = wrapper.find('.ui-alert__close').element as HTMLElement
      close.focus()

      close.click()
      await nextTick()
      await nextTick()

      expect(document.activeElement).toBe(wrapper.find('.next').element)
    })

    it('falls back to the heading before it, without a Tab stop', async () => {
      const wrapper = await mountInPage({}, false)
      const close = wrapper.find('.ui-alert__close').element as HTMLElement
      close.focus()

      close.click()
      await nextTick()
      await nextTick()

      const heading = wrapper.find('.heading').element as HTMLElement
      expect(document.activeElement).toBe(heading)
      expect(heading.tabIndex).toBe(-1)
    })

    it('leaves focus alone with return-focus off', async () => {
      const wrapper = await mountInPage({ returnFocus: false })
      const close = wrapper.find('.ui-alert__close').element as HTMLElement
      close.focus()

      close.click()
      await nextTick()
      await nextTick()

      expect(document.activeElement).not.toBe(wrapper.find('.next').element)
    })
  })

  describe('actions', () => {
    it('lets an action close the alert and tells it the color', async () => {
      const wrapper = await mount({ color: 'error', closable: true }, {
        actions: ({ color, close }: MAlertActionsSlot) => h('button', { 'class': 'retry', 'data-color': color, 'onClick': close }, 'Retry'),
      })

      expect(wrapper.get('.retry').attributes('data-color')).toBe('error')
      await wrapper.find('.retry').trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })
})
