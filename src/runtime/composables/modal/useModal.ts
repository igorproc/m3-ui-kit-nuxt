/**
 * @module modal/useModal
 *
 * @remarks
 * Programmatic modals — the kit's counterpart of vue-final-modal's `useModal`.
 * Creates a handle for a modal component (usually `MDialog`, `MSheet` or one
 * built on them) that the client-only host in `core/global-container.vue`
 * renders while it is open. The declarative path (`<MDialog v-model>`) stays.
 *
 * The handle mirrors the component's lifecycle: `status` follows
 * `opening → open → closing → closed` from the component's events, and
 * `open()` resolves with the result once the modal is fully closed:
 * `confirm` → its payload (or `true`), `cancel` → `false`, any other close →
 * `null`. Consumer `onConfirm` / `onCancel` / `onOpened` / `onClosed` in
 * `attrs` run first.
 *
 * Called inside an open modal, the new modal becomes its child: closing the
 * parent closes it first.
 *
 * @example
 * ```ts
 * const modal = useModal({
 *   component: MDialog,
 *   attrs: { title: 'Delete file?', onSave: payload => save(payload) },
 *   slots: { default: 'This cannot be undone.' },
 * })
 * const result = await modal.open()
 * ```
 */
import { getCurrentInstance, h, shallowReactive, shallowRef } from 'vue'
import type { Component, Ref, Slot } from 'vue'
import { useNuxtApp } from '#app'
import { injectModalContext } from './useModalContext'
import type { OverlayStatus } from './useModalContext'
import type { DynamicModal, ModalSlot, ModalSlotOptions } from './createModalService'

/** Props of a component, when TypeScript can read them; any record otherwise. */
export type ModalComponentAttrs<C> = C extends abstract new (...args: never) => { $props: infer P }
  ? Partial<P> & Record<string, unknown>
  : Record<string, unknown>

export interface UseModalOptions<C extends Component = Component> {
  component: C
  attrs?: ModalComponentAttrs<C>
  slots?: Record<string, ModalSlot>
  /** Open as soon as the handle is created. @default false */
  defaultModelValue?: boolean
  /** Keep the component mounted (and its state) between openings. @default false */
  keepAlive?: boolean
}

/** Resolved value of `open()`: confirm payload / `true`, `false` on cancel, `null` otherwise. */
export type ModalResult<T = unknown> = T | boolean | null

export interface UseModalReturn<C extends Component = Component, T = unknown> {
  id: string
  status: Readonly<Ref<OverlayStatus>>
  options: Readonly<UseModalOptions<C>>
  open: () => Promise<ModalResult<T>>
  close: () => Promise<void>
  patchOptions: (patch: Partial<UseModalOptions<C>>) => void
  destroy: () => void
}

let uid = 0

/** Marks a component (with attrs) as a modal slot — typed sugar for `slots`. */
export function useModalSlot<C extends Component>(options: { component: C, attrs?: ModalComponentAttrs<C> }): ModalSlotOptions {
  return options
}

function isSlotOptions(slot: ModalSlot): slot is ModalSlotOptions {
  return typeof slot === 'object' && slot !== null && 'component' in slot
}

function toSlotFunctions(slots: Record<string, ModalSlot> = {}): Record<string, Slot> {
  return Object.fromEntries(Object.entries(slots).map(([name, slot]) => {
    if (typeof slot === 'string') return [name, () => slot]
    if (isSlotOptions(slot)) return [name, () => h(slot.component, slot.attrs)]
    return [name, () => h(slot)]
  }))
}

function call(listener: unknown, ...args: unknown[]) {
  if (typeof listener === 'function') listener(...args)
}

export function useModal<C extends Component, T = unknown>(input: UseModalOptions<C>): UseModalReturn<C, T> {
  const service = useNuxtApp().$material.modal
  // Outside a component there is no tree to join (and `inject` would warn).
  const parent = getCurrentInstance() ? injectModalContext() : null
  const id = `m3-modal-${++uid}`

  const options = shallowReactive({ ...input }) as UseModalOptions<C>
  const status = shallowRef<OverlayStatus>('closed')
  const isOpen = shallowRef(false)

  let result: ModalResult<T> | undefined
  let resultWaiters: Array<(value: ModalResult<T>) => void> = []
  const openWaiters: Array<() => void> = []
  const closeWaiters: Array<() => void> = []

  const drain = <V>(waiters: Array<(value: V) => void>, value: V) => waiters.forEach(resolve => resolve(value))

  const record = shallowReactive<DynamicModal>({ id, component: options.component, props: {}, slots: {} })

  function setOpen(value: boolean) {
    isOpen.value = value
    status.value = value ? 'opening' : 'closing'
    render()
  }

  function onClosed() {
    status.value = 'closed'
    if (!options.keepAlive) unmount()
    const value = result ?? null
    result = undefined
    const waiters = resultWaiters
    resultWaiters = []
    drain(waiters, value)
    drain(closeWaiters.splice(0), undefined)
  }

  function render() {
    const attrs = (options.attrs ?? {}) as Record<string, unknown>
    record.component = options.component
    record.slots = toSlotFunctions(options.slots)
    record.props = {
      ...attrs,
      ...(parent ? { parent } : {}),
      'modelValue': isOpen.value,
      'onUpdate:modelValue': (value: boolean) => {
        call(attrs['onUpdate:modelValue'], value)
        if (value !== isOpen.value) setOpen(value)
      },
      'onConfirm': (payload?: unknown) => {
        call(attrs.onConfirm, payload)
        result = (payload === undefined ? true : payload) as ModalResult<T>
        setOpen(false)
      },
      'onCancel': () => {
        call(attrs.onCancel)
        result = false
        setOpen(false)
      },
      'onOpened': () => {
        call(attrs.onOpened)
        status.value = 'open'
        drain(openWaiters.splice(0), undefined)
      },
      'onClosed': () => {
        call(attrs.onClosed)
        onClosed()
      },
    }
  }

  function mount() {
    if (!service.dynamicModals.includes(record)) service.dynamicModals.push(record)
  }

  function unmount() {
    const index = service.dynamicModals.indexOf(record)
    if (index !== -1) service.dynamicModals.splice(index, 1)
  }

  function open(): Promise<ModalResult<T>> {
    const pending = new Promise<ModalResult<T>>(resolve => resultWaiters.push(resolve))
    if (!isOpen.value) {
      mount()
      setOpen(true)
    }
    return pending
  }

  function close(): Promise<void> {
    if (status.value === 'closed') return Promise.resolve()
    const pending = new Promise<void>(resolve => closeWaiters.push(resolve))
    if (isOpen.value) setOpen(false)
    return pending
  }

  function patchOptions(patch: Partial<UseModalOptions<C>>) {
    if (patch.attrs) patch = { ...patch, attrs: { ...options.attrs, ...patch.attrs } as ModalComponentAttrs<C> }
    if (patch.slots) patch = { ...patch, slots: { ...options.slots, ...patch.slots } }
    Object.assign(options, patch)
    render()
  }

  function destroy() {
    unmount()
    unregister()
  }

  const unregister = service.registerHandle({
    id,
    isOpen: () => isOpen.value,
    open: () => {
      if (status.value === 'open') return Promise.resolve()
      const opened = new Promise<void>(resolve => openWaiters.push(resolve))
      void open()
      return opened
    },
    close,
  })

  render()
  if (options.keepAlive) mount()
  if (options.defaultModelValue) void open()

  return { id, status, options, open, close, patchOptions, destroy }
}
