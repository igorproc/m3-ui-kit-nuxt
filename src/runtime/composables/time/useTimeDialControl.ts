import { computed, onScopeDispose, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { createRangeKeyboardController } from '../slider/createRangeKeyboardController'
import type { Clock, TimeField } from './createClock'
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

/**
 * The dial of `<MTimePicker>` as one slider: arrows turn the active part by
 * one and wrap past the top, Page keys by ten, a pointer picks and drags.
 * Returns the slider's attribute bag, the hand and the numbers to draw —
 * no class, no `data-*`.
 */
export function useTimeDialControl(options: TimeDialControlOptions) {
  const { control } = options
  const locked = () => options.disabled() || options.readonly()
  const count = () => options.clock.value.count(control.view.value)

  // The hand turns the short way: its angle accumulates rather than jumping
  // from 354° to 0°, which a CSS transition would draw as a full turn back.
  const handAngle = ref(0)
  watch(() => control.time.value ? options.clock.value.angleOf(control.view.value, control.time.value) : null, (target) => {
    if (target === null) return
    const current = ((handAngle.value % DEGREES) + DEGREES) % DEGREES
    handAngle.value += ((target - current + DEGREES * 1.5) % DEGREES) - DEGREES / 2
  }, { immediate: true })

  const hand = computed(() => {
    const time = control.time.value
    const clock = options.clock.value
    const inner = !!time && clock.isInner(control.view.value, time)
    return {
      visible: !!time,
      angle: handAngle.value,
      length: inner ? clock.ring.inner : clock.ring.outer,
      // A minute between the five-minute marks shows as a dot in the handle.
      between: !!time && control.view.value === 'minutes' && time.minutes % 5 !== 0,
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

  function pick(event: PointerEvent) {
    if (!rect) return
    const clock = options.clock.value
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
    // Between the two rings of a 24-hour face, the nearer one wins.
    const inner = Math.hypot(dx, dy) < rect.width * (clock.ring.outer + clock.ring.inner) / 2
    const view = control.view.value
    control.setPart(view, clock.valueAt(view, angle, inner, control.period.value))
  }

  function onPointerdown(event: PointerEvent) {
    if (locked() || event.button !== 0) return
    const target = event.currentTarget as HTMLElement
    // No text selection while dragging; the focus is moved by hand instead.
    event.preventDefault()
    target.focus({ preventScroll: true })
    target.setPointerCapture?.(event.pointerId)
    rect = target.getBoundingClientRect()
    clearTimeout(handoff)
    pick(event)
  }

  function onPointerup() {
    if (!rect) return
    rect = null
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

  const dialAttrs = computed(() => {
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
      'onPointermove': (event: PointerEvent) => pick(event),
      'onPointerup': onPointerup,
      'onPointercancel': () => {
        rect = null
      },
    }
  })

  return { dialAttrs, hand, numbers }
}
