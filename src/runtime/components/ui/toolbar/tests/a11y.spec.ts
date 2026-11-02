import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MToolbar from '../index.vue'
import type { MToolbarItem, MToolbarOrientation } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MToolbar, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const AB: MToolbarItem[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]

const pressedOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-toolbar__item').map(item => item.attributes('aria-pressed'))

const ABC: MToolbarItem[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
const moreButton = (wrapper: VueWrapper) => wrapper.find('.ui-toolbar__overflow .ui-icon-button')
const menuItems = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.ui-toolbar__menu-item'))

async function openMore(wrapper: VueWrapper) {
  await moreButton(wrapper).trigger('click')
  await flushPromises()
}

describe('m-toolbar · a11y', () => {
  describe('role and name', () => {
    it('is a toolbar', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('role')).toBe('toolbar')
    })

    it('takes its name from ariaLabel', async () => {
      const wrapper = await mount({ ariaLabel: 'Formatting' })

      expect(wrapper.attributes('aria-label')).toBe('Formatting')
    })

    it('ships no name of its own: the kit has no copy to put there', async () => {
      const wrapper = await mount()

      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest resolves to `false`.
  })

  describe('orientation', () => {
    it.each<[MToolbarOrientation, string | undefined]>([
      ['horizontal', undefined],
      ['vertical', 'vertical'],
    ])('a %s toolbar says aria-orientation=%s (horizontal is implicit)', async (orientation, announced) => {
      const wrapper = await mount({ ariaLabel: 'Tools', orientation })

      expect(wrapper.attributes('aria-orientation')).toBe(announced)
    })
  })

  describe('pressed state', () => {
    it('a plain action is no toggle: no aria-pressed', async () => {
      const wrapper = await mount({ items: AB })

      expect(pressedOf(wrapper)).toEqual([undefined, undefined])
    })

    it('reflects a legacy `selected` flag, so the fill is not the only signal', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A', selected: true }, { id: 'b', label: 'B', selected: false }, { id: 'c', label: 'C' }] })

      expect(pressedOf(wrapper)).toEqual(['true', 'false', undefined])
    })

    it('marks every item of a single model as a toggle', async () => {
      const wrapper = await mount({ items: AB, modelValue: 'b' })

      expect(pressedOf(wrapper)).toEqual(['false', 'true'])
    })

    it('marks every item of a multiple model as a toggle', async () => {
      const wrapper = await mount({ items: AB, modelValue: ['a'], multiple: true })

      expect(pressedOf(wrapper)).toEqual(['true', 'false'])
    })

    it('ships the preset pressed state in the server HTML', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MToolbar, { ariaLabel: 'View', items: AB, modelValue: 'b' }),
      }))

      expect(html.match(/aria-pressed="(true|false)"/g)).toEqual(['aria-pressed="false"', 'aria-pressed="true"'])
    })
  })

  describe('more menu', () => {
    it('names the "more" button by moreLabel: the kit ships no copy of its own', async () => {
      const named = await mount({ items: ABC, maxVisible: 1, moreLabel: 'Ещё' })
      expect(moreButton(named).attributes('aria-label')).toBe('Ещё')

      const unnamed = await mount({ items: ABC, maxVisible: 1 })
      expect(moreButton(unnamed).attributes('aria-label')).toBeUndefined()
    })

    it('announces a menu popup and its open state', async () => {
      const wrapper = await mount({ items: ABC, maxVisible: 1, moreLabel: 'More' })

      expect(moreButton(wrapper).attributes('aria-haspopup')).toBe('menu')
      expect(moreButton(wrapper).attributes('aria-expanded')).toBe('false')

      await openMore(wrapper)
      expect(moreButton(wrapper).attributes('aria-expanded')).toBe('true')
    })

    it('hides the "more" glyph: the label names the button', async () => {
      const wrapper = await mount({ items: ABC, maxVisible: 1, moreLabel: 'More' })

      expect(moreButton(wrapper).find('.ui-icon').attributes('aria-hidden')).toBe('true')
    })

    it.each<[string, Record<string, unknown>, string, string | undefined]>([
      ['plain actions', {}, 'menuitem', undefined],
      ['a single model', { modelValue: 'b' }, 'menuitemradio', 'true'],
      ['a multiple model', { modelValue: ['b'], multiple: true }, 'menuitemcheckbox', 'true'],
    ])('turns the hidden items of %s into %s', async (_, props, role, checked) => {
      const wrapper = await mount({ items: ABC, maxVisible: 1, moreLabel: 'More', ...props })

      await openMore(wrapper)
      const [b, c] = menuItems()

      expect(b!.getAttribute('role')).toBe(role)
      expect(b!.getAttribute('aria-checked') ?? undefined).toBe(checked)
      expect(c!.getAttribute('aria-checked') ?? undefined).toBe(checked && 'false')
    })

    it('keeps a legacy toggle checkable in the menu', async () => {
      const wrapper = await mount({ items: [ABC[0]!, { id: 'b', label: 'B', selected: true }], maxVisible: 1, moreLabel: 'More' })

      await openMore(wrapper)

      expect(menuItems()[0]!.getAttribute('role')).toBe('menuitemcheckbox')
      expect(menuItems()[0]!.getAttribute('aria-checked')).toBe('true')
    })

    it('names an icon-only hidden item by its ariaLabel', async () => {
      const wrapper = await mount({ items: [ABC[0]!, { id: 'bold', icon: 'format-bold', ariaLabel: 'Bold' }], maxVisible: 1, moreLabel: 'More' })

      await openMore(wrapper)

      expect(menuItems()[0]!.textContent?.trim()).toBe('Bold')
    })

    it('keeps a disabled hidden item in the menu as aria-disabled', async () => {
      const wrapper = await mount({ items: [ABC[0]!, { id: 'b', label: 'B', disabled: true }], maxVisible: 1, moreLabel: 'More' })

      await openMore(wrapper)

      expect(menuItems()[0]!.getAttribute('aria-disabled')).toBe('true')
      expect(menuItems()[0]!.disabled).toBe(false)
    })

    it('renders no menu on the server: the "more" button is there, closed', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MToolbar, { ariaLabel: 'Edit', items: ABC, maxVisible: 1, moreLabel: 'More' }),
      }))

      expect(html).toContain('aria-haspopup="menu"')
      expect(html).toContain('aria-expanded="false"')
      expect(html).not.toContain('ui-toolbar__menu-item')
    })
  })

  describe('items', () => {
    it('names an icon-only item through its ariaLabel', async () => {
      const wrapper = await mount({ items: [{ id: 'bold', icon: 'format-bold', ariaLabel: 'Bold' }] })

      expect(wrapper.find('.ui-icon-button').attributes('aria-label')).toBe('Bold')
    })

    it('hides the icon of a labelled item: the label names it', async () => {
      const wrapper = await mount({ items: [{ id: 'bold', icon: 'format-bold', label: 'Bold' }] })

      expect(wrapper.find('.ui-button .ui-icon').attributes('aria-hidden')).toBe('true')
    })

    it('uses native buttons', async () => {
      const wrapper = await mount({ items: AB })

      for (const item of wrapper.findAll('.ui-button')) {
        expect(item.element.tagName).toBe('BUTTON')
        expect(item.attributes('role')).toBeUndefined()
      }
    })

    it('disables a disabled item natively', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A', disabled: true }] })

      expect(wrapper.find('.ui-button').attributes('disabled')).toBeDefined()
    })
  })
})
