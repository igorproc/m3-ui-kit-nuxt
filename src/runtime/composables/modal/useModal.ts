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
 * `open()` resolves once the modal is fully closed, never rejects on a close:
 * `{ status: 'confirmed', value }` with the `confirm` payload exactly as sent
 * (`false`, `0` and `''` included), or `{ status: 'cancelled', reason }` —
 * `cancel` with its reason, `programmatic` for `close()` / the registry, and
 * `parent-closed` when the modal it was opened in closed. Consumer
 * `onConfirm` / `onCancel` / `onOpened` / `onClosed` in `attrs` run first.
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
 * if (result.status === 'confirmed') remove(file)
 * ```
 */
import { getCurrentInstance } from 'vue'
import type { Component, Ref } from 'vue'
import { useNuxtApp } from '#app'
import { injectModalContext } from './useModalContext'
import type { OverlayStatus } from './useModalContext'
import type { ModalSlot, ModalSlotOptions } from './createModalService'
import type { MModalCancelReason } from './useModalResult'
import { createModalHandle } from './createModalHandle'

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

/** Why a modal ended without a confirmation. */
export type ModalDismissReason = MModalCancelReason | 'programmatic' | 'parent-closed'

/** Resolved value of `open()`: the confirmed payload, or why the modal was dismissed. */
export type ModalResult<T = unknown>
  = | { status: 'confirmed', value: T }
    | { status: 'cancelled', reason: ModalDismissReason }

export interface UseModalReturn<C extends Component = Component, T = unknown> {
  id: string
  status: Readonly<Ref<OverlayStatus>>
  options: Readonly<UseModalOptions<C>>
  open: () => Promise<ModalResult<T>>
  /** Closes the modal; an open `open()` resolves cancelled with `reason` (`programmatic` by default). */
  close: (reason?: ModalDismissReason) => Promise<void>
  patchOptions: (patch: Partial<UseModalOptions<C>>) => void
  destroy: () => void
}

/** Marks a component (with attrs) as a modal slot — typed sugar for `slots`. */
export function useModalSlot<C extends Component>(options: { component: C, attrs?: ModalComponentAttrs<C> }): ModalSlotOptions {
  return options
}

export function useModal<C extends Component, T = unknown>(input: UseModalOptions<C>): UseModalReturn<C, T> {
  // Outside a component there is no tree to join (and `inject` would warn).
  const parent = getCurrentInstance() ? injectModalContext() : null
  return createModalHandle<C, T>(useNuxtApp().$material.modal, input, parent)
}
