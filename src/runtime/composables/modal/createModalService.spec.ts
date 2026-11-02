import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useNuxtApp } from '#app'
import GlobalContainer from '#kit/components/core/global-container.vue'
import MDialog from '#kit/components/ui/dialog/index.vue'
import { mountTracked, settle, until, useOverlayHost } from '#kit/components/ui/overlay/tests/helpers'
import { useModal } from './useModal'
import type { ModalResult, UseModalReturn } from './useModal'

useOverlayHost()

afterEach(() => {
  useNuxtApp().$material.modal.dynamicModals.splice(0)
})

const service = () => useNuxtApp().$material.modal
const dialogs = () => Array.from(document.querySelectorAll<HTMLDialogElement>('dialog.ui-overlay'))
const dialogTitled = (title: string) => dialogs().find(dialog => dialog.querySelector('.ui-dialog__headline')?.textContent === title)!
const pressEscape = (dialog: HTMLDialogElement) => dialog.dispatchEvent(new Event('cancel', { cancelable: true }))

interface Listeners { onConfirm: (payload?: unknown) => void, onCancel: (reason?: string) => void }
const lastListeners = () => service().dynamicModals.at(-1)!.props as unknown as Listeners

async function mountHost(content: () => unknown = () => null) {
  return mountTracked(defineComponent({ setup: () => () => [content(), h(GlobalContainer)] }), { attachTo: document.body })
}

function track<T>(pending: Promise<ModalResult<T>>) {
  const resolutions: Array<ModalResult<T>> = []
  void pending.then(result => resolutions.push(result))
  return resolutions
}

describe('$material.modal', () => {
  describe('open(component)', () => {
    it('opens a component with its props and resolves with the confirmed payload, then lets it go', async () => {
      await mountHost()

      const result = service().open<string>(MDialog, { props: { title: 'Rename' }, slots: { default: 'New name' } })
      await settle()
      expect(dialogTitled('Rename').open).toBe(true)

      lastListeners().onConfirm('draft')
      await expect(result).resolves.toEqual({ status: 'confirmed', value: 'draft' })
      expect(service().dynamicModals).toHaveLength(0)
    })

    it('resolves a user dismissal as cancelled with its reason', async () => {
      await mountHost()

      const result = service().open(MDialog, { props: { title: 'Rename' } })
      await settle()
      pressEscape(dialogTitled('Rename'))

      await expect(result).resolves.toEqual({ status: 'cancelled', reason: 'escape' })
    })

    it('still opens a registered modal by id', async () => {
      await mountHost()
      const handle = useModal({ component: MDialog, attrs: { title: 'By id' } })

      await Promise.all([service().open(handle.id), settle()])

      expect(handle.status.value).toBe('open')
    })
  })

  describe('competing events', () => {
    it('resolves once, with the first answer, however many follow', async () => {
      await mountHost()

      const result = service().open(MDialog, { props: { title: 'Race' } })
      const resolutions = track(result)
      await settle()
      lastListeners().onConfirm(0)
      lastListeners().onCancel('cancel')
      void service().closeTop('cancel')
      pressEscape(dialogTitled('Race'))
      await until(() => resolutions.length > 0)
      await settle()

      expect(resolutions).toEqual([{ status: 'confirmed', value: 0 }])
    })
  })

  describe('closeTop', () => {
    it('closes only the topmost open modal, with the reason given', async () => {
      await mountHost()

      const below = track(service().open(MDialog, { props: { title: 'Below' } }))
      await settle()
      const top = service().open(MDialog, { props: { title: 'Top' } })
      await settle()
      await Promise.all([service().closeTop('cancel'), settle()])

      await expect(top).resolves.toEqual({ status: 'cancelled', reason: 'cancel' })
      expect(below).toEqual([])
      expect(dialogTitled('Below').open).toBe(true)
    })

    it('reads a close without a reason as programmatic', async () => {
      await mountHost()

      const result = service().open(MDialog, { props: { title: 'Only' } })
      await settle()
      await Promise.all([service().closeTop(), settle()])

      await expect(result).resolves.toEqual({ status: 'cancelled', reason: 'programmatic' })
    })
  })

  describe('closeAll and persistent', () => {
    it('closes persistent modals, programmatic and declarative, which Escape does not', async () => {
      const declarative = ref(true)
      await mountHost(() => h(MDialog, {
        'title': 'Declared',
        'persistent': true,
        'modelValue': declarative.value,
        'onUpdate:modelValue': (value: boolean) => { declarative.value = value },
      }))
      const programmatic = service().open(MDialog, { props: { title: 'Saving', persistent: true } })
      await settle()

      pressEscape(dialogTitled('Saving'))
      pressEscape(dialogTitled('Declared'))
      await settle()
      expect(dialogs()).toHaveLength(2)

      await Promise.all([service().closeAll('programmatic'), settle()])

      await expect(programmatic).resolves.toEqual({ status: 'cancelled', reason: 'programmatic' })
      expect(declarative.value).toBe(false)
    })
  })

  describe('nesting', () => {
    async function mountParent() {
      const parentOpen = ref(true)
      let child!: UseModalReturn<typeof MDialog>
      const Opener = defineComponent({
        setup() {
          child = useModal({ component: MDialog, attrs: { title: 'Child' }, slots: { default: 'Child body' } })
          return () => h('button', { class: 'open-child' }, 'Open child')
        },
      })
      await mountHost(() => h(MDialog, {
        'title': 'Parent',
        'modelValue': parentOpen.value,
        'onUpdate:modelValue': (value: boolean) => { parentOpen.value = value },
      }, { default: () => h(Opener) }))
      await settle()
      return { parentOpen, child: () => child, opener: () => document.querySelector<HTMLElement>('.open-child')! }
    }

    it('gives focus back to the parent once the child closes', async () => {
      const { child, opener } = await mountParent()

      opener().focus()
      const result = child().open()
      await settle()
      expect(document.activeElement).not.toBe(opener())

      pressEscape(dialogTitled('Child'))
      await expect(result).resolves.toEqual({ status: 'cancelled', reason: 'escape' })
      await settle()

      expect(document.activeElement).toBe(opener())
      expect(dialogTitled('Parent').open).toBe(true)
    })

    it('closes the child first, as parent-closed, when the parent closes', async () => {
      const { parentOpen, child } = await mountParent()

      const result = child().open()
      await settle()
      parentOpen.value = false

      await expect(result).resolves.toEqual({ status: 'cancelled', reason: 'parent-closed' })
      await until(() => dialogs().length === 0)
      expect(dialogs()).toHaveLength(0)
    })

    it('opens a service modal as a root: closing the parent leaves it open', async () => {
      const { parentOpen } = await mountParent()

      const root = track(service().open(MDialog, { props: { title: 'Root' } }))
      await settle()
      parentOpen.value = false
      await until(() => !dialogs().some(dialog => dialog.querySelector('.ui-dialog__headline')?.textContent === 'Parent'))
      await settle()

      expect(root).toEqual([])
      expect(dialogTitled('Root').open).toBe(true)
    })
  })

  describe('server', () => {
    it('renders no modal opened through the service into the server HTML', async () => {
      void service().open(MDialog, { props: { title: 'Server' } })

      const html = await renderToString(createSSRApp(defineComponent({ render: () => h(GlobalContainer) })))

      expect(service().dynamicModals).toHaveLength(1)
      expect(html).toContain('ui-dialog-global-container')
      expect(html).not.toContain('Server')
    })
  })
})
