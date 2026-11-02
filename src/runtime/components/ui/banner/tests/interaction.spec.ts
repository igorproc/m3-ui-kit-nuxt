import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import MBanner from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  current?.unmount()
  current = await mountSuspended(MBanner, { props, slots, global: { stubs: { transition: false } } })
  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-banner · interaction', () => {
  describe('dismissal', () => {
    it('emits close once on explicit dismissal', async () => {
      const wrapper = await mount({ closable: true, closeLabel: 'Скрыть' })

      await wrapper.find('.ui-banner__close').trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
      expect(wrapper.find('.ui-banner').exists()).toBe(false)
    })

    it('hides on an external model change without emitting close', async () => {
      const wrapper = await mount({ modelValue: true, closable: true })

      await wrapper.setProps({ modelValue: false })
      expect(wrapper.find('.ui-banner').exists()).toBe(false)
      expect(wrapper.emitted('close')).toBeUndefined()

      await wrapper.setProps({ modelValue: true })
      expect(wrapper.find('.ui-banner').exists()).toBe(true)
    })

    it('lets the actions slot close the banner', async () => {
      const wrapper = await mount({}, {
        actions: ({ close }: { close: () => void }) => h('button', { class: 'dismiss', onClick: close }, 'Ok'),
      })

      await wrapper.find('.dismiss').trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    // W50: a dismissed banner must not drop focus on <body>.
    it('moves focus to what follows the banner once closed from inside', async () => {
      const Page = defineComponent({
        setup: () => () => h('div', [
          h(MBanner, { closable: true, closeLabel: 'Скрыть', title: 'Sync is off' }),
          h('button', { class: 'next' }, 'Next'),
        ]),
      })
      current?.unmount()
      current = await mountSuspended(Page, { attachTo: document.body })
      const wrapper = current as VueWrapper
      const close = wrapper.find('.ui-banner__close').element as HTMLElement
      close.focus()

      close.click()
      await nextTick()
      await nextTick()

      expect(document.activeElement).toBe(wrapper.find('.next').element)
    })

    it('replaces the close control through the close slot', async () => {
      const wrapper = await mount({ closable: true }, {
        close: ({ props }: { props: Record<string, unknown> }) => h('button', { ...props, class: [props.class, 'custom-close'] }, 'x'),
      })

      expect(wrapper.find('.ui-icon-button').exists()).toBe(false)
      const custom = wrapper.find('.custom-close')
      expect(custom.classes()).toContain('ui-banner__close')

      await custom.trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })
})
