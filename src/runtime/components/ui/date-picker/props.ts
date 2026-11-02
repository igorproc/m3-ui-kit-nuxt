/**
 * Public prop surface for `<MDatePicker>` — the M3 date picker drawn in place:
 * a title, the chosen date as the headline, a switch between the calendar and
 * a typed date, and the calendar itself. Choosing a day commits it at once;
 * Cancel and OK belong to `<MDialogDate>`, which hosts this picker.
 *
 * Every phrase is a prop without a default — the kit ships no copy of its own,
 * and dev warns for a part left unnamed. Names of months and days, formats and
 * the first day of the week come from `locale` through `Intl`.
 * The model keeps the type it came in: a day string (`YYYY-MM-DD`) stays a
 * string, a timestamp a number, a `Date` a `Date`. An empty model is written
 * in `valueType`'s (a `Date` by default).
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { DatePickerValue } from '#kit/composables/date'
import type { DateValueType } from '#kit/utils/date/value'

export type MDatePickerValue = DatePickerValue
export type MDatePickerValueType = DateValueType

/** How a date is chosen: on the calendar, or typed. */
export type MDatePickerMode = 'picker' | 'input'

/** The letters of the typed field's pattern, laid out in the locale's order ("ДД.ММ.ГГГГ"). */
export interface MDatePickerPatternLetters {
  day: string
  month: string
  year: string
}

export const mDatePickerProps = {
  /** Shows the date, takes no choice; every part stays out of the tab order. */
  disabled: { type: Boolean, default: false },
  /** Shows the date and lets the user look around, takes no choice. */
  readonly: { type: Boolean, default: false },
  /** Title over the date while picking on the calendar; it names the group. */
  label: { type: String, default: undefined },
  /** Title over the date while typing it. */
  inputTitle: { type: String, default: undefined },
  /** The type a day chosen into an empty model is written in; a model with a value keeps its own. */
  valueType: { type: String as PropType<MDatePickerValueType>, default: 'date' },
  minDate: { type: [Date, String, Number] as PropType<MDatePickerValue>, default: undefined },
  maxDate: { type: [Date, String, Number] as PropType<MDatePickerValue>, default: undefined },
  /** Names, formats and the first day of the week. */
  locale: { type: String, default: 'en-US' },
  /**
   * Offer the switch between the calendar and a typed date. Needs
   * `switchToInputLabel` and `switchToCalendarLabel`.
   */
  modeToggle: { type: Boolean, default: false },
  prevMonthLabel: { type: String, default: undefined },
  nextMonthLabel: { type: String, default: undefined },
  /** Said after the month on its toggle, while the days are shown. */
  switchToYearLabel: { type: String, default: undefined },
  /** Said after the month on its toggle, while the years are shown. */
  switchToDayLabel: { type: String, default: undefined },
  switchToInputLabel: { type: String, default: undefined },
  switchToCalendarLabel: { type: String, default: undefined },
  /** Text under the picker; an error takes its place. */
  helperText: { type: String, default: undefined },
  /** Shows the error state; `errorMessage` says why. */
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: undefined },
  /** A host's `validate()` refuses an empty picker; the typed field is marked required. */
  required: { type: Boolean, default: false },
  /** Submits the chosen day (`YYYY-MM-DD`) with a form. */
  name: { type: String, default: undefined },
  /** Label of the typed-date field. */
  inputLabel: { type: String, default: undefined },
  /** Pattern shown in the empty field, whole. Outranks `patternLetters`. */
  placeholder: { type: String, default: undefined },
  /** Letters the empty field's pattern is built from, in the locale's order and separator. */
  patternLetters: { type: Object as PropType<MDatePickerPatternLetters>, default: undefined },
  /** Said when a typed date cannot be read. */
  errorPattern: { type: String, default: undefined },
  /** Said when a typed date is outside `min-date`/`max-date`. */
  errorRange: { type: String, default: undefined },
}

export type MDatePickerProps = ExtractPublicPropTypes<typeof mDatePickerProps>
