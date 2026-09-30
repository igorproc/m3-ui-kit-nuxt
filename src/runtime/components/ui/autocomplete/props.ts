/**
 * Public prop surface for `<MAutocomplete>`.
 *
 * Everything a selection field does — items, values, multiple, chips, clearing,
 * the panel — comes from {@link mDropdownProps}. What is declared here is
 * the one thing this component adds: **filtering**, and the handful of
 * behaviours that only mean something once there is a query.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mDropdownProps } from '#kit/components/ui/dropdown/props'
import type { MDropdownProps } from '#kit/components/ui/dropdown/props'
import type { DropdownItemBase } from '#kit/composables/dropdown/types'

/** `false` turns filtering off entirely (remote / pre-filtered lists). */
export type AutocompleteFilter<TItem> = false | ((item: TItem, query: string, title: string) => boolean)
export type AutocompleteFilterMode = 'contains' | 'starts-with'

export const mAutocompleteProps = {
  ...mDropdownProps,

  /**
   * Browser autofill hint for the query input. Lives here, not in the shared
   * dropdown props: the dropdown's field is `readonly`, so autofill can never
   * write to it — only this typeable field can be autofilled. Defaults to `off`
   * because filling free text into a box whose value must match an option would
   * desync the model, but a consumer who knows their form may want it.
   */
  autocomplete: { type: String, default: 'off' },

  /**
   * How a row is matched against the query. A function decides per item;
   * `false` shows everything, for a list the server already filtered.
   */
  filter: {
    type: [Boolean, Function] as PropType<false | ((item: never, query: string, title: string) => boolean)>,
    default: undefined,
  },
  /** Built-in matching strategy, used when `filter` is not a function. */
  filterMode: { type: String as PropType<AutocompleteFilterMode>, default: 'contains' as AutocompleteFilterMode },
  /** Characters required before anything is shown. */
  minSearchLength: { type: Number, default: 0 },
  /** Drop already-selected rows from the list instead of ticking them. */
  hideSelected: { type: Boolean, default: false },
  /** Put the virtual focus on the first row as soon as the rows change. */
  autoSelectFirst: { type: Boolean, default: false },
  /** Open the panel when the field takes focus. */
  openOnFocus: { type: Boolean, default: true },
}

export type MAutocompleteRuntimeProps = ExtractPublicPropTypes<typeof mAutocompleteProps>

/** The typed contract behind the runtime props above, for consumers and docs. */
export interface MAutocompleteProps<TItem extends DropdownItemBase, TValue = TItem>
  extends MDropdownProps<TItem, TValue> {
  autocomplete?: string
  filter?: AutocompleteFilter<TItem>
  filterMode?: AutocompleteFilterMode
  minSearchLength?: number
  hideSelected?: boolean
  autoSelectFirst?: boolean
  openOnFocus?: boolean
}
