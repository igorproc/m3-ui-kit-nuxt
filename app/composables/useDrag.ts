/**
 * @module useDrag
 *
 * @remarks
 * Pointer-based drag-gesture composable built on Pointer Events (covers mouse,
 * touch and pen with one code path). A kit-native primitive intended to power
 * the slider thumb and bottom-sheet swipe-to-dismiss gesture.
 *
 * Key features:
 * - `pointerdown` bound on the target, `pointermove`/`pointerup`/`pointercancel`
 *   subscribed on `window` only while a drag is in progress (via the shared
 *   {@link useGlobalListener} registry)
 * - configurable `threshold` (px the pointer must travel before `isDragging`
 *   flips true), `axis` constraint and `disabled` gate — all `MaybeRefOrGetter`
 * - live readonly `dx`/`dy` deltas (0 when idle) and an `isDragging` flag
 * - `cancel()` aborts an in-progress drag without firing `onEnd`
 * - SSR-safe: no `window` access at setup; listeners go through guarded wrappers
 *
 * @example
 * ```ts
 * import { useDrag } from '~/composables/useDrag'
 *
 * const thumb = useTemplateRef('thumb')
 * const { isDragging, dx } = useDrag(thumb, {
 *   axis: 'x',
 *   onMove: state => (offset.value = state.dx),
 * })
 * ```
 */

// Composables
import { useEventListener } from '~/composables/useEventListener'
import { useGlobalListener } from '~/composables/useGlobalListener'

// Utilities
import { onScopeDispose, readonly, shallowRef, toValue } from 'vue'

// Types
import type { MaybeRefOrGetter, Ref } from 'vue'

export interface DragState {
  startX: number
  startY: number
  x: number
  y: number
  /** `x - startX` (honoring `axis`). */
  dx: number
  /** `y - startY` (honoring `axis`). */
  dy: number
  event: PointerEvent
}

export interface UseDragOptions {
  /** Fired once when `isDragging` first flips true. */
  onStart?: (state: DragState) => void
  /** Fired on every pointer move while dragging. */
  onMove?: (state: DragState) => void
  /** Fired on pointerup/pointercancel when a drag was in progress. */
  onEnd?: (state: DragState) => void
  /** px the pointer must travel before isDragging flips true. @default 0 */
  threshold?: MaybeRefOrGetter<number>
  /** Constrain reported movement. @default 'both' */
  axis?: MaybeRefOrGetter<'x' | 'y' | 'both'>
  /** When true, pointerdown is ignored. @default false */
  disabled?: MaybeRefOrGetter<boolean>
}

export interface UseDragReturn {
  isDragging: Readonly<Ref<boolean>>
  dx: Readonly<Ref<number>>
  dy: Readonly<Ref<number>>
  /** Stop an in-progress drag and remove move/up listeners. */
  cancel: () => void
}

/**
 * Tracks a pointer drag gesture on `target`.
 *
 * @param target Element to bind `pointerdown` to (reactive ref or getter).
 * @param options Gesture callbacks and constraints.
 * @returns Reactive drag state and a `cancel` control.
 *
 * @example
 * ```ts
 * const { isDragging, dx, dy, cancel } = useDrag(el, {
 *   threshold: 4,
 *   onEnd: state => console.log('moved', state.dx, state.dy),
 * })
 * ```
 */
export function useDrag(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseDragOptions = {},
): UseDragReturn {
  const { onStart, onMove, onEnd, threshold, axis, disabled } = options

  const isDragging = shallowRef(false)
  const dx = shallowRef(0)
  const dy = shallowRef(0)

  let startX = 0
  let startY = 0
  let stopMove: (() => void) | undefined
  let stopUp: (() => void) | undefined
  let stopCancelEvent: (() => void) | undefined

  function teardown() {
    stopMove?.()
    stopUp?.()
    stopCancelEvent?.()
    stopMove = undefined
    stopUp = undefined
    stopCancelEvent = undefined
  }

  function reset() {
    teardown()
    isDragging.value = false
    dx.value = 0
    dy.value = 0
  }

  function buildState(event: PointerEvent): DragState {
    const resolvedAxis = toValue(axis) ?? 'both'
    const rawDx = event.clientX - startX
    const rawDy = event.clientY - startY
    const deltaX = resolvedAxis === 'y' ? 0 : rawDx
    const deltaY = resolvedAxis === 'x' ? 0 : rawDy

    return {
      startX,
      startY,
      x: event.clientX,
      y: event.clientY,
      dx: deltaX,
      dy: deltaY,
      event,
    }
  }

  function onPointerMove(event: Event) {
    const state = buildState(event as PointerEvent)

    dx.value = state.dx
    dy.value = state.dy

    if (!isDragging.value) {
      const limit = toValue(threshold) ?? 0
      const distance = Math.hypot(state.dx, state.dy)
      if (distance < limit) return

      isDragging.value = true
      onStart?.(state)
    }

    onMove?.(state)
  }

  function onPointerUp(event: Event) {
    const wasDragging = isDragging.value
    if (wasDragging) {
      onEnd?.(buildState(event as PointerEvent))
    }
    reset()
  }

  function onPointerCancel() {
    reset()
  }

  function onPointerDown(event: Event) {
    if (toValue(disabled)) return

    const pointerEvent = event as PointerEvent

    teardown()
    startX = pointerEvent.clientX
    startY = pointerEvent.clientY
    dx.value = 0
    dy.value = 0
    isDragging.value = false

    stopMove = useGlobalListener('window', 'pointermove', onPointerMove)
    stopUp = useGlobalListener('window', 'pointerup', onPointerUp)
    stopCancelEvent = useGlobalListener('window', 'pointercancel', onPointerCancel)
  }

  /** Abort an in-progress drag without firing `onEnd`. */
  function cancel() {
    reset()
  }

  useEventListener(target, 'pointerdown', onPointerDown)

  onScopeDispose(cancel, true)

  return {
    isDragging: readonly(isDragging),
    dx: readonly(dx),
    dy: readonly(dy),
    cancel,
  }
}
