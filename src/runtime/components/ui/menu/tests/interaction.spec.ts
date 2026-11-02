import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import MMenu from '../index.vue'
import MMenuItem from '../item/index.vue'
import { keydown, mountTracked, settle, useOverlayHost } from '../../overlay/tests/helpers'
import { clicks, menuItems, mountMenu, mountWithActivator, openMenu, surface, triggerEl, withDisabled } from './helpers'

useOverlayHost()

const press = (key: string, init: KeyboardEventInit = {}) => keydown(document.activeElement!, key, init)

function pointerClick(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  ;(el as HTMLElement).click()
}

describe('m-menu · interaction', () => {
  describe('opening', () => {
    it('focuses the first item when it opens', async () => {
      const { open } = await mountMenu()
      await openMenu(open)

      expect(document.activeElement).toBe(menuItems()[0])
    })

    it('leaves focus in a hosted listbox instead of taking it', async () => {
      const { open } = await mountMenu({}, () => h('div', { role: 'listbox' }, [h('div', { role: 'option' }, 'One')]))
      triggerEl().focus()
      await openMenu(open)

      expect(document.activeElement).toBe(triggerEl())
    })
  })

  describe('arrow keys', () => {
    it('moves between items with ArrowDown / ArrowUp, wrapping at the ends', async () => {
      const { open } = await mountMenu()
      await openMenu(open)
      const [first, second, third] = menuItems()

      press('ArrowDown')
      expect(document.activeElement).toBe(second)
      press('ArrowDown')
      press('ArrowDown')
      expect(document.activeElement).toBe(first)
      press('ArrowUp')
      expect(document.activeElement).toBe(third)
    })

    it('jumps to the ends with Home / End', async () => {
      const { open } = await mountMenu()
      await openMenu(open)
      const [first, , third] = menuItems()

      press('End')
      expect(document.activeElement).toBe(third)
      press('Home')
      expect(document.activeElement).toBe(first)
    })

    it('prevents the page from scrolling on the navigation keys', async () => {
      const { open } = await mountMenu()
      await openMenu(open)

      for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End'])
        expect(press(key).defaultPrevented).toBe(true)
    })

    it('keeps a disabled item in the arrow order', async () => {
      const { open } = await mountMenu({}, withDisabled)
      await openMenu(open)

      press('ArrowDown')

      expect(document.activeElement).toBe(menuItems()[1])
    })
  })

  describe('typeahead', () => {
    it('jumps to the next item starting with the typed letter', async () => {
      const { open } = await mountMenu()
      await openMenu(open)

      press('g')

      expect(document.activeElement).toBe(menuItems()[2])
    })

    it('cycles through items sharing a first letter', async () => {
      const { open } = await mountMenu({}, () => [
        h(MMenuItem, { label: 'Copy' }),
        h(MMenuItem, { label: 'Cut' }),
        h(MMenuItem, { label: 'Paste' }),
      ])
      await openMenu(open)

      press('c')
      expect(document.activeElement).toBe(menuItems()[1])
      press('c')
      expect(document.activeElement).toBe(menuItems()[0])
    })

    it('leaves Space to activate the item when no word is being typed', async () => {
      const { open } = await mountMenu()
      await openMenu(open)

      expect(press(' ').defaultPrevented).toBe(false)
    })
  })

  describe('closing', () => {
    it('closes on Escape and returns focus to the trigger', async () => {
      const { open } = await mountMenu()
      triggerEl().focus()
      await openMenu(open)

      press('Escape')
      await settle()

      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(triggerEl())
    })

    // Safari does not focus a clicked button: the menu opens with focus on <body>.
    it('returns focus to the trigger when nothing had it before opening', async () => {
      const { open } = await mountMenu()
      ;(document.activeElement as HTMLElement | null)?.blur()
      await openMenu(open)

      press('Escape')
      await settle()

      expect(document.activeElement).toBe(triggerEl())
    })

    it('returns focus to where it was, not to an explicit anchor', async () => {
      const anchor = document.createElement('div')
      document.body.appendChild(anchor)
      const { open } = await mountMenu({ anchor })
      triggerEl().focus()
      await openMenu(open)

      press('Escape')
      await settle()

      expect(document.activeElement).toBe(triggerEl())
      anchor.remove()
    })

    it('returns focus to the trigger once an item closes it', async () => {
      const { open } = await mountMenu()
      triggerEl().focus()
      await openMenu(open)

      menuItems()[1]!.click()
      open.value = false
      await settle()

      expect(clicks).toEqual(['Beta'])
      expect(document.activeElement).toBe(triggerEl())
    })

    // APG: Tab leaves the menu for the next element after the trigger.
    it('closes on Tab and lets the browser move on from the trigger', async () => {
      const { open } = await mountMenu()
      triggerEl().focus()
      await openMenu(open)

      const event = press('Tab')
      await settle()

      expect(event.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(triggerEl())
      expect(open.value).toBe(false)
    })

    it('closes on Shift+Tab with focus on the trigger', async () => {
      const { open } = await mountMenu()
      triggerEl().focus()
      await openMenu(open)

      const event = press('Tab', { shiftKey: true })
      await settle()

      expect(event.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(triggerEl())
      expect(open.value).toBe(false)
    })

    it('removes the surface once closed', async () => {
      const { open } = await mountMenu({ modelValue: true })

      open.value = false
      await settle()

      expect(surface()).toBeNull()
    })
  })

  describe('disabled items', () => {
    it('swallows the click of a disabled item', async () => {
      const { open } = await mountMenu({}, withDisabled)
      await openMenu(open)

      menuItems()[1]!.click()

      expect(clicks).toEqual([])
    })
  })

  describe('outside', () => {
    it('emits click-outside and closes on a press outside it', async () => {
      const { open, outside } = await mountMenu({ modelValue: true })

      pointerClick(document.querySelector('.after')!)
      await nextTick()

      expect(outside.length).toBeGreaterThan(0)
      expect(open.value).toBe(false)
    })

    it('only reports the outside press with close-on-backdrop off', async () => {
      const { open, outside } = await mountMenu({ modelValue: true, closeOnBackdrop: false })

      pointerClick(document.querySelector('.after')!)
      await nextTick()

      expect(outside.length).toBeGreaterThan(0)
      expect(open.value).toBe(true)
    })

    it('leaves focus where an outside press put it', async () => {
      const { open } = await mountMenu()
      await openMenu(open)
      const after = document.querySelector<HTMLElement>('.after')!

      after.focus()
      pointerClick(after)
      await settle()

      expect(document.activeElement).toBe(after)
    })

    it('ignores a press on its own trigger, so the trigger can toggle it', async () => {
      const { open } = await mountMenu({ modelValue: true })

      pointerClick(triggerEl())
      await nextTick()

      expect(open.value).toBe(false)
    })
  })

  describe('listeners', () => {
    function trackDocumentListeners(type: string) {
      const live = new Set<EventListenerOrEventListenerObject>()
      const add = document.addEventListener.bind(document)
      const remove = document.removeEventListener.bind(document)
      document.addEventListener = ((event: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (event === type) live.add(listener)
        add(event, listener, options)
      }) as typeof document.addEventListener
      document.removeEventListener = ((event: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
        if (event === type) live.delete(listener)
        remove(event, listener, options)
      }) as typeof document.removeEventListener
      const restore = () => {
        document.addEventListener = add
        document.removeEventListener = remove
      }
      return { live, restore }
    }

    // EN-10: a page of closed menus ran every one of their outside handlers on each press.
    it('listens for outside presses only while open', async () => {
      const tracked = trackDocumentListeners('pointerdown')
      const { open } = await mountMenu()
      const closed = tracked.live.size

      await openMenu(open)
      expect(tracked.live.size).toBeGreaterThan(closed)

      open.value = false
      await nextTick()
      expect(tracked.live.size).toBe(closed)
      tracked.restore()
    })
  })

  describe('scroll lock', () => {
    it('locks page scroll while open and releases it on close', async () => {
      const { open } = await mountMenu()

      await openMenu(open)
      expect(document.documentElement.style.overflow).toBe('hidden')

      open.value = false
      await nextTick()
      expect(document.documentElement.style.overflow).toBe('')
    })

    it('leaves page scroll alone with lock-scroll off', async () => {
      const { open } = await mountMenu({ lockScroll: false })

      await openMenu(open)
      expect(document.documentElement.style.overflow).toBe('')
    })
  })

  describe('trigger', () => {
    // A menu slotted into a button's label sits in a <span>: the button is the trigger.
    it('takes the button around it as its trigger, not the label it sits in', async () => {
      const open = ref(false)
      const Harness = defineComponent({
        setup: () => () => h('button', { class: 'outer', onClick: () => { open.value = !open.value } }, [
          h('span', { class: 'label' }, [
            'Actions',
            h(MMenu, { 'modelValue': open.value, 'onUpdate:modelValue': (value: boolean) => { open.value = value } }, { default: () => h(MMenuItem, { label: 'Copy' }) }),
          ]),
        ]),
      })
      await mountTracked(Harness, { attachTo: document.body })
      const outer = document.querySelector<HTMLElement>('.outer')!
      outer.focus()
      open.value = true
      await settle()

      expect(document.querySelector('.ui-menu__surface')!.getAttribute('aria-labelledby')).toBe(outer.id)
      expect(document.querySelector<HTMLElement>('.label')!.id).toBe('')

      ;(document.activeElement as HTMLElement).blur()
      keydown(document.querySelector('.ui-menu__item')!, 'Escape')
      await settle()
      expect(document.activeElement).toBe(outer)
    })

    it('keeps its parent as the trigger outside a button', async () => {
      const { open } = await mountMenu()
      await openMenu(open)

      expect(document.querySelector('.ui-menu__surface')!.getAttribute('aria-labelledby')).toBe(triggerEl().id)
    })
  })

  // A11-06: the activator's keys open the menu on the item they point at.
  describe('activator', () => {
    it('toggles the menu on a click', async () => {
      const { open } = await mountWithActivator()

      triggerEl().click()
      await settle()
      expect(open.value).toBe(true)
      expect(document.activeElement).toBe(menuItems()[0])

      triggerEl().click()
      await settle()
      expect(open.value).toBe(false)
    })

    it.each([
      ['ArrowDown', 0],
      ['ArrowUp', 2],
    ] as const)('opens on %s with focus on item %i', async (key, index) => {
      const { open } = await mountWithActivator()
      triggerEl().focus()

      const event = press(key)
      await settle()

      expect(event.defaultPrevented).toBe(true)
      expect(open.value).toBe(true)
      expect(document.activeElement).toBe(menuItems()[index])
    })

    it('gives focus back to the activator on Escape', async () => {
      await mountWithActivator()
      triggerEl().focus()
      press('ArrowDown')
      await settle()

      press('Escape')
      await settle()

      expect(document.activeElement).toBe(triggerEl())
    })

    it('anchors the menu to the activator', async () => {
      await mountWithActivator({ modelValue: true })

      expect(triggerEl().style.getPropertyValue('anchor-name')).toMatch(/^--popover-anchor-/)
    })
  })

  describe('anchor', () => {
    it('gives the anchor-name to the explicit anchor instead of the parent', async () => {
      const anchor = document.createElement('div')
      document.body.appendChild(anchor)
      await mountMenu({ modelValue: true, anchor })

      expect(anchor.style.getPropertyValue('anchor-name')).toMatch(/^--popover-anchor-/)
      expect(triggerEl().style.getPropertyValue('anchor-name')).toBe('')
      anchor.remove()
    })
  })
})
