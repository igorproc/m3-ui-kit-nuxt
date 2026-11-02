import type { Calendar } from '#kit/utils/date/createCalendar'
import type { MDatePickerMode, MDatePickerPatternLetters } from './props'

/** The phrase props of the picker, as the component holds them. */
interface DatePickerPhraseProps {
  label?: string
  inputTitle?: string
  prevMonthLabel?: string
  nextMonthLabel?: string
  switchToYearLabel?: string
  switchToDayLabel?: string
  switchToInputLabel?: string
  switchToCalendarLabel?: string
  inputLabel?: string
  errorPattern?: string
  errorRange?: string
  modeToggle?: boolean
}

/**
 * Each phrase (kebab-case prop) the parts on screen need, mapped to whether the
 * app gave it; a part that is not shown needs nothing.
 */
export function datePickerPhrases(props: DatePickerPhraseProps, mode: MDatePickerMode, labelSlot: boolean): Record<string, unknown> {
  const calendar = mode === 'picker'
  const typed = mode === 'input'

  return {
    'label': props.label || labelSlot,
    'prev-month-label': !calendar || props.prevMonthLabel,
    'next-month-label': !calendar || props.nextMonthLabel,
    'switch-to-year-label': !calendar || props.switchToYearLabel,
    'switch-to-day-label': !calendar || props.switchToDayLabel,
    'switch-to-input-label': !props.modeToggle || props.switchToInputLabel,
    'switch-to-calendar-label': !props.modeToggle || props.switchToCalendarLabel,
    'input-title': !typed || props.inputTitle,
    'input-label': !typed || props.inputLabel,
    'error-pattern': !typed || props.errorPattern,
    'error-range': !typed || props.errorRange,
  }
}

/** The typed field's pattern: the app's letters in the locale's order and separator. */
export function patternOf(letters: MDatePickerPatternLetters | undefined, calendar: Calendar): string | undefined {
  if (!letters) return undefined
  const { order, separator } = calendar.numericLayout()
  return order.map(part => letters[part]).join(separator)
}
