/**
 * Reading the `items` shorthand of `<MSearch>`: a result is a string, or an
 * object read through a key or a function. Pure: no Vue, no DOM.
 */
import type { MSearchItem, MSearchItemResolver } from '#kit/components/ui/search/props'

function read<TResult>(item: MSearchItem, resolver: MSearchItemResolver<TResult>, index: number): unknown {
  return typeof resolver === 'function' ? resolver(item, index) : (item as Record<string, unknown>)[resolver]
}

/** The row's text; a string item is its own title. */
export function searchItemTitle(item: MSearchItem, resolver: MSearchItemResolver<string>, index: number): string {
  if (typeof item === 'string') return item
  const title = read(item, resolver, index)
  return title === undefined || title === null ? '' : String(title)
}

/** What `select` reports: the resolved value, or the item itself. */
export function searchItemValue(item: MSearchItem, resolver: MSearchItemResolver<unknown> | undefined, index: number): unknown {
  if (resolver === undefined || typeof item === 'string') return item
  return read(item, resolver, index)
}

/** Identity for the row: an object's `id`, else its title, else its place. */
export function searchItemKey(item: MSearchItem, title: string, index: number): PropertyKey {
  if (typeof item !== 'string' && (typeof item.id === 'string' || typeof item.id === 'number')) return item.id
  return title || index
}
