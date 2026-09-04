/**
 * Public prop surface for `<MNumberInput>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object, matching the rest of the kit.
 *
 * The shape axis is narrower than `<MTextField>`'s: `underline` puts a single
 * rule under a value flanked by stepper zones, which reads as an unfinished
 * box. What replaces the missing variants is `controls` — the way a number is
 * changed matters more here than the way its container is drawn, and the ways
 * are mutually exclusive, so they are one enum rather than several flags.
 *
 * `modelValue`, `focused` and `unit` are models, declared in the SFC.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { fieldDensityProp, mFieldProps } from '#kit/components/ui/text-field/props'

export type MNumberInputVariant = 'filled' | 'outlined'

/**
 * How the value is stepped. One axis, mutually exclusive by construction — a
 * field cannot be a split stepper and a drag handle at the same time.
 *
 * - `split` — two full-height zones at the container edges. The only touch-safe
 *   stepper; use it for quantities and anything reached by thumb.
 * - `stacked` — one narrow column of ▲/▼ at the trailing edge. Compact, small
 *   hit targets, desktop only.
 * - `scrub` — the label becomes a horizontal drag target. Design-tool
 *   ergonomics: powerful, undiscoverable, so the field stays typable and the
 *   keyboard keeps its stepping.
 * - `false` — typing and the keyboard alone.
 */
export type MNumberInputControls = 'split' | 'stacked' | 'scrub' | false

/** One entry of the unit menu. A bare string is its own value and label. */
export type MNumberInputUnit = string | { value: string, label?: string }

export const mNumberInputProps = {
  ...mFieldProps,
  ...fieldDensityProp,
  variant: { type: String as PropType<MNumberInputVariant>, default: 'filled' },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  /** Decimal places. Inferred from `step` when omitted. */
  precision: { type: Number, default: undefined },
  locale: { type: String, default: 'en-US' },
  useGrouping: { type: Boolean, default: true },
  controls: { type: [String, Boolean] as PropType<MNumberInputControls>, default: 'split' },
  /** Pull committed values back inside `min`/`max`. Never applied per keystroke. */
  clamp: { type: Boolean, default: true },
  /**
   * Units to choose from. With a list the unit zone becomes a menu bound to
   * `v-model:unit`; without one it stays a static suffix.
   *
   * Picking a unit **relabels only** — the number is left exactly as it is.
   * Converting 512 MiB into 0.5 GiB needs a scale the field does not have, and
   * silently rescaling a value the user typed is worse than not converting.
   */
  units: { type: Array as PropType<MNumberInputUnit[]>, default: undefined },
  /** Accessible name of the unit menu trigger. */
  unitLabel: { type: String, default: 'Change unit' },
  /** Accessible name of the increase control. */
  incrementLabel: { type: String, default: 'Increase value' },
  /** Accessible name of the decrease control. */
  decrementLabel: { type: String, default: 'Decrease value' },
}

export type MNumberInputProps = ExtractPublicPropTypes<typeof mNumberInputProps>
