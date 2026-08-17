/**
 * @module useModal
 *
 * @remarks
 * Composable for managing modal and overlay state. It provides a local Context API
 * wrapper around `vue-final-modal` (VFM) to manage atomic, deeply nested modals.
 *
 * @example
 * ```ts
 * const { close } = useModal({
 *   visible: modelValue,
 *   parent: props.parent,
 * })
 * ```
 */
import type { Component, Ref } from 'vue'
import { useModal as useVfmModal } from 'vue-final-modal'
import { createContext } from '#kit/shared/utils/createContext'

export interface M3ModalContext {
  id: string
  parent: M3ModalContext | null
  children: Ref<M3ModalContext[]>
  close: () => void
}

// Nullable context: a root modal has no parent (`null`), so the default is
// `null` rather than throw-on-missing — child modals inject the nearest parent.
const [useModalContext, provideModalContext] = createContext<M3ModalContext | null>('m3:modal', null)

/**
 * Composable for registering a modal component in the Context API tree.
 *
 * @param options Registration options for the modal.
 * @returns The modal context including hierarchy refs and close controls.
 *
 * @remarks
 * Modals automatically inject their parent context or can accept it explicitly
 * for programmatic invocations.
 */
export function useModal(options?: {
  id?: string
  visible?: Ref<boolean>
  parent?: M3ModalContext | null
  onClose?: () => void
}) {
  // Inject parent context from template tree, or allow explicit parent override for programmatic modals
  const parent = options?.parent !== undefined
    ? options.parent
    : useModalContext()

  // Cast guards against Vue's deep `UnwrapRef` expanding the self-referential
  // `M3ModalContext` (its `children` is itself a `Ref`) into a structural type.
  const children = ref<M3ModalContext[]>([]) as unknown as Ref<M3ModalContext[]>

  const id = options?.id || Math.random().toString(36).substring(2, 9)

  const close = () => {
    if (options?.visible) {
      options.visible.value = false
    }
    if (options?.onClose) {
      options.onClose()
    }
  }

  const context: M3ModalContext = {
    id,
    parent,
    children,
    close,
  }

  // Register in parent context
  if (parent) {
    parent.children.value.push(context)
    onBeforeUnmount(() => {
      parent.children.value = parent.children.value.filter(child => child.id !== id)
    })
  }

  // Provide for any deeply nested children
  provideModalContext(context)

  return {
    id,
    parent,
    children,
    close,
  }
}

/**
 * Programmatically opens a modal and returns a Promise that resolves when the modal is closed.
 * Automatically injects the current modal context so the programmatic modal participates in cascading closures.
 *
 * @param component The Vue component to render inside the modal.
 * @param props Props to pass to the modal component.
 * @param slots Slots to pass to the modal component.
 * @param parentContext Explicit parent context to maintain hierarchy.
 * @returns A promise that resolves with the confirmed data (if any), or `false` on cancellation.
 *
 * @example
 * ```ts
 * const confirmed = await openModal(UiDialog, { title: 'Are you sure?' })
 * if (confirmed) {
 *   // proceed
 * }
 * ```
 */
export function openModal<T = unknown>(
  component: unknown,
  props: Record<string, unknown> = {},
  slots: Record<string, unknown> = {},
  parentContext?: M3ModalContext | null,
): Promise<T | null> {
  return new Promise((resolve) => {
    let resolved = false

    const { open, close, destroy } = useVfmModal({
      component: component as Component,
      attrs: {
        ...props,
        'parent': parentContext, // Explicitly pass parent context to the dynamically rendered component
        'modelValue': true,
        'onUpdate:modelValue': (value: boolean) => {
          if (!value && !resolved) {
            resolved = true
            resolve(null)
            close()
          }
        },
        'onConfirm': (data: unknown) => {
          if (!resolved) {
            resolved = true
            resolve(data ? (data as T) : (true as T))
            close()
          }
        },
        'onCancel': () => {
          if (!resolved) {
            resolved = true
            resolve(false as T)
            close()
          }
        },
        'onClosed': () => {
          destroy()
        },
      },
      slots,
    })

    open()
  })
}
