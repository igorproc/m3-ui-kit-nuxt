import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { ripple } from './ripple'

let current: VueWrapper | null = null

function mountRipple(value?: unknown) {
  const Host = defineComponent({
    render: () => withDirectives(h('button', { type: 'button' }, 'Save'), [[ripple, value]]),
  })
  current = mount(Host, { attachTo: document.body })
  return current
}

function press(wrapper: VueWrapper, key: string) {
  const button = wrapper.element as HTMLElement
  button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  const shown = button.querySelectorAll('.ui-ripple__container').length
  button.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  return shown
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('v-ripple', () => {
  describe('keyboard', () => {
    it('ripples on Enter', () => {
      expect(press(mountRipple(), 'Enter')).toBe(1)
    })

    // B8.4a: the default listed `'Space'`, but a Space keydown reports `key: ' '`.
    it('ripples on Space', () => {
      expect(press(mountRipple(), ' ')).toBe(1)
    })

    it('ignores other keys', () => {
      expect(press(mountRipple(), 'a')).toBe(0)
    })

    it('keeps a key held on one element from muting the next element', () => {
      const first = mountRipple()
      first.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      first.unmount()

      expect(press(mountRipple(), 'Enter')).toBe(1)
    })

    it('takes its own keys, and reads a passed `Space` as the Space key', () => {
      expect(press(mountRipple({ keys: ['Space'] }), ' ')).toBe(1)
      current?.unmount()
      expect(press(mountRipple({ keys: ['Space'] }), 'Enter')).toBe(0)
    })
  })

  describe('pointer', () => {
    it('ripples on a press', () => {
      const wrapper = mountRipple()

      wrapper.element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

      expect(wrapper.element.querySelectorAll('.ui-ripple__container')).toHaveLength(1)
    })

    it('does not ripple while disabled through its value', () => {
      const wrapper = mountRipple(false)

      wrapper.element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

      expect(wrapper.element.querySelectorAll('.ui-ripple__container')).toHaveLength(0)
    })
  })

  it('renders nothing of its own on the server', () => {
    expect(ripple.getSSRProps()).toEqual({})
  })
})
