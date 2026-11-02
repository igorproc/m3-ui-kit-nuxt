import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MExpansionPanel from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MExpansionPanel, { props, slots, attrs: { ...attrs }, attachTo: document.body })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-expansion-panel · interaction', () => {
  describe('model', () => {
    it('opens on header click', async () => {
      const wrapper = await mount({ title: 'X', modelValue: false })

      await wrapper.find('.ui-expansion-panel__header').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
    })

    it('closes an open panel on header click', async () => {
      const wrapper = await mount({ title: 'X', modelValue: true })

      await wrapper.find('.ui-expansion-panel__header').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
    })

    it('toggles itself without a bound model', async () => {
      const wrapper = await mount({ title: 'X' })

      await wrapper.find('.ui-expansion-panel__header').trigger('click')

      expect(wrapper.classes()).toContain('ui-expansion-panel--expanded')
      expect(wrapper.find('.ui-expansion-panel__header').attributes('aria-expanded')).toBe('true')
    })

    it('follows a model changed from outside', async () => {
      const wrapper = await mount({ title: 'X', modelValue: false })

      await wrapper.setProps({ modelValue: true })

      expect(wrapper.classes()).toContain('ui-expansion-panel--expanded')
    })

    it('runs the consumer click handler on the header button too', async () => {
      let clicks = 0
      const wrapper = await mount({ title: 'X' }, undefined, {
        onClick: () => {
          clicks += 1
        },
      })

      await wrapper.find('.ui-expansion-panel__header').trigger('click')

      expect(clicks).toBe(1)
    })
  })

  describe('disabled', () => {
    it('suppresses the toggle', async () => {
      const wrapper = await mount({ title: 'X', modelValue: false, disabled: true })

      await wrapper.find('.ui-expansion-panel__header').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('focus', () => {
    it('moves focus from collapsing content to the header, instead of dropping it on body', async () => {
      const open = ref(true)
      const wrapper = await mountSuspended(defineComponent({
        render: () => h(MExpansionPanel, {
          'title': 'X',
          'modelValue': open.value,
          'onUpdate:modelValue': (value: boolean) => {
            open.value = value
          },
        }, () => h('a', { href: '#field', class: 'inner' }, 'Field')),
      }), { attachTo: document.body })
      ;(wrapper.find('.inner').element as HTMLElement).focus()
      expect(document.activeElement).toBe(wrapper.find('.inner').element)

      open.value = false
      await nextTick()

      expect(document.activeElement).toBe(wrapper.find('.ui-expansion-panel__header').element)
      wrapper.unmount()
    })

    it('leaves focus elsewhere alone when it closes', async () => {
      const outside = document.createElement('button')
      document.body.append(outside)
      const wrapper = await mount({ title: 'X', modelValue: true })
      outside.focus()

      await wrapper.setProps({ modelValue: false })

      expect(document.activeElement).toBe(outside)
      outside.remove()
    })
  })

  describe('server render', () => {
    it('draws a preset open panel open in the first paint', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MExpansionPanel, { title: 'X', modelValue: true }, () => 'Body') }))

      expect(html).toContain('ui-expansion-panel--expanded')
      expect(html).toContain('aria-expanded="true"')
      expect(html).not.toMatch(/role="region"[^>]*inert/)
    })

    it('ships the ids that tie button and region together', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MExpansionPanel, { title: 'X' }) }))
      const controls = html.match(/aria-controls="([^"]+)"/)?.[1]

      expect(controls).toBeTruthy()
      expect(html).toContain(`id="${controls}"`)
    })
  })
})
