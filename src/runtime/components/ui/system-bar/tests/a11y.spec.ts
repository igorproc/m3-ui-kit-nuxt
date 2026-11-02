import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MSystemBar from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(options: Parameters<typeof mountSuspended>[1] = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MSystemBar, options)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-system-bar · a11y', () => {
  // A status strip changes often (clock, signal): an implicit live region would announce every tick.
  it('is a generic box: no role and no live region of its own', async () => {
    const wrapper = await mount({ slots: { default: () => '12:30' } })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-live')).toBeUndefined()
  })

  it('takes a role and a name from the app when the strip carries status worth announcing', async () => {
    const wrapper = await mount({ attrs: { 'role': 'status', 'aria-label': 'Device status' } })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('Device status')
  })

  it('keeps the text readable in the accessibility tree: truncation is visual only', async () => {
    const wrapper = await mount({ slots: { default: () => 'Connected to Office Wi-Fi' } })
    const text = wrapper.find('.ui-system-bar__text')

    expect(text.text()).toBe('Connected to Office Wi-Fi')
    expect(text.attributes('aria-hidden')).toBeUndefined()
  })

  it('leaves the icon parts to the app: an icon with a name stays named', async () => {
    const wrapper = await mount({
      slots: { prepend: () => h('span', { 'role': 'img', 'aria-label': 'Battery 80%' }) },
    })

    expect(wrapper.find('.ui-system-bar__prepend [role="img"]').attributes('aria-label')).toBe('Battery 80%')
    expect(wrapper.find('.ui-system-bar__prepend').attributes('aria-hidden')).toBeUndefined()
  })
})
