import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mFieldProps } from '../text-field/props'

export type AutocompleteResolver<TItem, TResult> = keyof TItem | ((item: TItem) => TResult)
export type AutocompleteFilter<TItem> = false | ((item: TItem, query: string, title: string) => boolean)
export type AutocompleteFilterMode = 'contains' | 'starts-with'

export interface MAutocompleteProps<TItem, TValue = TItem> {
  items: readonly TItem[]
  itemTitle?: AutocompleteResolver<TItem, string>
  itemValue?: AutocompleteResolver<TItem, TValue>
  itemDisabled?: AutocompleteResolver<TItem, boolean>
  itemKey?: AutocompleteResolver<TItem, string | number>
  filter?: AutocompleteFilter<TItem>
  filterMode?: AutocompleteFilterMode
  multiple?: boolean
  mandatory?: boolean
  hideSelected?: boolean
  openOnFocus?: boolean
  autoSelectFirst?: boolean
  minSearchLength?: number
  loading?: boolean
  clearable?: boolean
}

export const mAutocompleteProps = {
  ...mFieldProps,
  items: { type: Array as PropType<readonly unknown[]>, default: () => [] },
  itemTitle: { type: [String, Function] as PropType<string | ((item: unknown) => string)>, default: undefined },
  itemValue: { type: [String, Function] as PropType<string | ((item: unknown) => unknown)>, default: undefined },
  itemDisabled: { type: [String, Function] as PropType<string | ((item: unknown) => boolean)>, default: undefined },
  itemKey: { type: [String, Function] as PropType<string | ((item: unknown) => string | number)>, default: undefined },
  filter: { type: [Boolean, Function] as PropType<false | ((item: unknown, query: string, title: string) => boolean)>, default: undefined },
  filterMode: { type: String as PropType<AutocompleteFilterMode>, default: 'contains' },
  multiple: { type: Boolean, default: false },
  mandatory: { type: Boolean, default: false },
  hideSelected: { type: Boolean, default: false },
  openOnFocus: { type: Boolean, default: true },
  autoSelectFirst: { type: Boolean, default: false },
  minSearchLength: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
}

export type MAutocompleteRuntimeProps = ExtractPublicPropTypes<typeof mAutocompleteProps>
