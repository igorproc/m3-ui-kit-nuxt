import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { overlayHost, useOverlayHost } from '#kit/components/ui/overlay/tests/helpers'
import { drawerPanel, mountDrawer } from './helpers'

useOverlayHost()

describe('m-navigation-drawer · variants', () => {
  // B5.4b (Q23-А): the side is logical, so a start drawer sits on the right in RTL.
  describe('side', () => {
    it.each(['start', 'end'] as const)('pins the drawer to the %s edge', async (side) => {
      await mountDrawer({ side })

      expect(drawerPanel()!.classList.contains(`ui-navigation-drawer--${side}`)).toBe(true)
    })

    it('defaults to the start edge', async () => {
      await mountDrawer()

      expect(drawerPanel()!.classList.contains('ui-navigation-drawer--start')).toBe(true)
      expect(drawerPanel()!.classList.contains('ui-navigation-drawer--end')).toBe(false)
    })

    it.each(['start', 'end'] as const)('slides in from the %s edge', async (side) => {
      const { model } = await mountDrawer({ side, modelValue: false })

      model.value = true
      await new Promise(resolve => setTimeout(resolve))

      expect(drawerPanel()!.className).toContain(`ui-navigation-drawer-slide-${side}`)
    })
  })

  describe('structure', () => {
    it('renders the surface inside the overlay panel with the content region in it', async () => {
      await mountDrawer()
      const panel = drawerPanel()!

      expect(panel.classList.contains('ui-overlay__panel')).toBe(true)
      expect(panel.querySelector('.ui-navigation-drawer__surface .ui-navigation-drawer__content')!.textContent).toBe('Destinations')
    })

    it('renders nothing while closed', async () => {
      await mountDrawer({ modelValue: false })

      expect(overlayHost().querySelector('.ui-navigation-drawer')).toBeNull()
    })

    it('puts the header before the content when the header slot is used', async () => {
      await mountDrawer({}, { header: () => 'Mail' })
      const parts = Array.from(drawerPanel()!.querySelector('.ui-navigation-drawer__surface')!.children)

      expect(parts.map(part => part.className)).toEqual(['ui-navigation-drawer__header', 'ui-navigation-drawer__content'])
      expect(parts[0]!.textContent).toBe('Mail')
    })

    it('renders no header without the header slot', async () => {
      await mountDrawer()

      expect(drawerPanel()!.querySelector('.ui-navigation-drawer__header')).toBeNull()
    })

    it('renders rich default content', async () => {
      await mountDrawer({}, { default: () => h('ul', { class: 'destinations' }, [h('li', 'Inbox')]) })

      expect(drawerPanel()!.querySelector('.destinations li')!.textContent).toBe('Inbox')
    })
  })

  describe('classes', () => {
    it('adds containerClass to the panel', async () => {
      await mountDrawer({ containerClass: 'app-drawer' })

      expect(drawerPanel()!.classList.contains('app-drawer')).toBe(true)
    })

    it('adds contentClass to the panel next to the drawer classes', async () => {
      await mountDrawer({ contentClass: ['wide', { dense: true }] })
      const classes = drawerPanel()!.classList

      expect(classes.contains('wide')).toBe(true)
      expect(classes.contains('dense')).toBe(true)
      expect(classes.contains('ui-navigation-drawer')).toBe(true)
    })

    it('renders a scrim by default', async () => {
      await mountDrawer()

      expect(overlayHost().querySelector('.ui-overlay__scrim')).not.toBeNull()
    })

    it('hides the scrim with hideOverlay', async () => {
      await mountDrawer({ hideOverlay: true })

      expect(overlayHost().querySelector('.ui-overlay__scrim')).toBeNull()
    })
  })
})
