import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useNuxtApp } from '#app'
import GlobalContainer from '#kit/components/core/global-container.vue'
import MDialog from '#kit/components/ui/dialog/index.vue'
import { __resetScrollLock } from '#kit/composables/overlay/useScrollLock'
import { useModal } from './useModal'
import type { UseModalOptions, UseModalReturn } from './useModal'

// Real transitions: the handle settles on the dialog's `opened` / `closed`.
const MOUNT_OPTIONS = { global: { stubs: { transition: false } } }
const settle = () => new Promise(resolve => setTimeout(resolve, 50))

const mounted: Array<{ unmount: () => void }> = []

beforeEach(() => {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  // The registry outlives each mount; drop records a test left open.
  useNuxtApp().$material.modal.dynamicModals.splice(0)
  document.getElementById('ui-overlay-host')?.remove()
  __resetScrollLock()
})

/** Mounts the programmatic-modal host and creates a handle inside a component. */
async function setup(options: Partial<UseModalOptions<typeof MDialog>> = {}) {
  let modal!: UseModalReturn<typeof MDialog>
  const Harness = defineComponent({
    setup() {
      modal = useModal({ component: MDialog, attrs: { title: 'Delete?' }, slots: { default: 'Body' }, ...options })
      return () => h(GlobalContainer)
    },
  })
  mounted.push(await mountSuspended(Harness, MOUNT_OPTIONS))
  return modal
}

const dialogRoot = () => document.querySelector('dialog.ui-overlay') as HTMLDialogElement | null

/** Listeners the handle binds on its component — what the dialog would emit. */
function listenersOf(modal: UseModalReturn<typeof MDialog>) {
  const record = useNuxtApp().$material.modal.dynamicModals.find(entry => entry.id === modal.id)!
  return record.props as { onConfirm: (payload?: unknown) => void, onCancel: () => void }
}

describe('useModal', () => {
  it('renders nothing until opened', async () => {
    await setup()

    expect(dialogRoot()).toBeNull()
    expect(useNuxtApp().$material.modal.dynamicModals).toHaveLength(0)
  })

  it('opens through the host and follows the status', async () => {
    const modal = await setup()

    void modal.open()
    expect(modal.status.value).toBe('opening')
    await settle()

    expect(dialogRoot()?.open).toBe(true)
    expect(document.querySelector('.ui-dialog__headline')?.textContent).toBe('Delete?')
    expect(document.querySelector('.ui-dialog__content')?.textContent).toContain('Body')
    expect(modal.status.value).toBe('open')
  })

  it('resolves open() with the confirm payload and unmounts once closed', async () => {
    const received: unknown[] = []
    const modal = await setup({ attrs: { title: 'Delete?', onConfirm: (payload: unknown) => received.push(payload) } })

    const result = modal.open()
    await settle()
    listenersOf(modal).onConfirm('yes')
    await settle()

    await expect(result).resolves.toBe('yes')
    expect(received).toEqual(['yes'])
    expect(modal.status.value).toBe('closed')
    expect(useNuxtApp().$material.modal.dynamicModals).toHaveLength(0)
  })

  it('resolves false on cancel and null on a plain close', async () => {
    const modal = await setup()

    const cancelled = modal.open()
    await settle()
    listenersOf(modal).onCancel()
    await settle()
    await expect(cancelled).resolves.toBe(false)

    const dismissed = modal.open()
    await settle()
    await Promise.all([modal.close(), settle()])
    await expect(dismissed).resolves.toBeNull()
  })

  it('is addressable by id through $material.modal', async () => {
    const modal = await setup()
    const service = useNuxtApp().$material.modal

    const opened = service.open(modal.id)
    await settle()
    await opened
    expect(modal.status.value).toBe('open')

    const closed = service.close(modal.id)
    await settle()
    await closed
    expect(modal.status.value).toBe('closed')
  })

  it('keeps the component mounted between openings with keepAlive', async () => {
    const modal = await setup({ keepAlive: true })
    const service = useNuxtApp().$material.modal

    expect(service.dynamicModals).toHaveLength(1)
    void modal.open()
    await settle()
    await Promise.all([modal.close(), settle()])

    expect(service.dynamicModals).toHaveLength(1)
    modal.destroy()
    expect(service.dynamicModals).toHaveLength(0)
  })
})
