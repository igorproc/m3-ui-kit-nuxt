import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MTabs from '../index.vue'
import type { MTabItem } from '../props'

const items: MTabItem[] = ['a', 'b', 'c', 'd'].map(value => ({ value, label: value.toUpperCase() }))

let current: { unmount: () => void } | null = null

// Attached: a detached element computes no direction and takes no focus.
async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MTabs, { props: { items, ariaLabel: 'Sections', ...props }, attachTo: document.body })

  return current as VueWrapper
}

async function press(wrapper: VueWrapper, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  wrapper.find('[role="tablist"]').element.dispatchEvent(event)
  await nextTick()
  await nextTick()

  return event
}

const lastModel = (wrapper: VueWrapper) => wrapper.emitted('update:modelValue')?.at(-1)?.[0]

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-tabs · keyboard', () => {
  describe('arrows (automatic activation)', () => {
    it.each([
      ['ArrowRight', 'b', 'c'],
      ['ArrowLeft', 'b', 'a'],
    ])('%s from %s selects %s', async (key, from, to) => {
      const wrapper = await mount({ modelValue: from })

      await press(wrapper, key)

      expect(lastModel(wrapper)).toBe(to)
    })

    it.each([
      ['ArrowRight', 'd', 'a'],
      ['ArrowLeft', 'a', 'd'],
    ])('%s wraps around from %s to %s', async (key, from, to) => {
      const wrapper = await mount({ modelValue: from })

      await press(wrapper, key)

      expect(lastModel(wrapper)).toBe(to)
    })

    it('skips a disabled tab', async () => {
      const wrapper = await mount({ items: [items[0]!, { ...items[1]!, disabled: true }, items[2]!], modelValue: 'a' })

      await press(wrapper, 'ArrowRight')

      expect(lastModel(wrapper)).toBe('c')
    })

    it('moves DOM focus onto the newly selected tab', async () => {
      const wrapper = await mount({ modelValue: 'a' })

      await press(wrapper, 'ArrowRight')

      expect(document.activeElement).toBe(wrapper.findAll('[role="tab"]')[1]!.element)
    })

    // B5.9a: in RTL the next tab lies to the left.
    it('swaps ArrowLeft and ArrowRight in a right-to-left tablist', async () => {
      const wrapper = await mount({ modelValue: 'b' })
      ;(wrapper.find('[role="tablist"]').element as HTMLElement).style.direction = 'rtl'

      await press(wrapper, 'ArrowLeft')
      expect(lastModel(wrapper)).toBe('c')

      await press(wrapper, 'ArrowRight')
      await press(wrapper, 'ArrowRight')
      expect(lastModel(wrapper)).toBe('a')
    })
  })

  describe('edges', () => {
    it.each([
      ['Home', 'c', 'a'],
      ['End', 'b', 'd'],
    ])('%s jumps from %s to %s', async (key, from, to) => {
      const wrapper = await mount({ modelValue: from })

      await press(wrapper, key)

      expect(lastModel(wrapper)).toBe(to)
    })

    it('lands Home and End on enabled tabs', async () => {
      const wrapper = await mount({
        items: [{ ...items[0]!, disabled: true }, items[1]!, items[2]!, { ...items[3]!, disabled: true }],
        modelValue: 'b',
      })

      await press(wrapper, 'End')
      expect(lastModel(wrapper)).toBe('c')

      await press(wrapper, 'Home')
      expect(lastModel(wrapper)).toBe('b')
    })
  })

  // A focus target equal to the last one used to be ignored: the tab watched a
  // value that had not changed, so focus stayed where the pointer had left it.
  describe('focus', () => {
    it('focuses the target even when the keyboard aimed at it last time', async () => {
      const wrapper = await mount({ modelValue: 'a' })
      const tabs = wrapper.findAll('[role="tab"]')

      await press(wrapper, 'End')
      expect(document.activeElement).toBe(tabs[3]!.element)

      await tabs[0]!.trigger('click')
      ;(tabs[0]!.element as HTMLElement).focus()
      await press(wrapper, 'End')

      expect(document.activeElement).toBe(tabs[3]!.element)
    })
  })

  describe('default handling', () => {
    it.each(['ArrowRight', 'ArrowLeft', 'Home', 'End'])('prevents the page from scrolling on %s', async (key) => {
      const wrapper = await mount({ modelValue: 'b' })

      expect((await press(wrapper, key)).defaultPrevented).toBe(true)
    })

    it.each(['ArrowDown', 'ArrowUp', 'Tab', 'Enter', 'a'])('leaves %s to the browser', async (key) => {
      const wrapper = await mount({ modelValue: 'b' })
      const event = await press(wrapper, key)

      expect(event.defaultPrevented).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })
})
