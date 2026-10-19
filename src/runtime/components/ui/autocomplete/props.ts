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
import type { DropdownPanelSlotProps, MDropdownProps, MDropdownSlots } from '#kit/components/ui/dropdown/props'
import type { DropdownItemBase } from '#kit/composables/dropdown/types'
import type { AutocompleteOpenOnFocus } from '#kit/composables/autocomplete/useAutocomplete'

export type { AutocompleteOpenOnFocus }

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
  /**
   * Open the panel when the field takes focus. `'pointer'` opens it for a
   * press on the field only, so Tab through a form does not unfold every list
   * on the way (WAI-ARIA APG); `true` opens it for any focus, `false` never.
   */
  openOnFocus: { type: [Boolean, String] as PropType<AutocompleteOpenOnFocus>, default: 'pointer' },
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
  openOnFocus?: AutocompleteOpenOnFocus
}

/** Scope of `#hint`: the query is still shorter than `minSearchLength`. */
export interface AutocompleteHintSlotProps {
  query: string
  /** Characters still to type. */
  missing: number
}

/** Scope of `#no-results`. */
export interface AutocompleteNoResultsSlotProps {
  query: string
  /** Empties the query and keeps the panel open on the whole list. */
  clear: () => void
}

export interface MAutocompleteSlots<TItem, TValue> extends Omit<MDropdownSlots<TItem, TValue>, 'default'> {
  /** Replaces the whole panel; `query` is the text typed so far. */
  'default'?: (props: DropdownPanelSlotProps<TItem, TValue> & { query: string }) => unknown
  /** Shown while the query is shorter than `minSearchLength`; no text of the kit's own. */
  'hint'?: (props: AutocompleteHintSlotProps) => unknown
  /** Shown when the query matches nothing; outranks `messages.noResults`. */
  'no-results'?: (props: AutocompleteNoResultsSlotProps) => unknown
}
