import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'
import MSplitButton from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

const menu = () => h(MMenuItem, { label: 'Save as draft' })

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots: Slots = { default: () => 'Save' }, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MSplitButton, { props: { trailingAriaLabel: 'More', ...props }, slots, attrs })

  return current as VueWrapper
}

const action = (wrapper: VueWrapper) => wrapper.find('.ui-split-button__action')
const trailing = (wrapper: VueWrapper) => wrapper.find('.ui-split-button__trailing')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-split · interaction', () => {
  describe('action', () => {
    it('emits click when the main action is pressed', async () => {
      const wrapper = await mount()

      await action(wrapper).trigger('click')

      expect(wrapper.emitted('click')).toHaveLength(1)
      expect(wrapper.emitted('trailing')).toBeUndefined()
    })

    it('makes the main button a submit button and keeps the trailing one a plain button', async () => {
      const wrapper = await mount({ type: 'submit' })

      expect(action(wrapper).attributes('type')).toBe('submit')
      expect(trailing(wrapper).attributes('type')).toBe('button')
    })

    it('makes the main button a link to its route', async () => {
      const wrapper = await mount({ tag: 'link', to: '/orders' })

      expect(wrapper.find('a.ui-split-button__action').attributes('href')).toBe('/orders')
    })
  })

  describe('trailing', () => {
    it('emits trailing when the trailing button is pressed', async () => {
      const wrapper = await mount()

      await trailing(wrapper).trigger('click')

      expect(wrapper.emitted('trailing')).toHaveLength(1)
      expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('opens and closes the menu from the trailing button', async () => {
      const wrapper = await mount({}, { default: () => 'Save', menu })

      await trailing(wrapper).trigger('click')
      expect(trailing(wrapper).attributes('aria-expanded')).toBe('true')

      await trailing(wrapper).trigger('click')
      expect(trailing(wrapper).attributes('aria-expanded')).toBe('false')
      expect(wrapper.emitted('trailing')).toHaveLength(2)
    })
  })

  describe('disabled and loading', () => {
    it('does nothing on either button while disabled', async () => {
      const wrapper = await mount({ disabled: true }, { default: () => 'Save', menu })

      await action(wrapper).trigger('click')
      await trailing(wrapper).trigger('click')

      expect(wrapper.emitted('click')).toBeUndefined()
      expect(wrapper.emitted('trailing')).toBeUndefined()
      expect(trailing(wrapper).attributes('aria-expanded')).toBe('false')
    })

    it('does nothing on either button while the action loads', async () => {
      const wrapper = await mount({ loading: true }, { default: () => 'Save', menu })

      await action(wrapper).trigger('click')
      await trailing(wrapper).trigger('click')

      expect(wrapper.emitted('click')).toBeUndefined()
      expect(wrapper.emitted('trailing')).toBeUndefined()
      expect(trailing(wrapper).attributes('aria-expanded')).toBe('false')
    })
  })

  describe('attributes', () => {
    it('puts class and style on the root and every other attribute on the main button', async () => {
      const wrapper = await mount({}, undefined, { 'class': 'extra', 'style': 'margin: 1px', 'aria-describedby': 'hint', 'data-x': '1' })
      const root = wrapper.find('.ui-split-button')

      expect(root.classes()).toContain('extra')
      expect(root.attributes('style')).toContain('margin')
      expect(root.attributes('aria-describedby')).toBeUndefined()
      expect(action(wrapper).attributes('aria-describedby')).toBe('hint')
      expect(action(wrapper).attributes('data-x')).toBe('1')
      expect(trailing(wrapper).attributes('data-x')).toBeUndefined()
    })
  })

  // The menu is built from MMenuItem: each row is a menuitem, and a disabled one stays in
  // the arrow order (`aria-disabled`) while its activation does nothing.
  describe('menu items', () => {
    const items = (picked: string[]) => ({ close }: { close: () => void }) => [
      h(MMenuItem, {
        label: 'Save as draft',
        onSelect: () => {
          picked.push('draft')
          close()
        },
      }),
      h(MMenuItem, { label: 'Save as template', disabled: true, onSelect: () => picked.push('template') }),
    ]
    const rows = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-menu__surface .ui-menu__item'))

    async function openMenu(picked: string[]) {
      current?.unmount()
      current = await mountSuspended(MSplitButton, {
        props: { trailingAriaLabel: 'More' },
        slots: { default: () => 'Save', menu: items(picked) },
        attachTo: document.body,
      })
      const wrapper = current as VueWrapper
      await trailing(wrapper).trigger('click')
      await nextTick()
      await nextTick()
      return wrapper
    }

    it('keeps a disabled row in the arrow order', async () => {
      await openMenu([])

      rows()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

      expect(document.activeElement).toBe(rows()[1])
    })

    it('does nothing on a disabled row, and picks and closes on an enabled one', async () => {
      const picked: string[] = []
      const wrapper = await openMenu(picked)

      rows()[1]!.click()
      expect(picked).toEqual([])
      expect(trailing(wrapper).attributes('aria-expanded')).toBe('true')

      rows()[0]!.click()
      await nextTick()
      expect(picked).toEqual(['draft'])
      expect(trailing(wrapper).attributes('aria-expanded')).toBe('false')
    })
  })
})
