import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { overlayHost, settle, useOverlayHost } from '#kit/components/ui/overlay/tests/helpers'
import MNavigationDrawer from '../index.vue'
import { drawerDialog, drawerPanel, mountDrawer } from './helpers'

useOverlayHost()

const scrim = () => overlayHost().querySelector<HTMLElement>('.ui-overlay__scrim')!
const cancel = () => drawerDialog()!.dispatchEvent(new Event('cancel', { cancelable: true }))
const activator = { activator: ({ props }: { props: Record<string, unknown> }) => h('button', { ...props, class: 'trigger' }, 'Menu') }

describe('m-navigation-drawer · interaction', () => {
  describe('open state', () => {
    it('opens a native modal dialog from the model and reports the lifecycle', async () => {
      const { model, events } = await mountDrawer({ modelValue: false })

      model.value = true
      await vi.waitFor(() => expect(events).toEqual(['opened']))
      expect(drawerDialog()!.open).toBe(true)

      model.value = false
      await vi.waitFor(() => expect(events).toEqual(['opened', 'closed']))
    })

    // EN-02: the lifecycle is part of the drawer's own contract, not a fallthrough.
    it('declares the lifecycle events of the modal layer', async () => {
      const { model, wrapper } = await mountDrawer({ modelValue: false })
      const drawer = wrapper.findComponent(MNavigationDrawer)

      model.value = true
      await vi.waitFor(() => expect(drawer.emitted('opened')).toHaveLength(1))
      model.value = false
      await vi.waitFor(() => expect(drawer.emitted('closed')).toHaveLength(1))

      const declared = drawer.vm.$options.emits as string[] | Record<string, unknown> | undefined
      const names = Array.isArray(declared) ? declared : Object.keys(declared ?? {})
      expect(names).toEqual(expect.arrayContaining(['opened', 'closed', 'beforeOpen', 'beforeClose', 'clickOutside']))
    })

    it('keeps its content in the DOM after closing with displayDirective show', async () => {
      const { model } = await mountDrawer({ displayDirective: 'show' })

      model.value = false
      await settle()

      expect(drawerPanel()).not.toBeNull()
    })
  })

  describe('dismissal', () => {
    it('closes on a scrim click', async () => {
      const { model } = await mountDrawer()

      scrim().click()
      await nextTick()

      expect(model.value).toBe(false)
    })

    it('stays open on a scrim click with closeOnOutside off', async () => {
      const { model } = await mountDrawer({ closeOnOutside: false })

      scrim().click()
      await nextTick()

      expect(model.value).toBe(true)
    })

    it('closes on Escape', async () => {
      const { model } = await mountDrawer()

      cancel()
      await nextTick()

      expect(model.value).toBe(false)
    })

    it.each([
      ['closeOnEscape off', { closeOnEscape: false }],
      ['persistent', { persistent: true }],
    ])('stays open on Escape with %s', async (_, props) => {
      const { model } = await mountDrawer(props)

      cancel()
      await nextTick()

      expect(model.value).toBe(true)
    })

    it('closes through the exposed close()', async () => {
      const { model, wrapper } = await mountDrawer()
      const drawer = wrapper.findComponent(MNavigationDrawer).vm as unknown as { close: () => Promise<void> }

      await drawer.close()
      await settle()

      expect(model.value).toBe(false)
    })
  })

  // B5.4c (Q56-А): the trigger comes through `#activator`.
  describe('activator', () => {
    it('opens and closes the drawer from the trigger', async () => {
      const { model, wrapper } = await mountDrawer({ modelValue: false }, activator)

      await wrapper.find('.trigger').trigger('click')
      await flushPromises()
      expect(model.value).toBe(true)

      await wrapper.find('.trigger').trigger('click')
      await flushPromises()
      expect(model.value).toBe(false)
    })

    it('hands the activator the open state and the open/close/toggle actions', async () => {
      const scopes: Array<Record<string, unknown>> = []
      await mountDrawer({ modelValue: false }, {
        activator: (scope: Record<string, unknown>) => {
          scopes.push(scope)
          return h('button', 'Menu')
        },
      })
      const scope = scopes.at(-1)!

      expect(scope.isOpen).toBe(false)
      expect(typeof scope.open).toBe('function')
      expect(typeof scope.close).toBe('function')
      expect(typeof scope.toggle).toBe('function')
    })
  })
})
