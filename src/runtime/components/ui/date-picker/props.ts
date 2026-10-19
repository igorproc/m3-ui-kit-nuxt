/**
 * Public prop surface for `<MDatePicker>` — the M3 date picker drawn in place:
 * a title, the chosen date as the headline, a switch between the calendar and
 * a typed date, and the calendar itself. Choosing a day commits it at once;
 * Cancel and OK belong to `<MDialogDate>`, which hosts this picker.
 *
 * Every phrase is a prop whose English default lives in `MESSAGES`; names,
 * formats and the first day of the week come from `locale` through `Intl`.
 * The model keeps the type it came in: a day string (`YYYY-MM-DD`) stays a
 * string, a timestamp a number, a `Date` (or nothing yet) a `Date`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { MESSAGES } from '#kit/shared/constants/messages'
import type { DatePickerValue } from '#kit/composables/date'

export type MDatePickerValue = DatePickerValue

/** How a date is chosen: on the calendar, or typed. */
export type MDatePickerMode = 'picker' | 'input'

export const mDatePickerProps = {
  /** Shows the date, takes no choice; every part stays out of the tab order. */
  disabled: { type: Boolean, default: false },
  /** Shows the date and lets the user look around, takes no choice. */
  readonly: { type: Boolean, default: false },
  /** Title over the date while picking on the calendar. */
  label: { type: String, default: MESSAGES.dateTitle },
  /** Title over the date while typing it. */
  inputTitle: { type: String, default: MESSAGES.dateInputTitle },
  minDate: { type: [Date, String, Number] as PropType<MDatePickerValue>, default: undefined },
  maxDate: { type: [Date, String, Number] as PropType<MDatePickerValue>, default: undefined },
  /** Names, formats and the first day of the week. */
  locale: { type: String, default: 'en-US' },
  /** Offer the switch between the calendar and a typed date. */
  modeToggle: { type: Boolean, default: true },
  prevMonthLabel: { type: String, default: MESSAGES.datePrevMonth },
  nextMonthLabel: { type: String, default: MESSAGES.dateNextMonth },
  switchToYearLabel: { type: String, default: MESSAGES.dateSwitchToYear },
  switchToDayLabel: { type: String, default: MESSAGES.dateSwitchToDay },
  switchToInputLabel: { type: String, default: MESSAGES.dateSwitchToInput },
  switchToCalendarLabel: { type: String, default: MESSAGES.dateSwitchToCalendar },
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
  inputLabel: { type: String, default: MESSAGES.dateInputLabel },
  /** Pattern shown in the empty field. Built from the locale's order when absent ("MM/DD/YYYY"). */
  placeholder: { type: String, default: undefined },
  /** Said when a typed date cannot be read. */
  errorPattern: { type: String, default: MESSAGES.dateErrorPattern },
  /** Said when a typed date is outside `min-date`/`max-date`. */
  errorRange: { type: String, default: MESSAGES.dateErrorRange },
}

export type MDatePickerProps = ExtractPublicPropTypes<typeof mDatePickerProps>
