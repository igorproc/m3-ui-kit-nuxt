/** A key of the item or a getter: how a data-driven group reads one field. */
export type ItemResolver<TItem, TResult> = keyof TItem | ((item: TItem, index: number) => TResult)

export interface EntryResolvers<TItem, TValue> {
  itemValue?: ItemResolver<TItem, TValue>
  itemDisabled?: ItemResolver<TItem, boolean>
  itemKey?: ItemResolver<TItem, PropertyKey>
}

/** One item of a data-driven group, resolved. */
export interface ResolvedEntry<TItem, TValue> {
  item: TItem
  index: number
  value: TValue
  disabled: boolean
  key: PropertyKey
}

function read<TItem, TResult>(resolver: ItemResolver<TItem, TResult>, item: TItem, index: number): TResult {
  return typeof resolver === 'function'
    ? (resolver as (item: TItem, index: number) => TResult)(item, index)
    : item[resolver] as unknown as TResult
}

/**
 * Resolves the `items` of `MSelectionGroup` and `MChipGroup`: the value (the
 * item itself by default), the disabled flag and a stable `v-for` key. An
 * object value without `itemKey` falls back to its index, which development
 * reports under `tag`.
 */
export function resolveEntries<TItem, TValue>(
  items: readonly TItem[],
  resolvers: EntryResolvers<TItem, TValue>,
  tag: string,
): ResolvedEntry<TItem, TValue>[] {
  return items.map((item, index) => {
    const value = resolvers.itemValue === undefined ? item as unknown as TValue : read(resolvers.itemValue, item, index)
    const disabled = resolvers.itemDisabled === undefined ? false : Boolean(read(resolvers.itemDisabled, item, index))

    let key: PropertyKey
    if (resolvers.itemKey !== undefined) {
      key = read(resolvers.itemKey, item, index)
    } else if (value !== null && typeof value === 'object') {
      if (import.meta.dev) {
        console.warn(`[${tag}] object item value without \`item-key\`; falling back to index. Provide \`item-key\` for stable identity.`)
      }
      key = index
    } else {
      key = value as unknown as PropertyKey
    }

    return { item, index, value, disabled, key }
  })
}
