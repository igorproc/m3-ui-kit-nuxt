import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import type { PropType } from 'vue'
import { clickOutside } from './click-outside'

let current: VueWrapper | null = null

const Host = defineComponent({
  props: { handler: { type: Function as PropType<(event: Event) => void>, default: undefined } },
  render() {
    return h('div', { class: 'host' }, [withDirectives(h('div', { class: 'inside' }, [h('button', 'Inner')]), [[clickOutside, this.handler]])])
  },
})

function mountHost(handler: (event: Event) => void) {
  current = mount(Host, { props: { handler }, attachTo: document.body })
  return current
}

function clickOutsideIt() {
  document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('v-click-outside', () => {
  it('calls the handler on a click outside the element', () => {
    const handler = vi.fn()
    mountHost(handler)

    clickOutsideIt()

    expect(handler).toHaveBeenCalledOnce()
  })

  it('ignores a click on the element or inside it', () => {
    const handler = vi.fn()
    const wrapper = mountHost(handler)

    wrapper.find('.inside').element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    wrapper.find('button').element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(handler).not.toHaveBeenCalled()
  })

  // B8.4b: the listener closed over the mount-time binding, so a new handler was never called.
  it('calls the handler it is bound to now, not the one it was mounted with', async () => {
    const first = vi.fn()
    const next = vi.fn()
    const wrapper = mountHost(first)

    await wrapper.setProps({ handler: next })
    clickOutsideIt()

    expect(next).toHaveBeenCalledOnce()
    expect(first).not.toHaveBeenCalled()
  })

  it('stops listening once unmounted', () => {
    const handler = vi.fn()
    const wrapper = mountHost(handler)

    wrapper.unmount()
    current = null
    clickOutsideIt()

    expect(handler).not.toHaveBeenCalled()
  })

  it('renders nothing of its own on the server', () => {
    expect(clickOutside.getSSRProps!({} as never, {} as never)).toEqual({})
  })
})
