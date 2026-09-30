/**
 * @module useDropdownEntries
 *
 * @remarks
 * Turns `items` into rows: applies the four resolvers, builds the DOM id every
 * row needs for `aria-activedescendant`, and says so out loud when an item
 * cannot answer for its own title. Selection state is added on top by
 * {@link useDropdownSelection}; this layer knows nothing about it.
 */
import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { DropdownItemBase, DropdownResolvedItem, DropdownResolver } from './types'

export interface UseDropdownEntriesOptions<TItem extends DropdownItemBase, TValue> {
  items: MaybeRefOrGetter<readonly TItem[]>
  itemTitle: MaybeRefOrGetter<DropdownResolver<TItem, string>>
  itemValue: MaybeRefOrGetter<DropdownResolver<TItem, TValue> | undefined>
  itemDisabled: MaybeRefOrGetter<DropdownResolver<TItem, boolean>>
  /** Prefix for the generated row ids; the listbox id of the instance. */
  namespace: string
}

function resolve<TItem, TResult>(
  item: TItem,
  index: number,
  resolver: DropdownResolver<TItem, TResult> | undefined,
): TResult | undefined {
  if (resolver === undefined) return undefined
  if (typeof resolver === 'function') return resolver(item, index)
  return item[resolver] as TResult | undefined
}

/** Keep generated ids valid as CSS selectors and stable per item. */
const slug = (key: PropertyKey) => String(key).replace(/[^\w-]/g, '-')

export function useDropdownEntries<TItem extends DropdownItemBase, TValue = TItem>(
  options: UseDropdownEntriesOptions<TItem, TValue>,
): ComputedRef<DropdownResolvedItem<TItem, TValue>[]> {
  return computed(() => toValue(options.items).map((item, index) => {
    const title = resolve(item, index, toValue(options.itemTitle))
    const value = resolve(item, index, toValue(options.itemValue))

    if (import.meta.dev && (title === undefined || title === null)) {
      console.warn(
        `[m3:dropdown] item "${String(item.id)}" resolved no title. `
        + 'Give it a `label`, or point `item-title` at the key that holds one.',
      )
    }

    return {
      item,
      key: item.id,
      id: `${options.namespace}-option-${slug(item.id)}`,
      // No resolver means the model carries the item itself: the field's value
      // is the thing that was chosen, not a projection of it.
      value: (value === undefined ? item : value) as TValue,
      title: title === undefined || title === null ? String(item.id) : String(title),
      itemDisabled: Boolean(resolve(item, index, toValue(options.itemDisabled))),
    }
  }))
}
