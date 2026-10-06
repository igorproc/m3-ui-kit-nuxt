/**
 * @module overlay/useOverlaySwipe
 *
 * @remarks
 * Swipe-to-close for modal-layer content, built on {@link useDrag}. Only travel
 * in the closing direction moves the content (the opposite way is clamped to
 * zero); releasing past `threshold` dismisses, anything shorter snaps back.
 */
import { computed, shallowRef, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useDrag } from '#kit/composables/useDrag'
import type { DragState } from '#kit/composables/useDrag'
import type { MOverlaySwipeDirection } from '#kit/components/ui/overlay/props'

export interface UseOverlaySwipeOptions {
  direction: MaybeRefOrGetter<MOverlaySwipeDirection>
  threshold: MaybeRefOrGetter<number>
  disabled: MaybeRefOrGetter<boolean>
  onDismiss: () => void
}

const AXIS: Record<MOverlaySwipeDirection, 'x' | 'y' | 'both'> = {
  none: 'both',
  up: 'y',
  down: 'y',
  left: 'x',
  right: 'x',
}

/** Signed travel towards the closing edge. */
function travel(direction: MOverlaySwipeDirection, state: DragState): number {
  switch (direction) {
    case 'up': return -state.dy
    case 'down': return state.dy
    case 'left': return -state.dx
    case 'right': return state.dx
    default: return 0
  }
}

export function useOverlaySwipe(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseOverlaySwipeOptions,
) {
  const offset = shallowRef(0)
  const direction = () => toValue(options.direction)

  const { isDragging } = useDrag(target, {
    axis: () => AXIS[direction()],
    disabled: () => direction() === 'none' || toValue(options.disabled),
    onMove: (state) => {
      offset.value = Math.max(0, travel(direction(), state))
    },
    onEnd: (state) => {
      if (travel(direction(), state) > toValue(options.threshold)) options.onDismiss()
      offset.value = 0
    },
  })

  /** Inline style for the dragged content; transitions are off for 1:1 tracking. */
  const swipeStyle = computed(() => {
    if (!isDragging.value || offset.value === 0) return undefined

    const distance = `${offset.value}px`
    const translate = {
      none: 'none',
      up: `translateY(-${distance})`,
      down: `translateY(${distance})`,
      left: `translateX(-${distance})`,
      right: `translateX(${distance})`,
    }[direction()]

    return { transform: translate, transition: 'none' }
  })

  return { isDragging, swipeStyle }
}
