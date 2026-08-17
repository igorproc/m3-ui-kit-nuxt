/**
 * @module useAutocomplete
 *
 * @remarks
 * Headless logic for `<MAutocompleteInput>` — the thin view only renders the
 * text field, menu, and list slots. This factory owns item resolution, single
 * selection, filtering, and the keyboard FSM (on top of {@link useListbox}). The
 * multiple selection model and chip keyboard navigation are delegated to
 * {@link useChipSelection}, which the dropdown reuses.
 *
 * Generic over the item shape (`TItem`) and its resolved value (`TValue`).
 */
import type { InputHTMLAttributes, Ref } from 'vue'
import { useListbox } from '#kit/composables/listbox/useListbox'
import { useChipSelection } from '#kit/composables/selection/useChipSelection'
import type { MAutocompleteRuntimeProps } from '#kit/components/ui/autocomplete/props'

export interface AutocompleteEntry<TItem, TValue> {
  item: TItem
  value: TValue
  title: string
  disabled: boolean
  key: string | number
  id: string
}

type Resolver = string | ((item: unknown) => unknown) | undefined

interface UseAutocompleteOptions<TItem, TValue> {
  props: MAutocompleteRuntimeProps
  model: Ref<TValue | TValue[] | undefined>
  search: Ref<string>
  open: Ref<boolean>
  emit: {
    (event: 'select' | 'remove', item: TItem): void
    (event: 'clear' | 'open' | 'close'): void
  }
}

export function useAutocomplete<TItem, TValue = TItem>(options: UseAutocompleteOptions<TItem, TValue>) {
  const { props, model, search, open, emit } = options

  const focused = ref(false)
  const composing = ref(false)
  const draft = ref(search.value)
  const listboxId = useId()

  function resolve<TResult>(item: TItem, resolver: Resolver, fallback: TResult): TResult {
    if (typeof resolver === 'function') {
      return resolver(item) as TResult
    }

    if (typeof resolver === 'string' && item && typeof item === 'object') {
      return (item as Record<string, TResult>)[resolver] ?? fallback
    }
    return fallback
  }

  const entries = computed<AutocompleteEntry<TItem, TValue>[]>(() => props.items.map((raw, index) => {
    const item = raw as TItem
    const title = String(resolve(item, props.itemTitle, typeof item === 'object' ? '' : item))
    const value = resolve(item, props.itemValue, item as unknown as TValue)
    const key = resolve(item, props.itemKey, String(value ?? index))

    return {
      item,
      value,
      title,
      key,
      disabled: Boolean(resolve(item, props.itemDisabled, false)),
      id: `${listboxId}-option-${String(key).replace(/[^\w-]/g, '-')}`,
    }
  }))

  // Multiple selection model + chip keyboard navigation (shared with dropdown).
  const chip = useChipSelection<TValue, AutocompleteEntry<TItem, TValue>>({
    model,
    entries,
    draft,
    namespace: listboxId,
    multiple: () => props.multiple,
    mandatory: () => props.mandatory,
    disabled: () => props.disabled,
    readonly: () => props.readonly,
    createFallbackEntry: (value, index) => ({
      item: value as unknown as TItem,
      value,
      title: String(value),
      disabled: false,
      key: `selected-${index}-${String(value)}`,
      id: '',
    }),
    onSelect: entry => emit('select', entry.item),
    onRemove: entry => emit('remove', entry.item),
  })
  const { selectedEntries, isSelected, chipFocus, chipId } = chip

  const queryReady = computed(() => search.value.length >= Math.max(0, props.minSearchLength ?? 0))

  const visibleEntries = computed(() => {
    if (!queryReady.value) {
      return []
    }

    const query = search.value.trim().toLocaleLowerCase()
    return entries.value.filter((entry) => {
      if (props.hideSelected && isSelected(entry.value)) {
        return false
      }

      if (props.filter === false || !query) {
        return true
      }

      if (typeof props.filter === 'function') {
        return props.filter(entry.item, search.value, entry.title)
      }
      const title = entry.title.toLocaleLowerCase()
      return props.filterMode === 'starts-with' ? title.startsWith(query) : title.includes(query)
    })
  })

  const { activeIndex, activeEntry, activeDescendant, setActive, move } = useListbox(
    visibleEntries,
    open,
    () => props.autoSelectFirst ?? false,
  )

  const canClear = computed(() => !props.mandatory && (chip.selectedValues.value.length > 0 || draft.value !== ''))
  const selectedTitle = computed(() => selectedEntries.value[0]?.title ?? '')

  const inputAttrs = computed<InputHTMLAttributes>(() => ({
    'role': 'combobox',
    'aria-autocomplete': 'list',
    'aria-haspopup': 'listbox',
    'aria-expanded': String(open.value),
    'aria-controls': listboxId,
    'aria-activedescendant': open.value ? activeDescendant.value : undefined,
    onKeydown,
    'onCompositionstart': () => { composing.value = true },
    'onCompositionend': () => { composing.value = false },
  }))

  function onInput(value: string) {
    draft.value = value
    search.value = value
    if (!composing.value && !props.disabled && !props.readonly && queryReady.value) open.value = true
  }

  function restore() {
    const value = props.multiple ? '' : selectedTitle.value
    draft.value = value
    search.value = value
  }

  function closeAndRestore() {
    open.value = false
    restore()
  }

  function select(entry: AutocompleteEntry<TItem, TValue> | undefined) {
    if (!entry || entry.disabled || props.disabled || props.readonly) return
    if (props.multiple) {
      chip.select(entry)
      draft.value = ''
      search.value = ''
      return
    }
    model.value = entry.value
    draft.value = entry.title
    search.value = entry.title
    open.value = false
    emit('select', entry.item)
  }

  function remove(entry: AutocompleteEntry<TItem, TValue>) {
    chip.remove(entry)
  }

  function clear() {
    if (!canClear.value) return
    model.value = props.multiple ? [] as TValue[] : undefined
    draft.value = ''
    search.value = ''
    emit('clear')
  }

  function toggle() {
    if (props.disabled || props.readonly) return
    open.value = !open.value
  }

  function onKeydown(event: KeyboardEvent) {
    if (composing.value || props.disabled || props.readonly) return
    if (chip.handleChipKeydown(event)) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open.value) open.value = true
      nextTick(() => move(event.key === 'ArrowDown' ? 'next' : 'previous'))
    } else if (open.value && event.key === 'Home') {
      event.preventDefault()
      move('first')
    } else if (open.value && event.key === 'End') {
      event.preventDefault()
      move('last')
    } else if (open.value && event.key === 'Enter') {
      event.preventDefault()
      select(activeEntry.value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeAndRestore()
    } else if (event.key === 'Tab') {
      closeAndRestore()
    }
  }

  watch(focused, (value) => {
    if (value && props.openOnFocus && !props.disabled && !props.readonly) {
      open.value = true
    }

    if (!value) {
      chipFocus.value = null
      if (!open.value) restore()
    }
  })
  watch(model, () => {
    if (focused.value) {
      return
    }

    restore()
  })
  watch(open, value => emit(value ? 'open' : 'close'))

  return {
    focused,
    draft,
    listboxId,
    chipFocus,
    chipId,
    visibleEntries,
    selectedEntries,
    isSelected,
    activeIndex,
    canClear,
    inputAttrs,
    setActive,
    onInput,
    select,
    remove,
    clear,
    toggle,
    closeAndRestore,
  }
}
