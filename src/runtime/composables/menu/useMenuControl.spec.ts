import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { menuItemAttrs, useMenuControl } from './useMenuControl'
import type { UseMenuControlReturn } from './useMenuControl'

let wrapper: VueWrapper | null = null

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

/** Plain markup, no kit component: only the bags make it a menu button. */
function mountMarkup() {
  const open = ref(false)
  const picked: string[] = []
  let control!: UseMenuControlReturn

  const Markup = defineComponent({
    setup() {
      const surface = shallowRef<HTMLElement | null>(null)
      control = useMenuControl({
        open,
        triggerId: 'trigger',
        menuId: () => 'menu',
        surface: () => surface.value,
        fallbackReturn: () => document.getElementById('trigger'),
      })
      const item = (name: string, state = {}) =>
        h('div', { ...control.getItemAttrs(state), onClick: () => picked.push(name) }, name)

      return () => h('div', [
        h('button', control.triggerAttrs.value, 'Actions'),
        open.value
          ? h('div', { ref: surface, ...control.menuAttrs.value }, [
              item('Copy'),
              item('Cut', { disabled: true }),
              h('div', 'Not an item'),
              item('Grid', { role: 'menuitemcheckbox', checked: true }),
            ])
          : null,
        h('button', { class: 'after' }, 'After'),
      ])
    },
  })

  wrapper = mount(Markup, { attachTo: document.body })
  return { open, picked, control }
}

const trigger = () => document.getElementById('trigger')!
const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role^="menuitem"]'))

function press(key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  document.activeElement!.dispatchEvent(event)
  return event
}

async function settle() {
  await nextTick()
  await nextTick()
}

const leaksPresentation = (bag: object) => Object.keys(bag).filter(key => key === 'class' || key.startsWith('data-'))

describe('useMenuControl', () => {
  describe('bags', () => {
    it('hands out no class and no data-* attribute', async () => {
      const { open, control } = mountMarkup()
      open.value = true
      await settle()

      expect(leaksPresentation(control.triggerAttrs.value)).toEqual([])
      expect(leaksPresentation(control.menuAttrs.value)).toEqual([])
      expect(leaksPresentation(control.getItemAttrs({ role: 'menuitemradio', checked: true, disabled: true }))).toEqual([])
    })

    it('makes the trigger a closed menu button that controls nothing yet', () => {
      mountMarkup()

      expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().hasAttribute('aria-controls')).toBe(false)
    })

    it('names the open menu by the trigger, which controls it', async () => {
      const { open } = mountMarkup()
      open.value = true
      await settle()
      const menu = document.getElementById('menu')!

      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(trigger().getAttribute('aria-controls')).toBe('menu')
      expect(menu.getAttribute('role')).toBe('menu')
      expect(menu.getAttribute('tabindex')).toBe('-1')
      expect(menu.getAttribute('aria-labelledby')).toBe('trigger')
    })
  })

  describe('items', () => {
    it.each([
      [{}, { 'role': 'menuitem', 'tabindex': -1, 'aria-checked': undefined, 'aria-disabled': undefined }],
      [{ disabled: true }, { 'role': 'menuitem', 'tabindex': -1, 'aria-checked': undefined, 'aria-disabled': 'true' }],
      [{ role: 'menuitemcheckbox', checked: true }, { 'role': 'menuitemcheckbox', 'tabindex': -1, 'aria-checked': 'true', 'aria-disabled': undefined }],
      [{ role: 'menuitemradio' }, { 'role': 'menuitemradio', 'tabindex': -1, 'aria-checked': 'false', 'aria-disabled': undefined }],
      [{ role: 'menuitem', checked: true }, { 'role': 'menuitem', 'tabindex': -1, 'aria-checked': undefined, 'aria-disabled': undefined }],
    ] as const)('%o → %o', (state, attrs) => {
      expect(menuItemAttrs(state)).toEqual(attrs)
    })

    it('writes nothing onto markup that does not bind a bag', async () => {
      const { open } = mountMarkup()
      open.value = true
      await settle()
      const plain = Array.from(document.getElementById('menu')!.children).find(el => el.textContent === 'Not an item')!

      expect(plain.hasAttribute('role')).toBe(false)
      expect(plain.hasAttribute('tabindex')).toBe(false)
    })
  })

  describe('trigger', () => {
    it('toggles on a click and focuses the first item', async () => {
      const { open } = mountMarkup()

      trigger().click()
      await settle()
      expect(open.value).toBe(true)
      expect(document.activeElement).toBe(items()[0])

      trigger().click()
      await settle()
      expect(open.value).toBe(false)
    })

    it.each([
      ['ArrowDown', 'Copy'],
      ['ArrowUp', 'Grid'],
    ])('opens on %s with focus on %s', async (key, name) => {
      const { open } = mountMarkup()
      trigger().focus()

      expect(press(key).defaultPrevented).toBe(true)
      await settle()

      expect(open.value).toBe(true)
      expect(document.activeElement?.textContent).toBe(name)
    })
  })

  describe('menu keys', () => {
    async function opened() {
      const result = mountMarkup()
      trigger().focus()
      press('ArrowDown')
      await settle()
      return result
    }

    it('walks the items, disabled included, and wraps at the ends', async () => {
      await opened()
      const [copy, cut, grid] = items()

      press('ArrowDown')
      expect(document.activeElement).toBe(cut)
      press('ArrowDown')
      expect(document.activeElement).toBe(grid)
      press('ArrowDown')
      expect(document.activeElement).toBe(copy)
      press('ArrowUp')
      expect(document.activeElement).toBe(grid)
      press('Home')
      expect(document.activeElement).toBe(copy)
      press('End')
      expect(document.activeElement).toBe(grid)
    })

    it('jumps to an item by its first letter', async () => {
      await opened()

      press('g')

      expect(document.activeElement).toBe(items()[2])
    })

    it('closes on Escape and gives focus back to the trigger', async () => {
      const { open } = await opened()

      press('Escape')
      await settle()

      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(trigger())
    })

    it('closes on Tab and lets the browser move on from the trigger', async () => {
      const { open } = await opened()

      const event = press('Tab')
      await settle()

      expect(event.defaultPrevented).toBe(false)
      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(trigger())
    })

    it('swallows the click of a disabled item', async () => {
      const { picked } = await opened()

      items()[1]!.click()
      items()[0]!.click()

      expect(picked).toEqual(['Copy'])
    })
  })

  describe('foreign widget', () => {
    it('leaves focus and keys to a listbox it hosts', () => {
      const surface = document.createElement('div')
      surface.innerHTML = '<div role="listbox"><div role="option">One</div></div>'
      const control = useMenuControl({
        open: ref(false),
        triggerId: 't',
        menuId: () => 'm',
        surface: () => surface,
        fallbackReturn: () => null,
      })

      expect(control.hostsForeignWidget()).toBe(true)
    })
  })
})
