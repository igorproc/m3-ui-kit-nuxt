/**
 * Public prop surface for `<MChipGroup>`.
 *
 * Follows the kit's generic-component convention (see `MAutocomplete`): the
 * typed `MChipGroupProps<TItem, TValue>` interface documents the contract,
 * while the SFC consumes the runtime object so props stay introspectable.
 *
 * The group never owns a second selection engine — `useSelectionGroup` stays
 * the source of truth — and it never exposes an index-based model.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MChipGroupDirection } from '#kit/composables/chip-group/context'

export type ChipGroupResolver<TItem, TResult> = keyof TItem | ((item: TItem, index: number) => TResult)

/** Typed contract of the group; `TValue` is whatever the model carries. */
export interface MChipGroupProps<TItem, TValue = TItem> {
  items?: readonly TItem[]
  itemValue?: ChipGroupResolver<TItem, TValue>
  itemDisabled?: ChipGroupResolver<TItem, boolean>
  itemKey?: ChipGroupResolver<TItem, PropertyKey>
  multiple?: boolean
  mandatory?: boolean | 'force'
  disabled?: boolean
  max?: number
  direction?: MChipGroupDirection
  wrap?: boolean
  valueComparator?: (left: TValue, right: TValue) => boolean
}

export const mChipGroupProps = {
  /** Optional data-driven items rendered through the `#item` slot. */
  items: { type: Array as PropType<readonly unknown[]>, default: undefined },
  /** Resolve each item's selection value (key or getter). */
  itemValue: { type: [String, Function] as PropType<string | ((item: unknown, index: number) => unknown)>, default: undefined },
  /** Resolve each item's disabled state (key or getter). */
  itemDisabled: { type: [String, Function] as PropType<string | ((item: unknown, index: number) => boolean)>, default: undefined },
  /** Resolve a stable v-for key (key or getter). */
  itemKey: { type: [String, Function] as PropType<string | ((item: unknown, index: number) => PropertyKey)>, default: undefined },
  /** Allow multiple selection. */
  multiple: { type: Boolean, default: false },
  /** Enforce at least one selection; `'force'` also auto-selects the first. */
  mandatory: { type: [Boolean, String] as PropType<boolean | 'force'>, default: false },
  /** Disable every registered chip in the group. */
  disabled: { type: Boolean, default: false },
  /** Maximum concurrent selections (multiple mode only). */
  max: { type: Number, default: undefined },
  /** Layout flow; also maps the arrow keys. */
  direction: { type: String as PropType<MChipGroupDirection>, default: 'horizontal' },
  /** Wrap chips onto multiple lines instead of scrolling natively. */
  wrap: { type: Boolean, default: true },
  /** Custom value equality (defaults to `===`). */
  valueComparator: { type: Function as PropType<(left: unknown, right: unknown) => boolean>, default: undefined },
}

export type MChipGroupRuntimeProps = ExtractPublicPropTypes<typeof mChipGroupProps>
