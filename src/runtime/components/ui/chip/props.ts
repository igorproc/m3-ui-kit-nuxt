/**
 * Public prop surface for `<MChip>`.
 *
 * `type` is the MD3 chip taxonomy (assist | filter | input | suggestion) — NOT
 * a surface `variant`. Chips have no async action, so only `disabled` (not
 * `loading`) is taken from the shared state contract.
 *
 * `value` is the opt-in into `<MChipGroup>` selection. A chip without `value`
 * stays standalone even inside a group, which keeps assist/input/suggestion
 * chips usable as plain design elements next to selectable ones.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MVariant } from '#kit/shared/types/props'
import { makeStateProps } from '#kit/shared/utils/props'

export type MChipType = 'assist' | 'filter' | 'input' | 'suggestion'

/** M3 "flat" is the kit's `outlined`; an input chip is never elevated. */
export type MChipVariant = Extract<MVariant, 'outlined' | 'elevated'>

/**
 * How the chip is removed:
 * - `none` — it is not;
 * - `button` — a separate remove button beside the main action (M3 input chip);
 * - `whole` — the whole chip is the remove button (a value in a field).
 */
export type MChipRemoval = 'none' | 'button' | 'whole'

const { disabled } = makeStateProps()

export const mChipProps = {
  disabled,
  type: { type: String as PropType<MChipType>, default: 'assist' },
  /** Surface treatment: an edge (`outlined`, M3 "flat") or a raised fill (`elevated`). */
  variant: { type: String as PropType<MChipVariant>, default: 'outlined' },
  /** Selection value inside a `<MChipGroup>`. Undefined keeps the chip standalone. */
  value: { type: null as unknown as PropType<unknown> },
  /** A selected filter chip shows a checkmark in place of its leading icon. */
  showSelectedIcon: { type: Boolean, default: true },
  /** How the chip is removed; emits `remove`. */
  removal: { type: String as PropType<MChipRemoval>, default: 'none' },
  /** Name of the remove action (`Удалить «Москва»`). The kit ships no wording. */
  removeLabel: { type: String, default: undefined },
}

export type MChipProps = ExtractPublicPropTypes<typeof mChipProps>

/** {@link mChipProps} with `value` typed by the chip's `TValue`, inferred from what an instance passes. */
export type MChipPropsOptions<TValue> = Omit<typeof mChipProps, 'value'> & {
  value: { type: PropType<TValue> }
}

export interface MChipSlots {
  /** The label. */
  'default'?: () => unknown
  /** The leading icon; a selected filter chip shows its checkmark instead. */
  'icon'?: () => unknown
  /** The 24 avatar of an input chip, in place of a leading icon. */
  'avatar'?: () => unknown
  /** Replaces the checkmark of a selected filter chip. */
  'selected-icon'?: (scope: { selected: boolean, disabled: boolean, blocked: boolean }) => unknown
  /** A decorative trailing icon (`removal="whole"` shows a close glyph by default). */
  'trailing'?: () => unknown
}
