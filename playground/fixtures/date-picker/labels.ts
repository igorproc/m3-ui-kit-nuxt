/** The phrases an app passes the date pickers: the kit ships none of its own. */
export const DATE_LABELS = {
  label: 'Select date',
  inputTitle: 'Enter date',
  prevMonthLabel: 'Previous month',
  nextMonthLabel: 'Next month',
  switchToYearLabel: 'Switch to selecting a year',
  switchToDayLabel: 'Switch to selecting a day',
  switchToInputLabel: 'Switch to text input mode',
  switchToCalendarLabel: 'Switch to calendar input mode',
  inputLabel: 'Date',
  errorPattern: 'Date does not match the expected pattern',
  errorRange: 'Date out of the expected range',
  patternLetters: { day: 'DD', month: 'MM', year: 'YYYY' },
}

export const DIALOG_LABELS = {
  ...DATE_LABELS,
  cancelLabel: 'Cancel',
  confirmLabel: 'OK',
}
