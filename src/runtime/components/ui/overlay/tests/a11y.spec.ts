import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { VNode } from 'vue'
import MOverlay from '../index.vue'
import MSnackbar from '#kit/components/ui/snackbar/index.vue'
import { keydown, mountTracked, settle, useOverlayHost } from './helpers'

useOverlayHost()

async function mount(props: Record<string, unknown> = {}, content: () => VNode | VNode[] = () => h('button', { class: 'inside' }, 'Inside')) {
  const model = ref(Boolean(props.modelValue ?? true))
  const Harness = defineComponent({
    setup: () => () => h(MOverlay, {
      ...props,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: boolean) => { model.value = value },
    }, { default: content }),
  })
  await mountTracked(Harness)
  await settle()
  return { model }
}

const root = () => document.querySelector('.ui-overlay') as HTMLElement

describe('m-overlay · a11y', () => {
  describe('role', () => {
    it('relies on the native <dialog> role in modal mode', async () => {
      await mount()

      expect(root().tagName).toBe('DIALOG')
      expect(root().hasAttribute('role')).toBe(false)
    })

    it('marks only a modal with a non-interactive background aria-modal', async () => {
      await mount()
      expect(root().getAttribute('aria-modal')).toBe('true')
    })

    it.each([
      ['modal', 'interactive'],
      ['popover', 'non-interactive'],
    ] as const)('does not mark a %s with a %s background aria-modal', async (mode, background) => {
      await mount({ mode, background })

      expect(root().hasAttribute('aria-modal')).toBe(false)
    })

    it('forwards an accessible name onto the root', async () => {
      await mount({ 'aria-label': 'Settings' })

      expect(root().getAttribute('aria-label')).toBe('Settings')
    })
  })

  describe('live region', () => {
    it('gives an open modal its own persistent announcement regions', async () => {
      await mount()

      expect(root().querySelector(':scope > .ui-live-region [role="status"]')).not.toBeNull()
      expect(root().querySelector(':scope > .ui-live-region [role="alert"]')).not.toBeNull()
    })

    it('leaves a popover to the page’s regions', async () => {
      await mount({ mode: 'popover' })

      expect(root().querySelector('.ui-live-region')).toBeNull()
    })
  })

  describe('decoration', () => {
    it('hides the scrim from assistive tech', async () => {
      await mount()

      expect(document.querySelector('.ui-overlay__scrim')!.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('activator', () => {
    async function mountWithActivator(props: Record<string, unknown> = {}) {
      const model = ref(false)
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, {
          ...props,
          'modelValue': model.value,
          'onUpdate:modelValue': (value: boolean) => { model.value = value },
        }, {
          activator: ({ props: bag }: { props: Record<string, unknown> }) => h('button', { class: 'act', ...bag }, 'Open'),
          default: () => h('div', 'Panel'),
        }),
      })
      const wrapper = await mountTracked(Harness)
      return { model, act: () => wrapper.find('.act') }
    }

    // A popover promises no role: `aria-haspopup` would announce a menu that is not there.
    it('announces no popup role for a popover', async () => {
      const { act } = await mountWithActivator({ mode: 'popover' })

      expect(act().attributes('aria-haspopup')).toBeUndefined()
      expect(act().attributes('aria-expanded')).toBe('false')
    })

    it.each(['modal', 'popover'] as const)('points aria-controls at the open %s root and drops it while closed', async (mode) => {
      const { model, act } = await mountWithActivator({ mode })
      expect(act().attributes('aria-controls')).toBeUndefined()

      model.value = true
      await settle()
      const controls = act().attributes('aria-controls')!
      expect(document.getElementById(controls)).toBe(root())

      model.value = false
      await settle()
      expect(act().attributes('aria-controls')).toBeUndefined()
    })

    it('controls the id a consumer gives the root', async () => {
      const { model, act } = await mountWithActivator({ id: 'settings-dialog' })

      model.value = true
      await settle()

      expect(root().id).toBe('settings-dialog')
      expect(act().attributes('aria-controls')).toBe('settings-dialog')
    })

    it('announces a dialog and its expanded state on the activator', async () => {
      const model = ref(false)
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: boolean) => { model.value = value },
        }, {
          activator: ({ props }: { props: Record<string, unknown> }) => h('button', { class: 'act', ...props }, 'Open'),
          default: () => h('div', 'Panel'),
        }),
      })
      const wrapper = await mountTracked(Harness)
      const act = () => wrapper.find('.act')

      expect(act().attributes('aria-haspopup')).toBe('dialog')
      expect(act().attributes('aria-expanded')).toBe('false')

      await act().trigger('click')
      expect(act().attributes('aria-expanded')).toBe('true')
    })
  })

  describe('focus', () => {
    // The surface takes focus, not its first control: Enter must not land on
    // a destructive action the user has not read yet.
    it('focuses the dialog itself, not its first control', async () => {
      const { model } = await mount({ modelValue: false })

      model.value = true
      await settle()

      expect(document.activeElement).toBe(root())
    })

    it('hands focus to the control the content marks with autofocus', async () => {
      const { model } = await mount({ modelValue: false }, () => [
        h('button', { class: 'first' }, 'First'),
        h('input', { class: 'name', autofocus: true }),
      ])

      model.value = true
      await settle()

      expect(document.activeElement).toBe(document.querySelector('.name'))
    })

    it('moves focus into a modal and returns it to the opener', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()

      const { model } = await mount({ modelValue: false })
      model.value = true
      await settle()
      expect(root().contains(document.activeElement)).toBe(true)

      model.value = false
      await settle()
      expect(document.activeElement).toBe(opener)
      opener.remove()
    })

    it('leaves focus alone in modal mode with trap-focus off', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()

      await mount({ trapFocus: false, background: 'interactive' })

      expect(document.activeElement).toBe(opener)
      opener.remove()
    })

    it('traps focus in popover mode when trap-focus is set', async () => {
      await mount({ mode: 'popover', trapFocus: true })

      expect(root().contains(document.activeElement)).toBe(true)
    })

    // The trap lives on the <dialog>: focus on the root itself and surfaces
    // teleported beside the panel must not let Tab reach the browser chrome.
    it('keeps Tab inside the whole dialog, including surfaces beside the panel', async () => {
      await mount({}, () => [
        h('button', { class: 'first' }, 'First'),
        h(MSnackbar, { modelValue: true, label: 'Saved', actionLabel: 'Undo' }),
      ])

      const dialog = root()
      const first = dialog.querySelector<HTMLElement>('.first')!
      const action = dialog.querySelector<HTMLElement>('.ui-snackbar__action')!

      action.focus()
      expect(keydown(action, 'Tab').defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(first)

      dialog.focus()
      expect(keydown(dialog, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(action)
    })
  })
})
