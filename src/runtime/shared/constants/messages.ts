/**
 * @module messages
 *
 * @remarks
 * User-facing copy the kit still ships as a fallback, gathered here so it can be
 * pointed at a message source later. Each entry is the default of a prop — the
 * `datePattern*` letters build the date field's placeholder, which the
 * `placeholder` prop replaces whole — so an app overrides the prop and never
 * touches this file. Newer components ship no copy at all: they take a
 * `messages` prop without defaults and warn in development when a name is missing.
 *
 * Only phrases belong here. A number or a boolean default is not copy: it stays
 * a literal on the prop that exposes it, where the API table can show it.
 *
 * These are English because the kit has no locale of its own. Anything shown to
 * a user in a language the app chose should come from the app, not from here.
 */
export const MESSAGES = {
  textareaResize: 'Resize',
  numberIncrement: 'Increase value',
  numberDecrement: 'Decrease value',
  numberUnit: 'Change unit',
  dateTitle: 'Select date',
  dateInputTitle: 'Enter date',
  datePrevMonth: 'Previous month',
  dateNextMonth: 'Next month',
  dateSwitchToYear: 'Switch to selecting a year',
  dateSwitchToDay: 'Switch to selecting a day',
  dateSwitchToInput: 'Switch to text input mode',
  dateSwitchToCalendar: 'Switch to calendar input mode',
  dateInputLabel: 'Date',
  // Letters of the input pattern, laid out in the locale's order: "MM/DD/YYYY".
  datePatternDay: 'DD',
  datePatternMonth: 'MM',
  datePatternYear: 'YYYY',
  dateErrorPattern: 'Date does not match the expected pattern',
  dateErrorRange: 'Date out of the expected range',
  dateCancel: 'Cancel',
  dateConfirm: 'OK',
  timeTitle: 'Select time',
  timeHour: 'Hour',
  timeMinute: 'Minute',
  timePeriod: 'Select AM or PM',
  timeErrorHour: 'Enter a valid hour',
  timeErrorMinute: 'Enter a valid minute',
} as const
