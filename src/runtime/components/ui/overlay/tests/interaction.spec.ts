import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import { useNuxtApp } from '#app'
import MOverlay from '../index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MTooltip from '#kit/components/ui/tooltip/index.vue'
import { keydown, mountTracked, overlayHost, settle, useOverlayHost } from './helpers'

useOverlayHost()

function harness(overlayProps: Record<string, unknown> = {}, content: () => VNode | VNode[] | string = () => h('div', { class: 'panel-content' }, 'Panel')) {
  const model = ref(Boolean(overlayProps.modelValue))
  const events: string[] = []
  const Harness = defineComponent({
    setup: () => () => h(MOverlay, {
      ...overlayProps,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: boolean) => { model.value = value },
      'onBeforeOpen': () => events.push('beforeOpen'),
      'onOpened': () => events.push('opened'),
      'onBeforeClose': () => events.push('beforeClose'),
      'onClosed': () => events.push('closed'),
      'onClickOutside': () => events.push('clickOutside'),
    }, { default: content }),
  })
  return { model, events, mount: () => mountTracked(Harness) }
}

const root = () => document.querySelector('.ui-overlay') as HTMLDialogElement | null
const scrim = () => document.querySelector('.ui-overlay__scrim') as HTMLElement

describe('m-overlay · interaction', () => {
  describe('lifecycle', () => {
    it('does not render while closed', async () => {
      await harness().mount()

      expect(root()).toBeNull()
    })

    it('opens a native modal <dialog> in the overlay host', async () => {
      await harness({ modelValue: true }).mount()
      await settle()

      expect(root()!.open).toBe(true)
      expect(overlayHost().contains(root())).toBe(true)
    })

    it('runs the open and close lifecycle in order', async () => {
      const { model, events, mount } = harness()
      await mount()

      model.value = true
      await settle()
      model.value = false
      await settle()

      expect(events).toEqual(['beforeOpen', 'opened', 'beforeClose', 'closed'])
      expect(root()).toBeNull()
    })

    it('stays closed when beforeOpen is stopped', async () => {
      const model = ref(false)
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: boolean) => { model.value = value },
          'onBeforeOpen': (event: { stop: () => void }) => event.stop(),
        }, { default: () => h('div', 'Panel') }),
      })
      await mountTracked(Harness)

      model.value = true
      await settle()

      expect(model.value).toBe(false)
      expect(root()).toBeNull()
    })

    it('stays open when beforeClose is stopped', async () => {
      const model = ref(true)
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: boolean) => { model.value = value },
          'onBeforeClose': (event: { stop: () => void }) => event.stop(),
        }, { default: () => h('div', 'Panel') }),
      })
      await mountTracked(Harness)
      await settle()

      model.value = false
      await settle()

      expect(model.value).toBe(true)
      expect(root()!.open).toBe(true)
    })

    it('exposes open, close and toggle that settle with the lifecycle', async () => {
      const { model, mount } = harness()
      const wrapper = await mount()
      const overlay = wrapper.findComponent(MOverlay).vm as unknown as { open: () => Promise<void>, close: () => Promise<void>, toggle: () => void }

      await Promise.all([overlay.open(), settle()])
      expect(model.value).toBe(true)
      expect(root()!.open).toBe(true)

      await Promise.all([overlay.close(), settle()])
      expect(model.value).toBe(false)

      overlay.toggle()
      await settle()
      expect(model.value).toBe(true)
    })
  })

  describe('dismissal', () => {
    it('closes on a scrim click and emits clickOutside', async () => {
      const { model, events, mount } = harness({ modelValue: true })
      await mount()
      await settle()

      scrim().click()
      await nextTick()

      expect(events).toContain('clickOutside')
      expect(model.value).toBe(false)
    })

    it('does not close on a scrim click when persistent', async () => {
      const { model, mount } = harness({ modelValue: true, persistent: true, closeOnOutside: true })
      await mount()
      await settle()

      scrim().click()
      await nextTick()

      expect(model.value).toBe(true)
    })

    it('does not close on a scrim click with close-on-outside off', async () => {
      const { model, events, mount } = harness({ modelValue: true, closeOnOutside: false })
      await mount()
      await settle()

      scrim().click()
      await nextTick()

      expect(events).toContain('clickOutside')
      expect(model.value).toBe(true)
    })

    it('handles the native close request (cancel) and prevents the browser closing it', async () => {
      const { model, mount } = harness({ modelValue: true })
      await mount()
      await settle()

      const cancel = new Event('cancel', { cancelable: true })
      root()!.dispatchEvent(cancel)
      await nextTick()

      expect(cancel.defaultPrevented).toBe(true)
      expect(model.value).toBe(false)
    })

    it('respects close-on-escape off', async () => {
      const { model, mount } = harness({ modelValue: true, closeOnEscape: false })
      await mount()
      await settle()

      root()!.dispatchEvent(new Event('cancel', { cancelable: true }))
      await nextTick()

      expect(model.value).toBe(true)
    })

    it('closes a non-modal surface on Escape', async () => {
      const { model, mount } = harness({ modelValue: true, mode: 'popover' })
      await mount()
      await settle()

      const event = keydown(window, 'Escape')
      await nextTick()

      expect(event.defaultPrevented).toBe(true)
      expect(model.value).toBe(false)
    })

    it('closes a popover on a press outside its panel', async () => {
      const { model, events, mount } = harness({ modelValue: true, mode: 'popover' })
      await mount()
      await settle()

      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
      document.body.click()
      await nextTick()

      expect(events).toContain('clickOutside')
      expect(model.value).toBe(false)
    })

    it.each([
      ['outside', () => scrim().click()],
      ['escape', () => root()!.dispatchEvent(new Event('cancel', { cancelable: true }))],
    ] as const)('names the %s dismissal before it closes', async (reason, act) => {
      const reasons: string[] = []
      const { model, mount } = harness({ modelValue: true, onDismiss: (value: string) => reasons.push(value) })
      await mount()
      await settle()

      act()
      await nextTick()

      expect(reasons).toEqual([reason])
      expect(model.value).toBe(false)
    })

    it('reports no dismissal it refuses', async () => {
      const reasons: string[] = []
      const { mount } = harness({ modelValue: true, persistent: true, onDismiss: (value: string) => reasons.push(value) })
      await mount()
      await settle()

      scrim().click()
      root()!.dispatchEvent(new Event('cancel', { cancelable: true }))
      await nextTick()

      expect(reasons).toEqual([])
    })

    it('waits for a controlled parent that refuses to close', async () => {
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, { 'modelValue': true, 'onUpdate:modelValue': () => {} }, {
          default: ({ close }: { close: () => Promise<void> }) => h('button', { class: 'close', onClick: close }, 'x'),
        }),
      })
      await mountTracked(Harness)
      await settle()

      ;(document.querySelector('.close') as HTMLElement).click()
      await settle()

      expect(root()!.open).toBe(true)
    })
  })

  describe('scroll lock', () => {
    it('locks page scroll while open and restores it once closed', async () => {
      const { model, mount } = harness({ modelValue: true })
      await mount()
      await settle()
      expect(document.documentElement.style.overflow).toBe('hidden')

      model.value = false
      await settle()
      expect(document.documentElement.style.overflow).toBe('')
    })

    it('does not lock scroll with an interactive background', async () => {
      await harness({ modelValue: true, background: 'interactive' }).mount()
      await settle()

      expect(document.documentElement.style.overflow).toBe('')
    })

    it('does not lock scroll with lock-scroll off', async () => {
      await harness({ modelValue: true, lockScroll: false }).mount()
      await settle()

      expect(document.documentElement.style.overflow).toBe('')
    })
  })

  describe('modal registry', () => {
    it('lists an open modal in $material.modal and closes it by id', async () => {
      const { model, mount } = harness({ modelValue: true })
      const wrapper = await mount()
      await settle()

      const modal = useNuxtApp().$material.modal
      const id = (wrapper.findComponent(MOverlay).vm as unknown as { id: string }).id
      expect(modal.openedModals.map(entry => entry.id)).toContain(id)
      expect(modal.openedModalOverlays.map(entry => entry.id)).toContain(id)

      const closing = modal.close(id)
      await settle()
      await closing

      expect(model.value).toBe(false)
      expect(modal.openedModals.map(entry => entry.id)).not.toContain(id)
    })

    it('keeps a popover out of the modal registry', async () => {
      const { mount } = harness({ modelValue: true, mode: 'popover' })
      const wrapper = await mount()
      await settle()

      const id = (wrapper.findComponent(MOverlay).vm as unknown as { id: string }).id
      expect(useNuxtApp().$material.modal.openedModals.map(entry => entry.id)).not.toContain(id)
    })
  })

  describe('nesting', () => {
    it('closes a nested modal before its parent', async () => {
      const parentOpen = ref(true)
      const childOpen = ref(true)
      const order: string[] = []
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, {
          'modelValue': parentOpen.value,
          'onUpdate:modelValue': (value: boolean) => { parentOpen.value = value },
          'onClosed': () => order.push('parent'),
        }, {
          default: () => h(MOverlay, {
            'modelValue': childOpen.value,
            'onUpdate:modelValue': (value: boolean) => { childOpen.value = value },
            'onClosed': () => order.push('child'),
          }, { default: () => h('div', 'Child') }),
        }),
      })
      await mountTracked(Harness)
      await settle()

      parentOpen.value = false
      await settle()
      await settle()

      expect(childOpen.value).toBe(false)
      expect(order).toEqual(['child', 'parent'])
    })

    // An open modal makes everything outside its subtree inert — top-layer
    // popovers included — so floating surfaces must render inside the dialog.
    it('renders nested menus, tooltips and overlays inside its own root', async () => {
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, { modelValue: true }, {
          default: () => [
            h('button', { class: 'menu-trigger' }, [h(MMenu, { modelValue: true }, { default: () => 'Menu' })]),
            h(MTooltip, { text: 'Hint' }, { default: () => h('button', { class: 'tooltip-trigger' }, 'Tip') }),
            h(MOverlay, { modelValue: true, mode: 'popover' }, { default: () => h('div', { class: 'nested' }, 'Nested') }),
          ],
        }),
      })
      await mountTracked(Harness)
      await settle()
      document.querySelector('.ui-tooltip')!.dispatchEvent(new MouseEvent('mouseenter'))
      await settle()

      const dialog = document.querySelector('dialog.ui-overlay')!
      expect(dialog.querySelector('.ui-menu__surface')).not.toBeNull()
      expect(dialog.querySelector('.ui-tooltip__content')).not.toBeNull()
      expect(dialog.querySelector('.ui-overlay--popover .nested')).not.toBeNull()
      expect(dialog.hasAttribute('popover')).toBe(false)
    })

    it('lets only the topmost overlay answer Escape', async () => {
      const parentOpen = ref(true)
      const childOpen = ref(true)
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, {
          'mode': 'popover',
          'modelValue': parentOpen.value,
          'onUpdate:modelValue': (value: boolean) => { parentOpen.value = value },
        }, {
          default: () => h(MOverlay, {
            'mode': 'popover',
            'modelValue': childOpen.value,
            'onUpdate:modelValue': (value: boolean) => { childOpen.value = value },
          }, { default: () => h('div', 'Child') }),
        }),
      })
      await mountTracked(Harness)
      await settle()

      keydown(window, 'Escape')
      await nextTick()

      expect(childOpen.value).toBe(false)
      expect(parentOpen.value).toBe(true)
    })
  })

  describe('activator', () => {
    it('toggles the overlay from the activator props', async () => {
      const model = ref(false)
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: boolean) => { model.value = value },
        }, {
          activator: (scope: { props: Record<string, unknown> }) => h('button', { class: 'act', ...scope.props }, 'open'),
          default: () => h('div', { class: 'panel-content' }, 'Panel'),
        }),
      })
      const wrapper = await mountTracked(Harness)

      await wrapper.find('.act').trigger('click')
      await nextTick()
      expect(model.value).toBe(true)

      await settle()
      await wrapper.find('.act').trigger('click')
      await nextTick()
      expect(model.value).toBe(false)
    })
  })
})
