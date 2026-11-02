import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import { useOverlayHost } from '#kit/components/ui/overlay/tests/helpers'
import { drawerDialog, mountDrawer } from './helpers'

useOverlayHost()

const activator = { activator: ({ props }: { props: Record<string, unknown> }) => h('button', { ...props, class: 'trigger' }, 'Menu') }

describe('m-navigation-drawer · a11y', () => {
  describe('role', () => {
    it('is a native modal dialog', async () => {
      await mountDrawer()
      const dialog = drawerDialog()!

      expect(dialog.tagName).toBe('DIALOG')
      expect(dialog.getAttribute('role')).toBeNull()
      expect(dialog.open).toBe(true)
    })
  })

  describe('naming', () => {
    it('is named by its header', async () => {
      await mountDrawer({}, { header: () => 'Mail' })
      const dialog = drawerDialog()!
      const header = dialog.querySelector('.ui-navigation-drawer__header')!

      expect(header.tagName).toBe('HEADER')
      expect(dialog.getAttribute('aria-labelledby')).toBe(header.id)
      expect(dialog.getAttribute('aria-label')).toBeNull()
    })

    // B8.5: the kit ships no English name; the header or the consumer names it.
    it('ships no name of its own', async () => {
      await mountDrawer()

      expect(drawerDialog()!.getAttribute('aria-label')).toBeNull()
      expect(drawerDialog()!.getAttribute('aria-labelledby')).toBeNull()
    })

    it('takes an aria-label from the consumer when there is no header', async () => {
      await mountDrawer({}, {}, { 'aria-label': 'Почта' })

      expect(drawerDialog()!.getAttribute('aria-label')).toBe('Почта')
    })
  })

  describe('activator', () => {
    it('announces a dialog popup and its collapsed state', async () => {
      const { wrapper } = await mountDrawer({ modelValue: false }, activator)
      const trigger = wrapper.find('.trigger')

      expect(trigger.attributes('aria-haspopup')).toBe('dialog')
      expect(trigger.attributes('aria-expanded')).toBe('false')
    })

    it('flips aria-expanded when the drawer opens', async () => {
      const { wrapper } = await mountDrawer({ modelValue: false }, activator)

      await wrapper.find('.trigger').trigger('click')
      await flushPromises()

      expect(wrapper.find('.trigger').attributes('aria-expanded')).toBe('true')
    })

    it('points aria-controls at the dialog it opens', async () => {
      const { wrapper } = await mountDrawer({ modelValue: false }, activator)
      const controls = wrapper.find('.trigger').attributes('aria-controls')

      await wrapper.find('.trigger').trigger('click')
      await flushPromises()

      expect(controls).toBeTruthy()
      expect(drawerDialog()!.id).toBe(controls)
    })

    it('points aria-controls at an id the consumer set on the drawer', async () => {
      const { wrapper } = await mountDrawer({ modelValue: false }, activator, { id: 'app-drawer' })

      expect(wrapper.find('.trigger').attributes('aria-controls')).toBe('app-drawer')
    })
  })

  describe('focus', () => {
    it('moves focus into the drawer when it opens', async () => {
      await mountDrawer()

      expect(drawerDialog()!.contains(document.activeElement)).toBe(true)
    })
  })
})
