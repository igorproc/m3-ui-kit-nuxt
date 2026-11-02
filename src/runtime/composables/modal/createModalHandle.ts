import { defineComponent, h, markRaw, shallowReactive, shallowRef } from 'vue'
import type { Component, Slot } from 'vue'
import { provideModalOwner } from './useModalContext'
import type { M3ModalContext, ModalOwner, OverlayStatus } from './useModalContext'
import type { DynamicModal, ModalService, ModalSlot, ModalSlotOptions } from './createModalService'
import type { MModalCancelReason } from './useModalResult'
import type { ModalComponentAttrs, ModalDismissReason, ModalResult, UseModalOptions, UseModalReturn } from './useModal'

export type ModalHandleHost = Pick<ModalService, 'dynamicModals' | 'nextHandleId' | 'registerHandle'>

function isSlotOptions(slot: ModalSlot): slot is ModalSlotOptions {
  return typeof slot === 'object' && slot !== null && 'component' in slot
}

function toSlotFunctions(slots: Record<string, ModalSlot> = {}): Record<string, Slot> {
  return Object.fromEntries(Object.entries(slots).map(([name, slot]) => {
    if (typeof slot === 'string') return [name, () => slot]
    if (isSlotOptions(slot)) return [name, (scope?: Record<string, unknown>) => h(slot.component, { ...scope, ...slot.attrs })]
    return [name, (scope?: Record<string, unknown>) => h(slot, scope)]
  }))
}

function call(listener: unknown, ...args: unknown[]) {
  if (typeof listener === 'function') listener(...args)
}

function ownedBy(owner: ModalOwner, component: () => Component): Component {
  return markRaw(defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      provideModalOwner(owner)
      return () => h(component(), attrs, slots)
    },
  }))
}

export function createModalHandle<C extends Component, T = unknown>(
  host: ModalHandleHost,
  input: UseModalOptions<C>,
  parent: M3ModalContext | null,
): UseModalReturn<C, T> {
  const id = host.nextHandleId()

  const options = shallowReactive({ ...input }) as UseModalOptions<C>
  const status = shallowRef<OverlayStatus>('closed')
  const isOpen = shallowRef(false)

  let answer: ModalResult<T> | undefined
  let closeReason: ModalDismissReason | undefined
  let resultWaiters: Array<(value: ModalResult<T>) => void> = []
  const openWaiters: Array<() => void> = []
  const closeWaiters: Array<() => void> = []

  const drain = <V>(waiters: Array<(value: V) => void>, value: V) => waiters.forEach(resolve => resolve(value))

  const owner: ModalOwner = { close: reason => close(reason) }
  const record = shallowReactive<DynamicModal>({ id, component: ownedBy(owner, () => options.component), props: {}, slots: {} })

  function setOpen(value: boolean) {
    isOpen.value = value
    status.value = value ? 'opening' : 'closing'
    render()
  }

  function answerOnce(value: ModalResult<T>) {
    if (status.value === 'closed') return
    answer ??= value
    setOpen(false)
  }

  function dismissReason(): ModalDismissReason {
    if (closeReason) return closeReason
    return parent?.status.value === 'closing' ? 'parent-closed' : 'programmatic'
  }

  function onClosed() {
    status.value = 'closed'
    if (!options.keepAlive) unmount()
    const value: ModalResult<T> = answer ?? { status: 'cancelled', reason: dismissReason() }
    answer = undefined
    closeReason = undefined
    const waiters = resultWaiters
    resultWaiters = []
    drain(waiters, value)
    drain(closeWaiters.splice(0), undefined)
  }

  function render() {
    const attrs = (options.attrs ?? {}) as Record<string, unknown>
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
        answerOnce({ status: 'confirmed', value: payload as T })
      },
      'onCancel': (reason: MModalCancelReason = 'cancel') => {
        call(attrs.onCancel, reason)
        answerOnce({ status: 'cancelled', reason })
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
    if (!host.dynamicModals.includes(record)) host.dynamicModals.push(record)
  }

  function unmount() {
    const index = host.dynamicModals.indexOf(record)
    if (index !== -1) host.dynamicModals.splice(index, 1)
  }

  function open(): Promise<ModalResult<T>> {
    const pending = new Promise<ModalResult<T>>(resolve => resultWaiters.push(resolve))
    if (!isOpen.value) {
      mount()
      setOpen(true)
    }
    return pending
  }

  function close(reason?: ModalDismissReason): Promise<void> {
    if (status.value === 'closed') return Promise.resolve()
    if (!answer) closeReason ??= reason
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

  const unregister = host.registerHandle({
    id,
    isOpen: () => isOpen.value,
    open: () => {
      if (status.value === 'open') return Promise.resolve()
      const opened = new Promise<void>(resolve => openWaiters.push(resolve))
      void open()
      return opened
    },
    close: () => close(),
  })

  function destroy() {
    unmount()
    unregister()
  }

  render()
  if (options.keepAlive) mount()
  if (options.defaultModelValue) void open()

  return { id, status, options, open, close, patchOptions, destroy }
}
