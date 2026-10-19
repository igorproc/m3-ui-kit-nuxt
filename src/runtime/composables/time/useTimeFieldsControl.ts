import { computed, reactive, useId, watch } from 'vue'
import type { ComputedRef } from 'vue'
import type { Clock, ClockTime, TimeField } from '#kit/utils/time/createClock'
import type { TimePickerControl } from './useTimePickerControl'

export interface TimeFieldsLabels {
  hourError: string
  minuteError: string
}

export interface TimeFieldsControlOptions {
  clock: ComputedRef<Clock>
  control: TimePickerControl
  disabled: () => boolean
  readonly: () => boolean
  required: () => boolean
  labels: () => TimeFieldsLabels
  /** An error the app sets; shown in place of the fields' own. */
  externalError: () => string | undefined
  /** Ids of text that describes both fields, such as a helper line. */
  describedBy: () => string | undefined
}

export interface TimeFieldAttrs {
  'id': string
  'type': 'text'
  'inputmode': 'numeric'
  'maxlength': number
  'autocomplete': 'off'
  'value': string
  'aria-labelledby': string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
  'aria-required': true | undefined
  'disabled': true | undefined
  'readonly': true | undefined
  'onInput': (event: Event) => void
  'onFocus': () => void
  'onBlur': () => void
  'onKeydown': (event: KeyboardEvent) => void
  'onPaste': ((event: ClipboardEvent) => void) | undefined
}

export interface UseTimeFieldsControlReturn {
  /** Which typed part is refused right now. */
  errors: Record<TimeField, boolean>
  errorId: string
  /** The error to show: the app's own, else the refused part's. Empty when there is none. */
  errorText: ComputedRef<string>
  labelId: (part: TimeField) => string
  getFieldAttrs: (part: TimeField) => TimeFieldAttrs
  /** Reads what is typed; `false` when it is refused and the error shows. */
  validate: () => boolean
}

/** "14:30", "1430", "9.30", "9:30 pm" — a time pasted in one go. */
const PASTED = /^(\d{1,2})\D?(\d{2}) ?(?:([ap])\.?m?\.?)?$/i
const pad2 = (value: number) => String(value).padStart(2, '0')
const focusById = (id: string) => document.getElementById(id)?.focus()

/**
 * The typed time of `<MTimePicker mode="input">`: two short text fields read
 * on blur and on Enter, never on each keystroke — half an hour is a draft,
 * not an error. A refused part shows an error and is not clamped. Returns
 * attribute bags only — no class, no `data-*`.
 */
export function useTimeFieldsControl(options: TimeFieldsControlOptions, id: string = useId()): UseTimeFieldsControlReturn {
  const { control } = options
  const text = reactive<Record<TimeField, string>>({ hours: '', minutes: '' })
  const errors = reactive<Record<TimeField, boolean>>({ hours: false, minutes: false })
  const locked = () => options.disabled() || options.readonly()

  function show(time: ClockTime | null) {
    text.hours = time ? pad2(options.clock.value.faceHour(time.hours)) : ''
    text.minutes = time ? pad2(time.minutes) : ''
    errors.hours = false
    errors.minutes = false
  }

  watch(() => [control.time.value, options.clock.value] as const, ([time]) => show(time), { immediate: true })

  const fieldId = (part: TimeField) => `${id}-${part}-field`
  const labelId = (part: TimeField) => `${id}-${part}-label`
  const errorId = `${id}-error`

  const errorText = computed<string>(() => options.externalError()
    || (errors.hours ? options.labels().hourError : errors.minutes ? options.labels().minuteError : ''))

  /**
   * Reads both parts and commits them when they make a time. `strict` also
   * refuses a missing part (Enter, a host's OK); a blur lets the other part
   * still be typed.
   */
  function settle(strict: boolean): boolean {
    if (locked()) return true
    const clock = options.clock.value
    if (!text.hours && !text.minutes) {
      const accepted = !(strict && options.required())
      errors.hours = !accepted
      errors.minutes = false
      if (accepted) control.commit(null)
      return accepted
    }

    const hours = clock.readTyped('hours', text.hours)
    const minutes = clock.readTyped('minutes', text.minutes)
    errors.hours = hours === null && (strict || !!text.hours)
    errors.minutes = minutes === null && (strict || !!text.minutes)
    if (hours === null || minutes === null) return false

    const next = { hours: clock.cycle === 'h12' ? clock.toHours(hours, control.period.value) : hours, minutes }
    control.commit(next)
    show(next)
    return true
  }

  function onInput(part: TimeField, event: Event) {
    const input = event.target as HTMLInputElement
    const digits = input.value.replace(/\D/g, '').slice(0, 2)
    if (digits !== input.value) input.value = digits
    text[part] = digits
    errors[part] = false
    // Two digits of a valid hour are the whole hour: on to the minutes.
    if (part === 'hours' && digits.length === 2 && options.clock.value.readTyped('hours', digits) !== null) {
      focusById(fieldId('minutes'))
    }
  }

  function onPaste(event: ClipboardEvent) {
    const match = PASTED.exec((event.clipboardData?.getData('text') ?? '').trim())
    if (locked() || !match) return
    event.preventDefault()
    const period = match[3]?.toLowerCase()
    const hours = period ? (Number(match[1]) % 12) + (period === 'p' ? 12 : 0) : Number(match[1])
    const minutes = Number(match[2])
    if (hours < 24 && minutes < 60) {
      control.commit({ hours, minutes })
      show({ hours, minutes })
      return
    }
    text.hours = match[1]!
    text.minutes = match[2]!
    settle(false)
  }

  function getFieldAttrs(part: TimeField): TimeFieldAttrs {
    const describedBy = [errorText.value ? errorId : undefined, options.describedBy()].filter(Boolean).join(' ')
    return {
      'id': fieldId(part),
      'type': 'text',
      'inputmode': 'numeric',
      'maxlength': 2,
      'autocomplete': 'off',
      'value': text[part],
      'aria-labelledby': labelId(part),
      'aria-invalid': errors[part] || !!options.externalError() || undefined,
      'aria-describedby': describedBy || undefined,
      'aria-required': options.required() || undefined,
      'disabled': options.disabled() || undefined,
      'readonly': options.readonly() || undefined,
      'onInput': (event: Event) => onInput(part, event),
      'onFocus': () => {
        control.field.value = part
      },
      'onBlur': () => settle(false),
      'onKeydown': (event: KeyboardEvent) => {
        if (event.key === 'Enter') settle(true)
      },
      'onPaste': part === 'hours' ? onPaste : undefined,
    }
  }

  return {
    errors,
    errorId,
    errorText,
    labelId,
    getFieldAttrs,
    validate: () => settle(true),
  }
}
