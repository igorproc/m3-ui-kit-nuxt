import { computed, onScopeDispose, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { createRangeKeyboardController } from '../slider/createRangeKeyboardController'
import type { Clock, DialNumber, TimeField } from '#kit/utils/time/createClock'
import type { TimePickerControl, TimePickerLabels } from './useTimePickerControl'

/** Compose waits this long after an hour is let go before turning to minutes. */
const MINUTES_HANDOFF = 100
const DEGREES = 360

export interface TimeDialControlOptions {
  clock: ComputedRef<Clock>
  control: TimePickerControl
  disabled: () => boolean
  readonly: () => boolean
  labels: () => TimePickerLabels
}

export interface TimeDialHand {
  visible: boolean
  /** Degrees clockwise from 12 o'clock, accumulated so it always turns the short way. */
  angle: number
  /** Share of the dial's radius: the outer or the inner ring. */
  length: number
  /** A minute between the five-minute marks: a dot in the handle. */
  between: boolean
  /** Under a dragging pointer: the hand stands under it, with no transition. */
  dragging: boolean
}

export interface TimeDialAttrs {
  'role': 'slider'
  'tabindex': 0 | -1
  'aria-label': string
  'aria-valuemin': number
  'aria-valuemax': number
  'aria-valuenow': number
  'aria-valuetext': string | undefined
  'aria-disabled': true | undefined
  'aria-readonly': true | undefined
  'onKeydown': (event: KeyboardEvent) => void
  'onPointerdown': (event: PointerEvent) => void
  'onPointermove': (event: PointerEvent) => void
  'onPointerup': () => void
  'onPointercancel': () => void
}

export interface UseTimeDialControlReturn {
  dialAttrs: ComputedRef<TimeDialAttrs>
  hand: ComputedRef<TimeDialHand>
  numbers: ComputedRef<Array<DialNumber & { selected: boolean }>>
}

/** The angle equal to `angle` (mod 360) that is nearest to `reference`. */
const nearest = (angle: number, reference: number) =>
  reference + ((((angle - reference) % DEGREES) + DEGREES * 1.5) % DEGREES) - DEGREES / 2

/**
 * The dial of `<MTimePicker>` as one slider: arrows turn the active part by
 * one and wrap past the top, Page keys by ten, a pointer picks and drags.
 * Returns the slider's attribute bag, the hand and the numbers to draw —
 * no class, no `data-*`.
 */
export function useTimeDialControl(options: TimeDialControlOptions): UseTimeDialControlReturn {
  const { control } = options
  const locked = () => options.disabled() || options.readonly()
  const count = () => options.clock.value.count(control.view.value)

  // The hand turns the short way: its angle accumulates rather than jumping
  // from 354° to 0°, which a CSS transition would draw as a full turn back.
  const handAngle = ref(0)
  watch(() => control.time.value ? options.clock.value.angleOf(control.view.value, control.time.value) : null, (target) => {
    if (target !== null) handAngle.value = nearest(target, handAngle.value)
  }, { immediate: true })

  // While a pointer drags, the hand stands under it (as in Compose) instead of
  // chasing each snapped value; on release it settles on the value.
  const dragAngle = ref<number | null>(null)

  const hand = computed<TimeDialHand>(() => {
    const time = control.time.value
    const clock = options.clock.value
    const inner = !!time && clock.isInner(control.view.value, time)
    return {
      visible: !!time,
      angle: dragAngle.value ?? handAngle.value,
      length: inner ? clock.ring.inner : clock.ring.outer,
      between: !!time && control.view.value === 'minutes' && time.minutes % 5 !== 0,
      dragging: dragAngle.value !== null,
    }
  })

  const numbers = computed(() => {
    const time = control.time.value
    const clock = options.clock.value
    const view = control.view.value
    const chosen = !time ? null : view === 'minutes' ? time.minutes : clock.faceHour(time.hours)
    return clock.numbers(view).map(number => ({ ...number, selected: chosen === number.value }))
  })

  // The value sits in the middle of three laps of the dial, so a step past
  // either end lands in a neighbouring lap and folds back: the shared range
  // controller wraps 59 → 0 without a mode of its own.
  const keyboard = createRangeKeyboardController({
    min: () => 0,
    max: () => count() * 3 - 1,
    step: () => 1,
    getValue: () => {
      const time = control.time.value
      return count() + (time ? options.clock.value.indexOf(control.view.value, time) : 0)
    },
    setValue: (lapped) => {
      const view = control.view.value
      control.setPart(view, options.clock.value.fromIndex(view, lapped % count(), control.period.value))
    },
    // The dial turns clockwise in any writing direction.
    rtl: () => false,
  })

  let rect: DOMRect | null = null
  let handoff: ReturnType<typeof setTimeout> | undefined
  onScopeDispose(() => clearTimeout(handoff))

  /** Picks the value under the pointer; returns the pointer's angle, clockwise from 12 o'clock. */
  function pick(event: PointerEvent): number | null {
    if (!rect) return null
    const clock = options.clock.value
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
    // Between the two rings of a 24-hour face, the nearer one wins.
    const inner = Math.hypot(dx, dy) < rect.width * (clock.ring.outer + clock.ring.inner) / 2
    const view = control.view.value
    control.setPart(view, clock.valueAt(view, angle, inner, control.period.value))
    return angle
  }

  // The press itself is left to the browser: it focuses the dial as a pointer
  // focus (no ring), and `user-select: none` / `touch-action: none` already
  // keep a drag from selecting text or scrolling.
  function onPointerdown(event: PointerEvent) {
    if (locked() || event.button !== 0) return
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture?.(event.pointerId)
    rect = target.getBoundingClientRect()
    clearTimeout(handoff)
    pick(event)
  }

  function onPointermove(event: PointerEvent) {
    const angle = pick(event)
    if (angle !== null) dragAngle.value = nearest(angle, dragAngle.value ?? handAngle.value)
  }

  function release() {
    rect = null
    dragAngle.value = null
  }

  function onPointerup() {
    if (!rect) return
    release()
    // Only a pointer hands over to minutes: from the keyboard or a screen
    // reader the hours stay until the user moves on.
    if (control.view.value === 'hours') {
      handoff = setTimeout(() => {
        control.field.value = 'minutes'
      }, MINUTES_HANDOFF)
    }
  }

  // A slider always has a value (`aria-valuenow` is required). With nothing
  // chosen it reports the place the keyboard starts from — the first number of
  // the face — while no hand is drawn and no number is marked.
  function valueNow(clock: Clock, view: TimeField) {
    const time = control.time.value
    if (view === 'minutes') return time ? time.minutes : clock.fromIndex(view, 0, control.period.value)

    return clock.faceHour(time ? time.hours : clock.fromIndex(view, 0, control.period.value))
  }

  const dialAttrs = computed<TimeDialAttrs>(() => {
    const clock = options.clock.value
    const time = control.time.value
    const view = control.view.value
    const { min, max } = clock.range(view)
    const labels = options.labels()
    return {
      'role': 'slider',
      'tabindex': options.disabled() ? -1 : 0,
      'aria-label': view === 'hours' ? labels.hour : labels.minute,
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-valuenow': valueNow(clock, view),
      'aria-valuetext': time ? clock.valueText(view, time) : undefined,
      'aria-disabled': options.disabled() || undefined,
      'aria-readonly': options.readonly() || undefined,
      'onKeydown': (event: KeyboardEvent) => {
        if (!locked()) keyboard.onKeydown(event)
      },
      'onPointerdown': onPointerdown,
      'onPointermove': onPointermove,
      'onPointerup': onPointerup,
      'onPointercancel': release,
    }
  })

  return { dialAttrs, hand, numbers }
}
