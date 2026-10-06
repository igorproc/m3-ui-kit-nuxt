import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import { useNuxtApp } from '#app'
import MOverlay from './index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MTooltip from '#kit/components/ui/tooltip/index.vue'
import MSnackbar from '#kit/components/ui/snackbar/index.vue'
import { __resetScrollLock } from '#kit/composables/overlay/useScrollLock'

// Overlays teleport into the shared #ui-overlay-host (client-only). Real
// <transition>s (not the test-utils stub): the lifecycle settles on their hooks.
const MOUNT_OPTIONS = { global: { stubs: { transition: false } } }

// Every mount shares one `$material.modal` registry while `useId()` restarts per
// app, so earlier mounts must go away or their entries shadow the new ids.
const mounted: Array<{ unmount: () => void }> = []

async function mountTracked(component: Parameters<typeof mountSuspended>[0]) {
  const wrapper = await mountSuspended(component, MOUNT_OPTIONS)
  mounted.push(wrapper)
  return wrapper
}

/** Lets happy-dom run the transition frames so a phase settles. */
const settle = () => new Promise(resolve => setTimeout(resolve, 50))

beforeEach(() => {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.getElementById('ui-overlay-host')?.remove()
  __resetScrollLock()
  document.documentElement.style.overflow = ''
  document.body.style.paddingRight = ''
})

function mountOverlay(overlayProps: Record<string, unknown> = {}, content: () => VNode | string = () => h('div', { class: 'panel-content' }, 'Panel')) {
  const model = ref(Boolean(overlayProps.modelValue))
  const events: string[] = []
  const Harness = defineComponent({
    setup: () => () => h(
      MOverlay,
      {
        ...overlayProps,
        'modelValue': model.value,
        'onUpdate:modelValue': (value: boolean) => { model.value = value },
        'onBeforeOpen': () => events.push('beforeOpen'),
        'onOpened': () => events.push('opened'),
        'onBeforeClose': () => events.push('beforeClose'),
        'onClosed': () => events.push('closed'),
        'onClickOutside': () => events.push('clickOutside'),
      },
      { default: content },
    ),
  })
  return { model, events, mount: () => mountTracked(Harness) }
}

const root = () => document.querySelector('.ui-overlay') as HTMLDialogElement | null

