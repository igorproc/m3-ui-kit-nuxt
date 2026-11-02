/**
 * Public prop surface for `<MSearch>`: the M3 search bar and the view of results
 * it opens.
 *
 * Results come as markup — `<MSearchList>` groups of `<MSearchListItem>` rows in
 * the default slot — or as `items`, a shorthand that renders the same rows and
 * filters them by the query. Where a full-screen search lives is the app's
 * call: it puts an inline search into its own page, dialog or sheet.
 *
 * No phrase has a default: the kit ships no copy it cannot translate, so the
 * hint and every name come from the app.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'
import type { RowFilter } from '#kit/utils/dropdown/matchRows'

/** `docked` — a panel under the bar; `inline` — results in the flow under it. */
export type MSearchView = 'docked' | 'inline'

/** A shorthand result: a string, or an object read through `itemTitle` / `itemValue`. */
export type MSearchItem = string | Record<string, unknown>

/** A key of the item, or a function reading the part from it. */
export type MSearchItemResolver<TResult> = string | ((item: MSearchItem, index: number) => TResult)

export interface MSearchMessages {
  /** The clear button's name; needed once there is a query. */
  clear?: string
  /** The progress bar's name, said while results load. */
  loading?: string
  /** Shown when a query found nothing; without it (or `#no-results`) the view stays closed. */
  noResults?: string
}

export const mSearchProps = {
  /** No query can be typed or cleared; the bar recedes and the view does not open. */
  disabled: { type: Boolean, default: false },
  /** Hint shown in the empty bar. Not a name: it disappears as soon as there is a query. */
  placeholder: { type: String, default: undefined },
  /** Accessible name of the field. A search bar has no visible label, so it needs this (or `aria-labelledby`). */
  ariaLabel: { type: String, default: undefined },
  /** The fields' density steps: the bar stands as tall as a field beside it. */
  density: { type: String as PropType<MFieldDensity>, default: 'default' as MFieldDensity },
  view: { type: String as PropType<MSearchView>, default: 'docked' as MSearchView },
  /** Results are on their way: progress over the divider, the rows stay. */
  loading: { type: Boolean, default: false },
  /** Shorthand results, filtered by the query. Markup in the default slot takes over when given. */
  items: { type: Array as PropType<readonly MSearchItem[]>, default: undefined },
  itemTitle: { type: [String, Function] as PropType<MSearchItemResolver<string>>, default: 'title' },
  /** What `select` reports for a shorthand row. The whole item by default. */
  itemValue: { type: [String, Function] as PropType<MSearchItemResolver<unknown>>, default: undefined },
  /** Built-in: by title, without case and diacritics. A function decides per row; `false` keeps every row. */
  filter: { type: [Boolean, Function] as PropType<RowFilter>, default: undefined },
  messages: { type: Object as PropType<MSearchMessages>, default: undefined },
}

export type MSearchProps = ExtractPublicPropTypes<typeof mSearchProps>

export interface MSearchEmits {
  /** Enter with no result active: the query to run. */
  (event: 'submit', query: string): void
  /** A result was chosen; its title is now the query. */
  (event: 'select', value: unknown): void
  /** The query was emptied by the clear button or by Escape. */
  (event: 'clear'): void
}

export interface MSearchSlots {
  /** Before the query — the search glyph by default, a navigation button in an app bar. */
  'leading'?: () => unknown
  /** Content of the clear button. */
  'clear'?: () => unknown
  /** Actions after the query: voice input, filters. Icon buttons. */
  'trailing'?: () => unknown
  /** The account avatar at the end of the bar — M3 draws it at 30. */
  'avatar'?: () => unknown
  /** The results: `<MSearchList>` and `<MSearchListItem>`. */
  'default'?: () => unknown
  /** One shorthand row, to render it yourself with `<MSearchListItem>`. */
  'item'?: (props: { item: MSearchItem, index: number, title: string, value: unknown }) => unknown
  /** Shown while results load and none are listed yet. */
  'loading'?: () => unknown
  /** Shown when a query found nothing. */
  'no-results'?: (props: { query: string, clear: () => void }) => unknown
}
