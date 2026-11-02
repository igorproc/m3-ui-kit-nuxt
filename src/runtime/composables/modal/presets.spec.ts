import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useNuxtApp } from '#app'
import GlobalContainer from '#kit/components/core/global-container.vue'
import { __resetScrollLock } from '#kit/composables/overlay/useScrollLock'

const MOUNT_OPTIONS = { global: { stubs: { transition: false } } }
const settle = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms))
const mounted: Array<{ unmount: () => void }> = []

beforeEach(async () => {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
  mounted.push(await mountSuspended(defineComponent({ setup: () => () => h(GlobalContainer) }), MOUNT_OPTIONS))
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  useNuxtApp().$material.modal.dynamicModals.splice(0)
  document.getElementById('ui-overlay-host')?.remove()
  __resetScrollLock()
})

const dialog = () => document.querySelector<HTMLDialogElement>('dialog.ui-overlay')

/** The preset dialog is an async component: its first load takes longer than a frame. */
async function opened() {
  for (let i = 0; i < 40 && !dialog()?.querySelector('.ui-modal-preset__confirm'); i++) await settle(50)
  await settle()
}
const press = (selector: string) => document.querySelector<HTMLElement>(selector)!.click()

describe('$material.modal presets', () => {
  describe('confirm', () => {
    it('asks in an alertdialog described by its text', async () => {
      void useNuxtApp().$material.modal.confirm({ title: 'Delete file?', text: 'It cannot be restored.', confirmLabel: 'Delete', cancelLabel: 'Keep' })
      await opened()

      expect(dialog()!.getAttribute('role')).toBe('alertdialog')
      expect(document.getElementById(dialog()!.getAttribute('aria-describedby')!)!.textContent).toContain('It cannot be restored.')
      expect(document.querySelector('.ui-modal-preset__cancel')!.textContent?.trim()).toBe('Keep')
    })

    it.each([
      ['.ui-modal-preset__confirm', true],
      ['.ui-modal-preset__cancel', false],
    ] as const)('resolves %s as %s once closed, and leaves nothing behind', async (button, answer) => {
      const result = useNuxtApp().$material.modal.confirm({ title: 'Delete file?', confirmLabel: 'Delete', cancelLabel: 'Keep' })
      await opened()

      press(button)
      await settle()

      await expect(result).resolves.toBe(answer)
      expect(useNuxtApp().$material.modal.dynamicModals).toHaveLength(0)
    })

    it('resolves Escape as false', async () => {
      const result = useNuxtApp().$material.modal.confirm({ title: 'Delete file?', confirmLabel: 'Delete', cancelLabel: 'Keep' })
      await opened()

      dialog()!.dispatchEvent(new Event('cancel', { cancelable: true }))
      await settle()

      await expect(result).resolves.toBe(false)
    })

    it('waits for an async confirm and stays open when it fails', async () => {
      let attempts = 0
      const result = useNuxtApp().$material.modal.confirm({
        title: 'Delete file?',
        confirmLabel: 'Delete',
        cancelLabel: 'Keep',
        onConfirm: () => (++attempts === 1 ? Promise.reject(new Error('offline')) : Promise.resolve()),
      })
      await opened()

      press('.ui-modal-preset__confirm')
      await settle()
      expect(dialog()?.open).toBe(true)

      press('.ui-modal-preset__confirm')
      await settle()
      await expect(result).resolves.toBe(true)
      expect(attempts).toBe(2)
    })
  })

  describe('alert', () => {
    it('shows one button and resolves once it is pressed', async () => {
      const result = useNuxtApp().$material.modal.alert({ title: 'Saved', confirmLabel: 'OK' })
      await opened()

      expect(document.querySelector('.ui-modal-preset__cancel')).toBeNull()
      press('.ui-modal-preset__confirm')
      await settle()

      await expect(result).resolves.toBeUndefined()
    })
  })
})
