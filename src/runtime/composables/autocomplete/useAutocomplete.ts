/**
 * @module useAutocomplete
 *
 * @remarks
 * `<MAutocomplete>` is `<MDropdown>` with a query. Selection, chips, the panel,
 * the keyboard map and the ARIA wiring all come from
 * {@link useDropdownControl}; this file adds the three things a typed query
 * brings with it:
 *
 * - **the filter** — which rows the query leaves standing;
 * - **the draft** — what the input shows while the user types, which is not the
 *   committed value and is put back on blur, Escape or Tab;
 * - **composition** — an IME's Enter belongs to the IME, not to the listbox.
 */
import { computed, ref, watch } from 'vue'
import type { InputHTMLAttributes, Ref } from 'vue'
import { useDropdownControl } from '#kit/composables/dropdown/useDropdownControl'
import type {
  DropdownControlConfig,
  DropdownItemBase,
  DropdownResolvedItem,
  UseDropdownControlReturn,
} from '#kit/composables/dropdown/types'

/** Resolved configuration: the family's props plus the query-only ones. */
export interface AutocompleteControlConfig extends DropdownControlConfig {
  filter: false | ((item: never, query: string, title: string) => boolean) | undefined
  filterMode: 'contains' | 'starts-with'
  minSearchLength: number
  hideSelected: boolean
  autoSelectFirst: boolean
  openOnFocus: boolean
}

export interface UseAutocompleteOptions<TItem extends DropdownItemBase, TValue> {
  props: AutocompleteControlConfig
  model: Ref<TValue | TValue[] | undefined>
  search: Ref<string>
  open: Ref<boolean>
  emit: {
    (event: 'select' | 'remove', item: TItem): void
    (event: 'clear' | 'open' | 'close'): void
  }
}

export interface UseAutocompleteReturn<TItem extends DropdownItemBase, TValue>
  extends Omit<UseDropdownControlReturn<TItem, TValue>, 'inputAttrs'> {
  focused: Ref<boolean>
  draft: Ref<string>
  /** True once the query is long enough for the list to mean anything. */
  queryReady: Ref<boolean>
  inputAttrs: Ref<InputHTMLAttributes>
  onInput: (value: string) => void
  clearQuery: () => void
  closeAndRestore: () => void
}

export function useAutocomplete<TItem extends DropdownItemBase, TValue = TItem>(
  options: UseAutocompleteOptions<TItem, TValue>,
): UseAutocompleteReturn<TItem, TValue> {
  const { props, model, search, open, emit } = options

  const focused = ref(false)
  const composing = ref(false)
  const draft = ref(search.value)

  const queryReady = computed(() => search.value.length >= Math.max(0, props.minSearchLength))

  /** The query's verdict on a row. Selection state is not this file's business. */
  function filterRows(
    rows: DropdownResolvedItem<TItem, TValue>[],
    api: { isSelected: (value: TValue) => boolean },
  ) {
    if (!queryReady.value) return []

    const query = search.value.trim().toLocaleLowerCase()
    return rows.filter((row) => {
      if (props.hideSelected && api.isSelected(row.value)) return false
      if (props.filter === false || !query) return true

      if (typeof props.filter === 'function') {
        return (props.filter as (item: TItem, query: string, title: string) => boolean)(row.item, search.value, row.title)
      }

      const title = row.title.toLocaleLowerCase()
      return props.filterMode === 'starts-with' ? title.startsWith(query) : title.includes(query)
    })
  }

  const control = useDropdownControl<TItem, TValue>({
    props,
    model,
    open,
    editable: () => true,
    draft: () => draft.value,
    autoSelectFirst: () => props.autoSelectFirst,
    visible: filterRows,
    onSelect: (entry) => {
      // Multiple keeps collecting, so the query is spent; single commits the
      // chosen title as the new resting text.
      setQuery(props.multiple ? '' : entry.title)
      emit('select', entry.item)
    },
    onRemove: entry => emit('remove', entry.item),
    onClear: () => emit('clear'),
    onOpen: () => emit('open'),
    onClose: () => emit('close'),
    onDismiss: restore,
  })

  function setQuery(value: string) {
    draft.value = value
    search.value = value
  }

  /** Put back the committed value: a draft that was never chosen is not a value. */
  function restore() {
    setQuery(props.multiple ? '' : control.displayTitle.value)
  }

  function onInput(value: string) {
    setQuery(value)
    if (composing.value || props.disabled || props.readonly) return
    if (queryReady.value) open.value = true
  }

  function clearQuery() {
    control.clear()
    setQuery('')
  }

  function closeAndRestore() {
    control.closePanel()
    restore()
  }

  const inputAttrs = computed<InputHTMLAttributes>(() => ({
    ...control.inputAttrs.value,
    onCompositionstart: () => { composing.value = true },
    // An IME commits with Enter; the listbox must not read that keystroke.
    onCompositionend: () => { composing.value = false },
    onKeydown: (event: KeyboardEvent) => {
      if (composing.value) return
      control.onKeydown(event)
    },
  }))

  watch(focused, (value) => {
    if (value) {
      if (props.openOnFocus && !props.disabled && !props.readonly) open.value = true
      return
    }

    control.chipFocus.value = null
    if (!open.value) restore()
  })

  // An externally changed model renames the field — unless the user is in it,
  // where their draft outranks anything arriving from outside.
  watch(model, () => {
    if (!focused.value) restore()
  })

  // The query counts as something to clear, even with nothing selected yet.
  const canClear = computed(() =>
    props.clearable && !props.mandatory && (control.hasSelection.value || draft.value !== ''))

  return {
    ...control,
    canClear,
    focused,
    draft,
    queryReady,
    inputAttrs,
    onInput,
    clearQuery,
    closeAndRestore,
  }
}
