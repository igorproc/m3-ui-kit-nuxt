/**
 * Public prop surface for `<MDropdown>` — and, through {@link mDropdownProps},
 * for `<MAutocomplete>`.
 *
 * The dropdown is the parent of the selection family: it owns the field, the
 * listbox panel, single/multiple selection, the chips and clearing. The
 * autocomplete is the same component plus filtering, so everything except the
 * filter lives here and is spread there.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { fieldDensityProp, mFieldProps } from '#kit/components/ui/text-field/props'
import type { MTextFieldVariant } from '#kit/components/ui/text-field/props'
import type { UiMenuOrigin } from '#kit/components/ui/menu/types'
import type { DropdownItemBase, DropdownResolver, DropdownRuntimeResolver, DropdownValueComparator } from '#kit/composables/dropdown/types'

/**
 * Field surface. Narrowed from the family axis rather than re-declared.
 *
 * `underline` is deliberately absent: it is the only field shape without a
 * container, and this component puts chips, a clear button and a menu anchor
 * inside* the box. A row of chips on a bare line has nothing holding it, and
 * the panel would attach to the line that is the field's only boundary.
 * (`underline` is also the Material 2 "standard" field, which M3 dropped.)
 */
export type MDropdownVariant = Extract<MTextFieldVariant, 'filled' | 'outlined'>

/**
 * The dropdown's props — and, spread into `<MAutocomplete>`, the props of the
 * whole selection family. There is no separate "base" export: the dropdown is
 * the base, and a second name for the same object would only invite the two to
 * drift.
 */
export const mDropdownProps = {
  ...mFieldProps,
  ...fieldDensityProp,
  variant: { type: String as PropType<MDropdownVariant>, default: 'filled' },

  /** Options. Every item carries its own `id`; that id is its identity. */
  items: { type: Array as PropType<readonly DropdownItemBase[]>, default: () => [] },
  /** Row text. Key or getter; defaults to the item's `label`. */
  itemTitle: { type: [String, Function] as PropType<DropdownRuntimeResolver<string>>, default: 'label' },
  /** Value written to the model. Key or getter; defaults to the whole item. */
  itemValue: { type: [String, Function] as PropType<DropdownRuntimeResolver<unknown>>, default: undefined },
  /** Per-item disabled guard. Key or getter; defaults to the item's `disabled`. */
  itemDisabled: { type: [String, Function] as PropType<DropdownRuntimeResolver<boolean>>, default: 'disabled' },
  /**
   * Value equality. Defaults to comparing two objects by `id` and everything
   * else by `===` — a refetched list is a new set of object references, and
   * identity is the one thing an item is required to declare.
   */
  valueComparator: { type: Function as PropType<DropdownValueComparator>, default: undefined },

  /** Select more than one value; the model becomes an array. */
  multiple: { type: Boolean, default: false },
  /** Keep at least one value selected (the last one cannot be removed). */
  mandatory: { type: Boolean, default: false },
  /**
   * Upper bound on the selection. `multiple` only — a single-select field
   * cannot hold two values, so a limit there has nothing to limit.
   */
  max: { type: Number, default: undefined },
  /** Show a control that empties the selection. */
  clearable: { type: Boolean, default: false },

  /** Where the panel opens relative to the field. */
  menuPlacement: { type: String as PropType<UiMenuOrigin>, default: 'top left' },
  /**
   * Cap on the scrolling area of the panel. A number is read as `rem` (the
   * kit's 1rem = 1px-of-the-mockup convention), a string is passed through.
   * Defaults to the panel's own token so the list of a hundred options does
   * not run off the screen.
   *
   * This is live geometry supplied at runtime, so it travels as a custom
   * property — the one case the zero-runtime rule allows.
   */
  maxHeight: { type: [Number, String], default: undefined },
}

export type MDropdownRuntimeProps = ExtractPublicPropTypes<typeof mDropdownProps>

/**
 * The typed contract behind the runtime props above, for consumers and docs.
 * The runtime object cannot carry the generic; this interface can.
 */
export interface MDropdownProps<TItem extends DropdownItemBase, TValue = TItem> {
  items?: readonly TItem[]
  itemTitle?: DropdownResolver<TItem, string>
  itemValue?: DropdownResolver<TItem, TValue>
  itemDisabled?: DropdownResolver<TItem, boolean>
  valueComparator?: (left: TValue, right: TValue) => boolean
  multiple?: boolean
  mandatory?: boolean
  max?: number
  clearable?: boolean
  menuPlacement?: UiMenuOrigin
  maxHeight?: number | string
}

export interface MDropdownEmits<TItem extends DropdownItemBase> {
  (event: 'select' | 'remove', item: TItem): void
  (event: 'clear' | 'open' | 'close'): void
}
