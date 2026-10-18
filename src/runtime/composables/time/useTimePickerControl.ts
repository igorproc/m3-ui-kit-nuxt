import { computed, ref, useId, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { Clock, ClockTime, TimeField, TimePeriod } from './createClock'

export interface TimePickerLabels {
  hour: string
  minute: string
  period: string
}

export interface TimePickerControlOptions {
  /** `HH:mm`, 24-hour, or `''`. */
  model: Ref<string>
  clock: ComputedRef<Clock>
  disabled: () => boolean
  readonly: () => boolean
  labels: () => TimePickerLabels
  /** Names the group: the id of a visible headline, or a phrase when there is none. */
  labelledBy: () => string | undefined
  label: () => string
}

const OTHER_FIELD: Record<TimeField, TimeField> = { hours: 'minutes', minutes: 'hours' }
const OTHER_PERIOD: Record<TimePeriod, TimePeriod> = { am: 'pm', pm: 'am' }
const SWITCH_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

const focusById = (id: string) => document.getElementById(id)?.focus()

/**
 * Behavior of `<MTimePicker>` without its markup: the time read from the
 * model, which part the dial turns, the hour/minute selectors and the period
 * as radio groups. Returns attribute bags only — no class, no `data-*`.
 *
 * Writes go through the model alone, so a change of hour cycle or locale
 * re-reads the same `HH:mm` instead of drifting a copy of it.
 */
export function useTimePickerControl(options: TimePickerControlOptions, id: string = useId()) {
  const time = computed(() => options.clock.value.parse(options.model.value))
  // An empty picker has nothing chosen and nothing active until it is touched.
  const field = ref<TimeField | null>(time.value ? 'hours' : null)
  const view = computed<TimeField>(() => field.value ?? 'hours')
  const draftPeriod = ref<TimePeriod>('am')
  const period = computed(() => time.value ? options.clock.value.periodOf(time.value.hours) : draftPeriod.value)
  const locked = () => options.disabled() || options.readonly()

  if (import.meta.dev) {
    watch(options.model, (value) => {
      if (value && !time.value) console.warn(`[m-time-picker] \`${value}\` is not a 24-hour \`HH:mm\` time: the picker shows nothing chosen.`)
    }, { immediate: true })
  }

  function commit(next: ClockTime | null) {
    options.model.value = next ? options.clock.value.format(next) : ''
  }

  /** Sets one part; the other keeps its value, or starts at zero. */
  function setPart(part: TimeField, value: number) {
    if (locked()) return
    const base = time.value ?? { hours: options.clock.value.toHours(0, draftPeriod.value), minutes: 0 }
    commit(part === 'hours' ? { ...base, hours: value } : { ...base, minutes: value })
    field.value ??= part
  }

  function setPeriod(next: TimePeriod) {
    if (locked()) return
    draftPeriod.value = next
    if (!time.value) return
    const clock = options.clock.value
    commit({ ...time.value, hours: clock.toHours(clock.faceHour(time.value.hours), next) })
  }

  const display = computed<Record<TimeField, string>>(() => {
    const clock = options.clock.value
    if (!time.value) return { hours: '--', minutes: '--' }
    return { hours: clock.digits(clock.faceHour(time.value.hours), 2), minutes: clock.digits(time.value.minutes, 2) }
  })

  const rootAttrs = computed(() => ({
    'role': 'group',
    'aria-labelledby': options.labelledBy(),
    'aria-label': options.labelledBy() ? undefined : options.label(),
    'aria-disabled': options.disabled() || undefined,
  }))

  const selectorId = (part: TimeField) => `${id}-${part}`

  function getSelectorAttrs(part: TimeField) {
    const labels = options.labels()
    const name = part === 'hours' ? labels.hour : labels.minute
    const tabbable = field.value ? field.value === part : part === 'hours'
    return {
      'id': selectorId(part),
      'type': 'button' as const,
      'role': 'radio',
      'aria-checked': field.value === part,
      'aria-label': time.value ? `${name} ${display.value[part]}` : name,
      'tabindex': tabbable ? 0 : -1,
      'disabled': options.disabled() || undefined,
      'onClick': () => {
        field.value = part
      },
      'onKeydown': (event: KeyboardEvent) => {
        if (!SWITCH_KEYS.has(event.key)) return
        event.preventDefault()
        field.value = OTHER_FIELD[part]
        focusById(selectorId(OTHER_FIELD[part]))
      },
    }
  }

  const periodGroupAttrs = computed(() => ({
    'role': 'radiogroup',
    'aria-label': options.labels().period,
    'aria-readonly': options.readonly() || undefined,
    'aria-disabled': options.disabled() || undefined,
  }))

  const periodId = (value: TimePeriod) => `${id}-${value}`

  function getPeriodAttrs(value: TimePeriod) {
    return {
      'id': periodId(value),
      'type': 'button' as const,
      'role': 'radio',
      'aria-checked': period.value === value,
      'tabindex': period.value === value ? 0 : -1,
      'disabled': options.disabled() || undefined,
      'onClick': () => setPeriod(value),
      'onKeydown': (event: KeyboardEvent) => {
        if (!SWITCH_KEYS.has(event.key)) return
        event.preventDefault()
        setPeriod(OTHER_PERIOD[value])
        focusById(periodId(OTHER_PERIOD[value]))
      },
    }
  }

  return {
    time,
    field,
    view,
    period,
    display,
    setPart,
    setPeriod,
    commit,
    rootAttrs,
    getSelectorAttrs,
    periodGroupAttrs,
    getPeriodAttrs,
  }
}

export type TimePickerControl = ReturnType<typeof useTimePickerControl>
