import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import MMenuItem from '../item/index.vue'
import { useOverlayHost } from '../../overlay/tests/helpers'
import { menuItems, mountMenu, mountWithActivator, openMenu, surface, triggerEl, withDisabled } from './helpers'

useOverlayHost()

describe('m-menu · a11y', () => {
  describe('role', () => {
    it('gives the surface the menu role and keeps it out of the Tab order', async () => {
      await mountMenu({ modelValue: true })

      expect(surface()!.getAttribute('role')).toBe('menu')
      expect(surface()!.getAttribute('tabindex')).toBe('-1')
    })

    it('gives MMenuItem rows the menu item role', async () => {
      const { open } = await mountMenu()
      await openMenu(open)

      expect(menuItems().map(item => item.getAttribute('role'))).toEqual(['menuitem', 'menuitem', 'menuitem'])
    })

    // The control hands out attributes; it never writes them onto slotted markup.
    it('leaves a slotted element without a role alone, out of the arrow order', async () => {
      const { open } = await mountMenu({}, () => [
        h('button', { class: 'bare' }, 'Bare'),
        h(MMenuItem, { label: 'Copy' }),
      ])
      await openMenu(open)
      const bare = document.querySelector<HTMLElement>('.bare')!

      expect(bare.hasAttribute('role')).toBe(false)
      expect(bare.hasAttribute('tabindex')).toBe(false)
      expect(document.activeElement).toBe(menuItems()[0])
    })
  })

  describe('disabled', () => {
    // A native `disabled` would drop the item out of focus; APG keeps it reachable.
    it('marks a disabled item aria-disabled, not disabled', async () => {
      const { open } = await mountMenu({}, withDisabled)
      await openMenu(open)
      const disabled = menuItems()[1]!

      expect(disabled.getAttribute('role')).toBe('menuitem')
      expect(disabled.getAttribute('aria-disabled')).toBe('true')
      expect(disabled.hasAttribute('disabled')).toBe(false)
    })
  })

  describe('focus order', () => {
    // APG: Tab leaves the menu, so no item is a Tab stop; focus moves by script.
    it('keeps every item out of the Tab order', async () => {
      const { open } = await mountMenu()
      await openMenu(open)

      expect(menuItems().map(item => item.tabIndex)).toEqual([-1, -1, -1])
    })
  })

  // A11-06: the activator says what it opens, whether it is open, and which element.
  describe('activator', () => {
    it('announces a menu popup, closed, on the trigger', async () => {
      await mountWithActivator()

      expect(triggerEl().getAttribute('aria-haspopup')).toBe('menu')
      expect(triggerEl().getAttribute('aria-expanded')).toBe('false')
      expect(triggerEl().hasAttribute('aria-controls')).toBe(false)
      expect(triggerEl().id).toBeTruthy()
    })

    it('controls the open menu, which it names', async () => {
      const { open } = await mountWithActivator()
      await openMenu(open)

      expect(triggerEl().getAttribute('aria-expanded')).toBe('true')
      expect(triggerEl().getAttribute('aria-controls')).toBe(surface()!.id)
      expect(surface()!.getAttribute('aria-labelledby')).toBe(triggerEl().id)
    })

    it('controls the id the consumer gave the menu', async () => {
      const { open } = await mountWithActivator({ id: 'actions-menu' })
      await openMenu(open)

      expect(surface()!.id).toBe('actions-menu')
      expect(triggerEl().getAttribute('aria-controls')).toBe('actions-menu')
    })
  })

  describe('naming', () => {
    it('is named by its trigger, which gets an id when it has none', async () => {
      const { open } = await mountMenu()
      await openMenu(open)

      expect(triggerEl().id).toBeTruthy()
      expect(surface()!.getAttribute('aria-labelledby')).toBe(triggerEl().id)
    })

    it('keeps the trigger’s own id', async () => {
      const { open } = await mountMenu({}, undefined, { id: 'more-actions' })
      await openMenu(open)

      expect(surface()!.getAttribute('aria-labelledby')).toBe('more-actions')
    })

    it.each([
      [{ 'aria-label': 'Действия' }, 'aria-label', 'Действия'],
      [{ 'aria-labelledby': 'heading' }, 'aria-labelledby', 'heading'],
    ] as const)('takes the consumer’s own name (%o)', async (attrs, key, value) => {
      const { open } = await mountMenu(attrs)
      await openMenu(open)

      expect(surface()!.getAttribute(key)).toBe(value)
      if (key === 'aria-label') expect(surface()!.hasAttribute('aria-labelledby')).toBe(false)
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; it cannot be asserted here.
  })
})
