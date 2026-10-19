/**
 * Public prop surface for `<MTimePicker>`.
 *
 * `mode` (dial or typed) and `layout` are the picker's own axes, not the MD3
 * surface `variant`. The model stays a 24-hour `HH:mm` string whatever the
 * hour cycle shows.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { HourCycleOption } from '#kit/utils/time/createClock'
import { MESSAGES } from '#kit/shared/constants/messages'

export type MTimePickerMode = 'picker' | 'input'
export type MTimePickerLayout = 'vertical' | 'horizontal'
export type MTimePickerHourCycle = HourCycleOption

export const mTimePickerProps = {
  /** Headline over the picker. Without one the group is still named, by `ariaLabel`. */
  label: { type: String, default: undefined },
  helperText: { type: String, default: undefined },
  /** Names the group when no headline is shown. */
  ariaLabel: { type: String, default: MESSAGES.timeTitle },
  /** `'picker'` turns a dial; `'input'` types the time. Also `v-model:mode`. */
  mode: { type: String as PropType<MTimePickerMode>, default: 'picker' },
  /**
   * Offer the switch between the dial and typed fields, under the picker.
   * Needs `switchToInputLabel` and `switchToPickerLabel` — the kit ships no
   * words of its own for them.
   */
  modeToggle: { type: Boolean, default: false },
  /** Names the switch while the dial is shown. */
  switchToInputLabel: { type: String, default: undefined },
  /** Names the switch while the fields are shown. */
  switchToPickerLabel: { type: String, default: undefined },
  /** Horizontal folds into vertical when its container is narrower than the two side by side. */
  layout: { type: String as PropType<MTimePickerLayout>, default: 'vertical' },
  /** The words of `Intl`: `'h23'` (0–23), `'h12'` (1–12 with a period), `'auto'` from `locale`. */
  hourCycle: { type: String as PropType<MTimePickerHourCycle>, default: 'h23' },
  locale: { type: String, default: 'en-US' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: undefined },
  /** Submits the `HH:mm` value with a form. */
  name: { type: String, default: undefined },
  hourLabel: { type: String, default: MESSAGES.timeHour },
  minuteLabel: { type: String, default: MESSAGES.timeMinute },
  periodLabel: { type: String, default: MESSAGES.timePeriod },
  /** AM and PM in the locale's words unless set. */
  amLabel: { type: String, default: undefined },
  pmLabel: { type: String, default: undefined },
  hourError: { type: String, default: MESSAGES.timeErrorHour },
  minuteError: { type: String, default: MESSAGES.timeErrorMinute },
}

export type MTimePickerProps = ExtractPublicPropTypes<typeof mTimePickerProps>
