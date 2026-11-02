/**
 * @module overlay/useOverlaySwipe
 *
 * @remarks
 * Swipe-to-close for modal-layer content, built on {@link useDrag}. Only travel
 * in the closing direction moves the content (the opposite way is clamped to
 * zero); a fling dismisses at any length, a slow release only past
 * `threshold`, anything else snaps back.
 */
import { computed, shallowRef, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import { useDrag } from '#kit/composables/useDrag'
import type { DragState } from '#kit/composables/useDrag'
import type { MOverlaySwipeDirection } from '#kit/components/ui/overlay/props'
import { addSwipeSample, releaseVelocity, resolveSwipe } from '#kit/utils/overlay/swipe'
import type { SwipeSample } from '#kit/utils/overlay/swipe'

export interface UseOverlaySwipeOptions {
  direction: MaybeRefOrGetter<MOverlaySwipeDirection>
  /** Travel, in rem, past which a slow release closes. */
  threshold: MaybeRefOrGetter<number>
  disabled: MaybeRefOrGetter<boolean>
  onDismiss: () => void
}

export interface UseOverlaySwipeReturn {
  isDragging: Readonly<Ref<boolean>>
  swipeStyle: ComputedRef<{ transform: string, transition: string } | undefined>
}

const M3_VELOCITY_THRESHOLD_REM_PER_S = 125
const M3_TOUCH_SLOP_REM = 8

const remInPixels = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

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
): UseOverlaySwipeReturn {
  const offset = shallowRef(0)
  const direction = () => toValue(options.direction)
  let samples: SwipeSample[] = []

  const record = (state: DragState) => {
    samples = addSwipeSample(samples, { time: state.event.timeStamp, travel: travel(direction(), state) })
  }

  function release(state: DragState) {
    record(state)
    const rem = remInPixels()
    const outcome = resolveSwipe(travel(direction(), state) / rem, releaseVelocity(samples) / rem, {
      threshold: toValue(options.threshold),
      velocityThreshold: M3_VELOCITY_THRESHOLD_REM_PER_S,
      slop: M3_TOUCH_SLOP_REM,
    })
    samples = []
    if (outcome === 'dismiss') options.onDismiss()
  }

  const { isDragging } = useDrag(target, {
    axis: () => AXIS[direction()],
    disabled: () => direction() === 'none' || toValue(options.disabled),
    onStart: () => {
      samples = []
    },
    onMove: (state) => {
      record(state)
      offset.value = Math.max(0, travel(direction(), state))
    },
    onEnd: (state) => {
      release(state)
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
