/**
 * @module useStack
 *
 * @remarks
 * Overlay z-index stacking registry, distilled from `@vuetify/v0`'s `useStack`
 * (without its `createSelection`/`createTrinity`/`createPlugin` dependency
 * chain). One module-level singleton coordinates every overlay in the app
 * (menu, dialog, tooltip, snackbar, sheet) so the most recently activated
 * surface always sits on top.
 *
 * Each consumer `register()`s a ticket, then `select()`/`unselect()`s it as the
 * overlay opens/closes. The z-index is derived from selection order, so callers
 * never hard-code a magic number. Tickets registered inside a component's effect
 * scope auto-unregister on unmount.
 *
 * @example
 * ```ts
 * const stack = useStack()
 * const ticket = stack.register({ onDismiss: () => (isOpen.value = false) })
 * watch(isOpen, v => (v ? ticket.select() : ticket.unselect()))
 * // bind :style="{ zIndex: ticket.zIndex.value }"
 * ```
 */
import { computed, getCurrentScope, onScopeDispose, shallowRef, toRef } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export interface StackTicketInput {
  /** Stable id. Auto-generated when omitted. */
  id?: string
  /** Invoked by `dismiss()` (e.g. scrim click) — typically closes the overlay. */
  onDismiss?: () => void
  /** When `true`, `dismiss()` is a no-op (e.g. modal dialogs requiring an explicit action). */
  blocking?: boolean
}

export interface StackTicket {
  id: string
  blocking: boolean
  onDismiss?: () => void
  /** Computed z-index based on current selection order. */
  zIndex: ComputedRef<number>
  /** Whether this ticket is the topmost selected overlay globally. */
  globalTop: ComputedRef<boolean>
  /** Whether this ticket is currently selected (active). */
  isSelected: ComputedRef<boolean>
  /** Mark the overlay active (push to the top of the stack). */
  select: () => void
  /** Mark the overlay inactive. */
  unselect: () => void
  /** Dismiss the overlay unless it is `blocking`. */
  dismiss: () => void
  /** Remove the ticket from the registry entirely. */
  unregister: () => void
}

export interface StackContext {
  /** Whether any overlay is currently active. */
  isActive: Readonly<Ref<boolean>>
  /** The topmost selected ticket, if any. */
  top: Readonly<Ref<StackTicket | undefined>>
  /** Z-index for a shared scrim (one step below the top overlay). */
  scrimZIndex: Readonly<Ref<number>>
  /** Whether the topmost overlay blocks scrim dismissal. */
  isBlocking: Readonly<Ref<boolean>>
  /** Number of active overlays. */
  size: Readonly<Ref<number>>
  register: (input?: StackTicketInput) => StackTicket
}

export interface StackOptions {
  /** Z-index assigned to the first activated overlay. @default 2000 */
  baseZIndex?: number
  /** Gap between successive overlays (room for overlay-internal popovers). @default 10 */
  increment?: number
}

let uid = 0

export function createStack(options: StackOptions = {}): StackContext {
  const { baseZIndex = 2000, increment = 10 } = options

  // Plain Map — ticket fields are ComputedRefs and must NOT be unwrapped (a
  // `reactive` Map would deep-unwrap them); reactivity is driven by `order`.
  const tickets = new Map<string, StackTicket>()
  // Selection order — index in this array drives the z-index.
  const order = shallowRef<string[]>([])

  const top = toRef(() => {
    const id = order.value.at(-1)
    return id ? tickets.get(id) : undefined
  })
  const isActive = toRef(() => order.value.length > 0)
  const scrimZIndex = toRef(() => {
    const ticket = top.value
    return ticket ? ticket.zIndex.value - 1 : 0
  })
  const isBlocking = toRef(() => top.value?.blocking ?? false)
  const size = toRef(() => order.value.length)

  function select(id: string) {
    if (!tickets.has(id)) return
    // Re-selecting moves the ticket back to the top.
    order.value = [...order.value.filter(existing => existing !== id), id]
  }

  function unselect(id: string) {
    if (!order.value.includes(id)) return
    order.value = order.value.filter(existing => existing !== id)
  }

  function register(input: StackTicketInput = {}): StackTicket {
    const id = input.id ?? `m3-stack-${++uid}`
    const blocking = input.blocking ?? false

    const zIndex = computed(() => {
      const position = order.value.indexOf(id)
      return position === -1 ? baseZIndex : baseZIndex + position * increment
    })
    const globalTop = computed(() => order.value.at(-1) === id)
    const isSelected = computed(() => order.value.includes(id))

    function dismiss() {
      if (blocking) return
      input.onDismiss?.()
      unselect(id)
    }

    function unregister() {
      unselect(id)
      tickets.delete(id)
    }

    const ticket: StackTicket = {
      id,
      blocking,
      onDismiss: input.onDismiss,
      zIndex,
      globalTop,
      isSelected,
      select: () => select(id),
      unselect: () => unselect(id),
      dismiss,
      unregister,
    }

    tickets.set(id, ticket)

    // Auto-cleanup when registered inside a component/effect scope.
    if (getCurrentScope()) {
      onScopeDispose(unregister, true)
    }

    return ticket
  }

  return {
    isActive,
    top,
    scrimZIndex,
    isBlocking,
    size,
    register,
  }
}

// Module-level singleton — overlays are global, so the whole app shares one stack.
let globalStack: StackContext | undefined

/**
 * Returns the shared global overlay stack.
 */
export function useStack(): StackContext {
  if (!globalStack) {
    globalStack = createStack()
  }
  return globalStack
}
