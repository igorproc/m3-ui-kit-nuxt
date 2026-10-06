import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { defineComponent, h } from 'vue'
import MSnackbar from './index.vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'

describe('m-snackbar', () => {
  // Teleported into the shared #ui-overlay-host, like every overlay.
  beforeEach(() => {
    const host = document.createElement('div')
    host.id = 'ui-overlay-host'
    document.body.appendChild(host)
  })

  afterEach(() => {
    document.getElementById('ui-overlay-host')?.remove()
    document.querySelectorAll('.ui-snackbar').forEach(node => node.remove())
  })

  it('moves focus onto the snackbar and cycles Tab inside it with trapFocus', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()

    const wrapper = await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved', actionLabel: 'Undo', trapFocus: true },
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const snackbar = document.querySelector<HTMLElement>('.ui-snackbar')!
    const action = document.querySelector<HTMLElement>('.ui-snackbar__action')!
    expect(document.activeElement).toBe(snackbar)

    action.focus()
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    action.dispatchEvent(tab)
    expect(tab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(action)

    await wrapper.setProps({ modelValue: false })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it('leaves focus alone without trapFocus', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved', actionLabel: 'Undo' },
    })

    expect(document.activeElement).not.toBe(document.querySelector('.ui-snackbar'))
  })

  it('teleports into the overlay host', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved' },
    })

    expect(document.getElementById('ui-overlay-host')!.querySelector('.ui-snackbar')).not.toBeNull()
  })

  // An open modal makes everything outside it inert, so a snackbar raised
  // from inside the dialog has to live in the dialog to stay clickable.
  it('renders inside the modal it is opened from', async () => {
    const Harness = defineComponent({
      setup: () => () => h(MOverlay, { modelValue: true }, {
        default: () => h(MSnackbar, { modelValue: true, label: 'Saved', actionLabel: 'Undo' }),
      }),
    })
    await mountSuspended(Harness, { global: { stubs: { transition: false } } })
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(document.querySelector('dialog.ui-overlay .ui-snackbar__action')).not.toBeNull()
  })

  it('renders nothing while the v-model is closed', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: false, label: 'Saved' },
    })

    expect(document.querySelector('.ui-snackbar')).toBeNull()
  })

  it('renders a status region with the label when open', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved' },
    })

    const snackbar = document.querySelector('.ui-snackbar')
    expect(snackbar).not.toBeNull()
    expect(snackbar!.getAttribute('role')).toBe('status')
    expect(snackbar!.getAttribute('aria-live')).toBe('polite')
    expect(document.querySelector('.ui-snackbar__label')!.textContent).toContain('Saved')
  })

  it('omits the action button when no actionLabel is provided', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved' },
    })

    expect(document.querySelector('.ui-snackbar__action')).toBeNull()
  })

  it('renders the action button and emits `action` plus closes via v-model on click', async () => {
    const wrapper = await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved', actionLabel: 'Undo' },
    })

    const action = document.querySelector('.ui-snackbar__action') as HTMLButtonElement
    expect(action).not.toBeNull()
    expect(action.textContent).toContain('Undo')

    action.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('action')).toHaveLength(1)
    // v-model is closed exactly once (no duplicate emit alongside `action`).
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('prefers the default slot over the label prop', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved' },
      slots: { default: () => 'Custom message' },
    })

    expect(document.querySelector('.ui-snackbar__label')!.textContent).toContain('Custom message')
  })
})
