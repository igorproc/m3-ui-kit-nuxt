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
 *   committed value and is put back on blur, Escape or Tab. The query is only
 *   what was typed: a committed title in the box is not a search, so reopening
 *   a field with a value lists everything, with the value ticked;
 * - **composition** — an IME's Enter belongs to the IME, not to the listbox.
 *
 * The match itself lives in {@link matchesQuery}, shared with `<MSearch>`.
 */
import { computed, nextTick, ref, watch } from 'vue'
import type { InputHTMLAttributes, Ref } from 'vue'
import { useDropdownControl } from '#kit/composables/dropdown/useDropdownControl'
import type {
  DropdownControlConfig,
  DropdownItemBase,
  DropdownResolvedItem,
  UseDropdownControlReturn,
} from '#kit/composables/dropdown/types'
import { matchesQuery } from '#kit/utils/dropdown/matchRows'
import type { RowFilter, RowFilterMode } from '#kit/utils/dropdown/matchRows'
import { isImeKeydown } from '#kit/utils/keyboard/ime'

/**
 * When focus alone opens the panel: `true` for any focus, `'pointer'` only for
 * a press on the field — moving through a form with Tab does not unfold every
 * list on the way — and `false` never (typing, ArrowDown and the toggle do).
 */
export type AutocompleteOpenOnFocus = boolean | 'pointer'

/** Resolved configuration: the family's props plus the query-only ones. */
export interface AutocompleteControlConfig extends DropdownControlConfig {
  filter: RowFilter
  filterMode: RowFilterMode
  minSearchLength: number
  hideSelected: boolean
  autoSelectFirst: boolean
  openOnFocus: AutocompleteOpenOnFocus
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
  /** The validation adapter is checking the value: the combobox reports itself busy. */
  pending?: () => boolean
  /** Whether the panel would show anything (rows, a hint, a message); it does not open onto nothing. */
  canOpen?: () => boolean
}

export interface UseAutocompleteReturn<TItem extends DropdownItemBase, TValue>
  extends Omit<UseDropdownControlReturn<TItem, TValue>, 'inputAttrs'> {
  focused: Ref<boolean>
  draft: Ref<string>
  /** True once the query is long enough for the list to mean anything. */
  queryReady: Ref<boolean>
  inputAttrs: Ref<InputHTMLAttributes>
  onInput: (value: string) => void
  /** Empties the selection and the query. */
  clearQuery: () => void
  /** Empties the query alone and keeps the panel open on the full list. */
  resetQuery: () => void
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

    return rows.filter((row) => {
      if (props.hideSelected && api.isSelected(row.value)) return false
      return matchesQuery(row.item, row.title, search.value, props.filter, props.filterMode)
    })
  }

  const canOpen = () => options.canOpen?.() ?? true

  const control = useDropdownControl<TItem, TValue>({
    props,
    model,
    open,
    editable: () => true,
    draft: () => draft.value,
    autoSelectFirst: () => props.autoSelectFirst,
    pending: options.pending,
    canOpen,
    // With nothing typed the list is the whole list, and it opens on the value.
    landOnValue: () => !search.value,
    visible: filterRows,
    onSelect: (entry) => {
      // Multiple keeps collecting, so the query is spent; single shows the
      // chosen title as the new resting text.
      commit(props.multiple ? '' : entry.title)
      emit('select', entry.item)
    },
    onRemove: entry => emit('remove', entry.item),
    onClear: () => emit('clear'),
    onOpen: () => emit('open'),
    onClose: () => emit('close'),
    onDismiss: restore,
  })

  /** What the user typed: the box and the query are the same text. */
  function setQuery(value: string) {
    draft.value = value
    search.value = value
  }

  /** A committed title in the box is the value speaking, not a query. */
  function commit(title: string) {
    draft.value = title
    search.value = ''
  }

  /** Put back the committed value: a draft that was never chosen is not a value. */
  function restore() {
    wanted.value = false
    commit(props.multiple ? '' : control.displayTitle.value)
  }

  // The user typed and wants the list. What it has to show may arrive later:
  // a remote search sets `loading` in the parent's next render, or after its
  // own debounce. Until the panel is dismissed, it opens as soon as it can.
  const wanted = ref(false)

  function decide() {
    if (!wanted.value) return
    // `canOpen` already knows the hint: below the minimum it opens only to say
    // how much more to type, never to claim "no results" for an unrun query.
    if (canOpen()) open.value = true
    else control.closePanel()
  }

  function onInput(value: string) {
    setQuery(value)
    wantList()
  }

  function wantList() {
    if (composing.value || props.disabled || props.readonly) return
    wanted.value = true
    nextTick(decide)
  }

  watch(() => wanted.value && focused.value && canOpen(), (can) => {
    if (can && !open.value) open.value = true
  })

  watch(open, (value) => {
    if (!value && !focused.value) wanted.value = false
  })

  // A field that arrives with a value shows its title from the first render,
  // the server's included — the draft alone, so no query is reported for a
  // search nobody typed.
  if (!props.multiple && !draft.value) draft.value = control.displayTitle.value

  function clearQuery() {
    control.clear()
    setQuery('')
  }

  function resetQuery() {
    setQuery('')
  }

  function closeAndRestore() {
    control.closePanel()
    restore()
  }

  // A press on the input comes before the focus it causes, so it is the one
  // signal that tells a pointer focus from a keyboard one.
  let pressed = false

  const inputAttrs = computed<InputHTMLAttributes>(() => ({
    ...control.inputAttrs.value,
    onPointerdown: () => { pressed = true },
    // A press on a field that already has focus (after Escape, say) opens it
    // too; the focus watcher below only sees the press that brought focus.
    onClick: () => {
      if (!open.value && opensOnFocus(true) && queryReady.value) control.openPanel()
    },
    onCompositionstart: () => { composing.value = true },
    // An IME commits with Enter; the listbox must not read that keystroke.
    onCompositionend: () => {
      composing.value = false
      wantList()
    },
    onKeydown: (event: KeyboardEvent) => {
      if (composing.value || isImeKeydown(event)) return
      control.onKeydown(event)
    },
  }))

  const opensOnFocus = (byPointer: boolean) => props.openOnFocus === true || (props.openOnFocus === 'pointer' && byPointer)

  watch(focused, (value) => {
    const byPointer = pressed
    pressed = false

    if (value) {
      if (opensOnFocus(byPointer) && queryReady.value && canOpen() && !props.disabled && !props.readonly) open.value = true
      return
    }

    control.chipFocus.value = null
    if (!open.value) restore()
  })

  // An externally changed model renames the field — unless the user is in it,
  // where their draft outranks anything arriving from outside. So does a title
  // that arrives after its value: items loaded later name a value given early.
  watch([model, control.displayTitle], () => {
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
    resetQuery,
    closeAndRestore,
  }
}
