import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import MListItem from '../index.vue'
import MList from '../../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MListItem, { props, slots, attrs })

  return current as VueWrapper
}

function countClicks(wrapper: VueWrapper) {
  const counter = { clicks: 0 }
  wrapper.element.addEventListener('click', () => {
    counter.clicks += 1
  })

  return counter
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-list-item · interaction', () => {
  describe('keyboard on an emulated button', () => {
    it.each(['Enter', ' ', 'Spacebar'])('activates on %j', async (key) => {
      const wrapper = await mount({ interactive: true })
      const counter = countClicks(wrapper)

      await wrapper.trigger('keydown', { key })

      expect(counter.clicks).toBe(1)
    })

    it('stops the page from scrolling on Space', async () => {
      const wrapper = await mount({ interactive: true })
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true })

      wrapper.element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })

    it('ignores any other key', async () => {
      const wrapper = await mount({ interactive: true })
      const counter = countClicks(wrapper)

      await wrapper.trigger('keydown', { key: 'a' })
      await wrapper.trigger('keydown', { key: 'ArrowDown' })

      expect(counter.clicks).toBe(0)
    })

    it('does not activate when disabled', async () => {
      const wrapper = await mount({ interactive: true, disabled: true })
      const counter = countClicks(wrapper)

      await wrapper.trigger('keydown', { key: 'Enter' })

      expect(counter.clicks).toBe(0)
    })

    it('leaves a static row deaf to the keyboard', async () => {
      const wrapper = await mount({ headline: 'Static' })
      const counter = countClicks(wrapper)

      await wrapper.trigger('keydown', { key: 'Enter' })

      expect(counter.clicks).toBe(0)
    })
  })

  describe('native button', () => {
    it('leaves keyboard activation to the browser', async () => {
      const wrapper = await mount({ tag: 'button' })
      const counter = countClicks(wrapper)

      await wrapper.trigger('keydown', { key: 'Enter' })

      expect(counter.clicks).toBe(0)
    })

    it('never submits the form it sits in, whatever type it is handed', async () => {
      let submits = 0
      const wrapper = await mountSuspended(defineComponent({
        render: () => h('form', {
          onSubmit: (event: Event) => {
            event.preventDefault()
            submits += 1
          },
        }, [h(MListItem, { tag: 'button', headline: 'Row', type: 'submit' })]),
      }), { attachTo: document.body })
      const row = wrapper.find('button.ui-list-item')

      expect(row.attributes('type')).toBe('button')
      ;(row.element as HTMLButtonElement).click()
      expect(submits).toBe(0)
      wrapper.unmount()
    })
  })

  describe('consumer handlers', () => {
    it('lands a click on the row element inside its li', async () => {
      let clicks = 0
      const wrapper = await mountSuspended(defineComponent({
        render: () => h(MList, null, {
          default: () => h(MListItem, {
            headline: 'Action',
            tag: 'button',
            onClick: () => {
              clicks += 1
            },
          }),
        }),
      }))

      await wrapper.find('button.ui-list-item').trigger('click')

      expect(clicks).toBe(1)
      wrapper.unmount()
    })

    it('merges a consumer keydown with the emulated activation', async () => {
      const keys: string[] = []
      const wrapper = await mount({ interactive: true }, undefined, { onKeydown: (event: KeyboardEvent) => keys.push(event.key) })
      const counter = countClicks(wrapper)

      await wrapper.trigger('keydown', { key: 'Enter' })

      expect(keys).toEqual(['Enter'])
      expect(counter.clicks).toBe(1)
    })
  })

  describe('reactivity', () => {
    it('follows selected as it toggles', async () => {
      const wrapper = await mount({ tag: 'button', selected: true })

      await wrapper.setProps({ selected: false })

      expect(wrapper.classes()).not.toContain('ui-list-item--selected')
      expect(wrapper.attributes('aria-pressed')).toBe('false')
    })

    it('gives a route link its destination back when re-enabled', async () => {
      const disabled = ref(true)
      const wrapper = await mountSuspended(defineComponent({
        render: () => h('div', [h(MListItem, { to: '/archive', disabled: disabled.value })]),
      }))
      expect(wrapper.find('.ui-list-item').attributes('href')).toBeUndefined()

      disabled.value = false
      // NuxtLink resolves asynchronously in the test runtime.
      await flushPromises()

      expect(wrapper.find('.ui-list-item').attributes('href')).toBe('/archive')
      wrapper.unmount()
    })

    it('enters and leaves the tab order with disabled', async () => {
      const wrapper = await mount({ interactive: true })

      await wrapper.setProps({ disabled: true })
      expect(wrapper.attributes('tabindex')).toBe('-1')

      await wrapper.setProps({ disabled: false })
      expect(wrapper.attributes('tabindex')).toBe('0')
    })
  })
})
