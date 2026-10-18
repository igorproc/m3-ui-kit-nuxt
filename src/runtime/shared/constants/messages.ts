/**
 * @module messages
 *
 * @remarks
 * User-facing copy the kit ships as a fallback. Gathered here so it can be
 * pointed at a message source later — today every one of these is also a prop,
 * so an app that only needs one string changed overrides that prop and never
 * touches this file.
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
  dropdownClear: 'Clear selection',
  dropdownToggle: 'Toggle options',
  dropdownLoading: 'Loading options',
  dropdownEmpty: 'No options',
  dropdownNoResults: 'No results',
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
