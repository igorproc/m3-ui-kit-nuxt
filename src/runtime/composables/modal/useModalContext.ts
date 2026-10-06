/**
 * @module modal/useModalContext
 *
 * @remarks
 * Parent → child tree of open modals, used for cascade closing: closing a modal
 * first closes (and awaits) every modal opened inside it. Each `<MOverlay>` in
 * modal mode registers itself here; nested ones find their parent through
 * `provide`/`inject`, programmatic ones get it passed as the `parent` prop.
 *
 * Internal to the kit — consumers open modals through `<MDialog v-model>` or
 * `useModal()` / `$material.modal`.
 */
import { onBeforeUnmount, shallowRef } from 'vue'
import type { Ref } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { PopoverStatus } from '#kit/composables/popover/usePopover'

/** Overlay lifecycle — same states as the popover FSM. */
export type OverlayStatus = PopoverStatus

export interface M3ModalContext {
  id: string
  parent: M3ModalContext | null
  children: Ref<M3ModalContext[]>
  status: Readonly<Ref<OverlayStatus>>
  /** Closes this modal (children first) and resolves once it is fully closed. */
  close: () => Promise<void>
}

// Nullable: a root modal has no parent, so the default is `null` instead of throwing.
const [injectModalContext, provideModalContext] = createContext<M3ModalContext | null>('m3:modal', null)

export { injectModalContext }

export interface UseModalContextOptions {
  id: string
  status: Readonly<Ref<OverlayStatus>>
  close: () => Promise<void>
  /** Explicit parent (programmatic modals); `undefined` injects the nearest one. */
  parent?: M3ModalContext | null
}

/** Registers the calling modal in the tree and provides it to its descendants. */
export function useModalContext(options: UseModalContextOptions): M3ModalContext {
  const parent = options.parent !== undefined ? options.parent : injectModalContext()

  const context: M3ModalContext = {
    id: options.id,
    parent,
    children: shallowRef<M3ModalContext[]>([]),
    status: options.status,
    close: options.close,
  }

  if (parent) {
    parent.children.value = [...parent.children.value, context]
    onBeforeUnmount(() => {
      parent.children.value = parent.children.value.filter(child => child !== context)
    })
  }

  provideModalContext(context)

  return context
}

/** Closes every open child and waits for all of them to finish closing. */
export async function closeModalChildren(context: M3ModalContext): Promise<void> {
  const open = context.children.value.filter(child => child.status.value !== 'closed')
  await Promise.all(open.map(child => child.close()))
}
