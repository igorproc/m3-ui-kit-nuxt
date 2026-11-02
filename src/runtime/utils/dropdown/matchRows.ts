/**
 * @module matchRows
 *
 * @remarks
 * Which rows a typed query leaves standing — shared by `<MAutocomplete>` and the
 * `items` shorthand of `<MSearch>`. Pure: no Vue, no DOM.
 *
 * The built-in match compares without case and without diacritics: "Zurich"
 * finds "Zürich", "Sao" finds "São". Missing a match is worse than showing one
 * row too many.
 */

/** A custom verdict on one row, or `false` to keep every row (the app filters). */
export type RowFilter = false | ((item: never, query: string, title: string) => boolean) | undefined

/** Where the query has to occur in a row's title. */
export type RowFilterMode = 'contains' | 'starts-with'

/** Lower case without combining marks: the form both sides of a match are compared in. */
export function foldForMatch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()
}

/**
 * Whether a row survives the query. An empty query keeps every row.
 *
 * @param item The source item, handed to a custom filter untouched.
 * @param title The row's text.
 * @param query The query as typed; a custom filter receives it unchanged.
 */
export function matchesQuery(item: unknown, title: string, query: string, filter: RowFilter, mode: RowFilterMode): boolean {
  const folded = foldForMatch(query.trim())
  if (filter === false || !folded) return true

  if (typeof filter === 'function') {
    return (filter as (item: unknown, query: string, title: string) => boolean)(item, query, title)
  }

  const text = foldForMatch(title)
  return mode === 'starts-with' ? text.startsWith(folded) : text.includes(folded)
}
