/**
 * @module useDropdownSelection
 *
 * @remarks
 * The selection model of the family. **Model-first, not registry-first:** the
 * `v-model` is the truth and the rows are a view of it.
 *
 * That is the one architectural choice here worth defending. A field holds a
 * value before it holds options — a form loads `countryId` and the country list
 * arrives two ticks later — so a selection that only exists as a registered
 * ticket would drop that value on the floor the moment the first option
 * registered. Selected values with no matching item stay in the model and are
 * rendered from a fallback row instead.
 */
import { computed, toValue } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { DropdownItemBase, DropdownResolvedItem } from './types'

export interface UseDropdownSelectionOptions<TItem extends DropdownItemBase, TValue> {
  model: Ref<TValue | TValue[] | undefined>
  resolved: ComputedRef<DropdownResolvedItem<TItem, TValue>[]>
  multiple: () => boolean
  mandatory: () => boolean
  max: () => number | undefined
  disabled: () => boolean
  readonly: () => boolean
  comparator: () => ((left: TValue, right: TValue) => boolean) | undefined
  /** Title for a selected value that no current item matches. */
  resolveTitle: (value: TValue) => string
  onSelect?: (value: TValue) => void
  onRemove?: (value: TValue) => void
  onClear?: () => void
}

const hasId = (value: unknown): value is DropdownItemBase =>
  typeof value === 'object' && value !== null && 'id' in value

/**
 * Identity before equality: two fetches of the same record are two objects,
 * and `id` is the one thing every item is required to declare.
 */
export function compareByIdentity(left: unknown, right: unknown): boolean {
  if (hasId(left) && hasId(right)) return left.id === right.id
  return Object.is(left, right)
}

export function useDropdownSelection<TItem extends DropdownItemBase, TValue = TItem>(
  options: UseDropdownSelectionOptions<TItem, TValue>,
) {
  const { model, resolved } = options

  const equal = (left: TValue, right: TValue) =>
    (options.comparator() ?? compareByIdentity)(left, right)

  const selectedValues = computed<TValue[]>(() => {
    const raw = toValue(model)
    if (options.multiple()) return Array.isArray(raw) ? [...raw] as TValue[] : []
    return raw === undefined || raw === null ? [] : [raw as TValue]
  })

  const limitReached = computed(() => {
    const limit = options.max()
    return options.multiple() && limit !== undefined && selectedValues.value.length >= limit
  })

  const isSelected = (value: TValue) => selectedValues.value.some(selected => equal(selected, value))

  /** Blocked only by the limit — a selected row is never blocked by it. */
  const isBlocked = (value: TValue) => limitReached.value && !isSelected(value)

  const locked = () => options.disabled() || options.readonly()

  function write(values: TValue[]) {
    model.value = options.multiple() ? values : values[0]
  }

  function select(value: TValue) {
    if (locked() || isSelected(value) || isBlocked(value)) return

    write(options.multiple() ? [...selectedValues.value, value] : [value])
    options.onSelect?.(value)
  }

  function unselect(value: TValue) {
    if (locked() || !isSelected(value)) return
    if (options.mandatory() && selectedValues.value.length <= 1) return

    write(selectedValues.value.filter(selected => !equal(selected, value)))
    options.onRemove?.(value)
  }

  function toggle(value: TValue) {
    if (isSelected(value)) unselect(value)
    else select(value)
  }

  const canClear = computed(() => !options.mandatory() && selectedValues.value.length > 0)

  function clear() {
    if (locked() || !canClear.value) return
    model.value = options.multiple() ? [] as TValue[] : undefined
    options.onClear?.()
  }

  /**
   * Selected values as rows. A value the current `items` do not contain still
   * gets a row — that is the async case, and dropping it would quietly rewrite
   * the consumer's model.
   */
  const selectedEntries = computed(() => selectedValues.value.map((value) => {
    const match = resolved.value.find(entry => equal(entry.value, value))
    if (match) return match

    return {
      item: value as unknown as TItem,
      key: hasId(value) ? value.id : String(value),
      id: '',
      value,
      title: options.resolveTitle(value),
      itemDisabled: false,
    } satisfies DropdownResolvedItem<TItem, TValue>
  }))

  return {
    selectedValues,
    selectedEntries,
    limitReached,
    canClear,
    isSelected,
    isBlocked,
    select,
    unselect,
    toggle,
    clear,
  }
}