describe('m-overlay', () => {
  it('does not render while closed', async () => {
    const { mount } = mountOverlay({ modelValue: false })
    await mount()

    expect(root()).toBeNull()
  })

  it('opens a native modal <dialog> in the overlay host', async () => {
    const { mount } = mountOverlay({ modelValue: true })
    await mount()
    await settle()

    const dialog = root()!
    expect(dialog.tagName).toBe('DIALOG')
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById('ui-overlay-host')!.querySelector('.panel-content')?.textContent).toBe('Panel')
  })

  it('renders a scrim in modal mode and none in popover mode', async () => {
    const modal = mountOverlay({ modelValue: true, mode: 'modal' })
    await modal.mount()
    await settle()
    expect(document.querySelector('.ui-overlay__scrim')).not.toBeNull()

    document.getElementById('ui-overlay-host')!.innerHTML = ''

    const popover = mountOverlay({ modelValue: true, mode: 'popover' })
    await popover.mount()
    await settle()
    expect(document.querySelectorAll('.ui-overlay__scrim')).toHaveLength(0)
    expect(root()!.tagName).toBe('DIV')
    expect(root()!.classList).toContain('ui-overlay--popover')
  })

  it('runs the open and close lifecycle in order', async () => {
    const { model, events, mount } = mountOverlay({ modelValue: false })
    await mount()

    model.value = true
    await settle()
    model.value = false
    await settle()

    expect(events).toEqual(['beforeOpen', 'opened', 'beforeClose', 'closed'])
    expect(root()).toBeNull()
  })

  it('keeps the root mounted after closing with display-directive="show"', async () => {
    const { model, mount } = mountOverlay({ modelValue: true, displayDirective: 'show' })
    await mount()
    await settle()

    model.value = false
    await settle()

    expect(root()).not.toBeNull()
    expect(root()!.open).toBe(false)
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

  it('closes on a scrim click and emits clickOutside', async () => {
    const { model, events, mount } = mountOverlay({ modelValue: true })
    await mount()
    await settle()

    ;(document.querySelector('.ui-overlay__scrim') as HTMLElement).click()
    await nextTick()

    expect(events).toContain('clickOutside')
    expect(model.value).toBe(false)
  })

  it('does not close on a scrim click when persistent', async () => {
    const { model, mount } = mountOverlay({ modelValue: true, persistent: true, closeOnOutside: true })
    await mount()
    await settle()

    ;(document.querySelector('.ui-overlay__scrim') as HTMLElement).click()
    await nextTick()

    expect(model.value).toBe(true)
  })

  it('handles the native close request (cancel) and respects closeOnEscape=false', async () => {
    const open = mountOverlay({ modelValue: true })
    await open.mount()
    await settle()
    const cancel = new Event('cancel', { cancelable: true })
    root()!.dispatchEvent(cancel)
    await nextTick()
    expect(cancel.defaultPrevented).toBe(true)
    expect(open.model.value).toBe(false)

    await settle()
    const noEsc = mountOverlay({ modelValue: true, closeOnEscape: false })
    await noEsc.mount()
    await settle()
    root()!.dispatchEvent(new Event('cancel', { cancelable: true }))
    await nextTick()
    expect(noEsc.model.value).toBe(true)
  })

  it('locks body scroll while open and restores it once closed', async () => {
    const { model, mount } = mountOverlay({ modelValue: true })
    await mount()
    await settle()
    expect(document.documentElement.style.overflow).toBe('hidden')

    model.value = false
    await settle()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('does not lock scroll with an interactive background', async () => {
    const { mount } = mountOverlay({ modelValue: true, background: 'interactive' })
    await mount()
    await settle()

    expect(document.documentElement.style.overflow).toBe('')
    expect(root()!.hasAttribute('aria-modal')).toBe(false)
  })

  it('lists an open modal in $material.modal and closes it by id', async () => {
    const { model, mount } = mountOverlay({ modelValue: true })
    const wrapper = await mount()
    await settle()

    const modal = useNuxtApp().$material.modal
    const overlay = wrapper.findComponent(MOverlay)
    const id = (overlay.vm as unknown as { id: string }).id
    expect(modal.openedModals.map(entry => entry.id)).toContain(id)
    expect(modal.openedModalOverlays.map(entry => entry.id)).toContain(id)

    const closing = modal.close(id)
    await settle()
    await closing

    expect(model.value).toBe(false)
    expect(modal.openedModals.map(entry => entry.id)).not.toContain(id)
  })

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
          h('button', { class: 'menu-trigger' }, [h(MMenu, { modelValue: true, absolute: true }, { default: () => 'Menu' })]),
          h(MTooltip, { text: 'Hint' }, { default: () => h('button', { class: 'tooltip-trigger' }, 'Tip') }),
          h(MOverlay, { modelValue: true, mode: 'popover' }, { default: () => h('div', { class: 'nested' }, 'Nested') }),
        ],
      }),
    })
    await mountTracked(Harness)
    await settle()
    // The tooltip is itself teleported, so it is reached through the document.
    document.querySelector('.ui-tooltip')!.dispatchEvent(new MouseEvent('mouseenter'))
    await settle()

    const dialog = document.querySelector('dialog.ui-overlay')!
    expect(dialog.querySelector('.ui-menu__surface')).not.toBeNull()
    expect(dialog.querySelector('.ui-tooltip__content')).not.toBeNull()
    expect(dialog.querySelector('.ui-overlay--popover .nested')).not.toBeNull()
    expect(dialog.hasAttribute('popover')).toBe(false)
  })

  // The trap lives on the <dialog>: focus on the root itself and surfaces
  // teleported beside the panel must not let Tab reach the browser chrome.
  it('keeps Tab inside the whole dialog, including surfaces beside the panel', async () => {
    const Harness = defineComponent({
      setup: () => () => h(MOverlay, { modelValue: true }, {
        default: () => [
          h('button', { class: 'first' }, 'First'),
          h(MSnackbar, { modelValue: true, label: 'Saved', actionLabel: 'Undo' }),
        ],
      }),
    })
    await mountTracked(Harness)
    await settle()

    const dialog = root()!
    const first = dialog.querySelector<HTMLElement>('.first')!
    const action = dialog.querySelector<HTMLElement>('.ui-snackbar__action')!
    const tab = (target: HTMLElement, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
      target.dispatchEvent(event)
      return event
    }

    action.focus()
    expect(tab(action).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    dialog.focus()
    expect(tab(dialog, true).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(action)
  })

  it('traps focus in popover mode when trapFocus is set', async () => {
    const { mount } = mountOverlay({ modelValue: true, mode: 'popover', trapFocus: true }, () => h('button', { class: 'inside' }, 'Inside'))
    await mount()
    await settle()

    expect(document.activeElement).toBe(document.querySelector('.inside'))
  })

  it('exposes an activator scope that toggles the overlay', async () => {
    const model = ref(false)
    const Harness = defineComponent({
      setup: () => () => h(
        MOverlay,
        {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: boolean) => { model.value = value },
        },
        {
          activator: (scope: { props: Record<string, unknown> }) =>
            h('button', { class: 'act', ...scope.props }, 'open'),
          default: () => h('div', { class: 'panel-content' }, 'Panel'),
        },
      ),
    })
    const wrapper = await mountTracked(Harness)

    await wrapper.find('.act').trigger('click')
    await nextTick()
    expect(model.value).toBe(true)
  })
})
