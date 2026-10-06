/**
 * @module useDropdownControl
 *
 * @remarks
 * The engine of the selection family — everything `<MDropdown>` and
 * `<MAutocomplete>` have in common: resolved rows, selection, the panel's open
 * state, the keyboard map, chip navigation and the ARIA wiring.
 *
 * It emits no classes and no `data-*`: a consumer who deletes the component tag
 * and spreads these bags onto their own markup keeps the behaviour. What it
 * does own is the *relationships* — ids, `aria-controls`, `aria-activedescendant`
 * — because those are behaviour, not decoration.
 *
 * Filtering is deliberately absent. It is the one thing the autocomplete adds,
 * and it enters through the `visible` hook.
 */
import { computed, nextTick, useId, watch } from 'vue'
import type { StyleValue } from 'vue'
import { useListbox } from '#kit/composables/listbox/useListbox'
import { useDropdownChips } from './useDropdownChips'
import { useDropdownEntries } from './useDropdownEntries'
import { useDropdownKeyboard } from './useDropdownKeyboard'
import type { PanelLanding } from './useDropdownKeyboard'
import { useDropdownSelection } from './useDropdownSelection'
import type {
  DropdownContext,
  DropdownControlConfig,
  DropdownEntry,
  DropdownItemBase,
  DropdownListboxAttrs,
  DropdownOptionAttrs,
  DropdownResolver,
  UseDropdownControlOptions,
  UseDropdownControlReturn,
} from './types'

export function useDropdownControl<TItem extends DropdownItemBase, TValue = TItem>(
  options: UseDropdownControlOptions<TItem, TValue>,
): UseDropdownControlReturn<TItem, TValue> {
  const { props, model, open } = options
  const listboxId = useId() as string
  const editable = () => options.editable?.() ?? false
  const draft = () => options.draft?.() ?? ''

  const resolved = useDropdownEntries<TItem, TValue>({
    items: () => props.items as readonly TItem[],
    itemTitle: () => props.itemTitle as DropdownResolver<TItem, string>,
    itemValue: () => props.itemValue as DropdownResolver<TItem, TValue> | undefined,
    itemDisabled: () => props.itemDisabled as DropdownResolver<TItem, boolean>,
    namespace: listboxId,
  })

  // A selected value the current items do not contain still needs a name. When
  // the model holds whole items (the default) the same resolver answers; when
  // it holds a scalar there is nothing to resolve and the value speaks for
  // itself.
  function resolveTitle(value: TValue): string {
    const resolver = props.itemTitle
    let title: unknown

    if (typeof resolver === 'function') {
      title = (resolver as (item: unknown, index: number) => string)(value, 0)
    } else if (typeof value === 'object' && value !== null) {
      title = (value as Record<string, unknown>)[resolver]
    }

    return title === undefined || title === null ? String(value) : String(title)
  }

  const selection = useDropdownSelection<TItem, TValue>({
    model,
    resolved,
    multiple: () => props.multiple,
    mandatory: () => props.mandatory,
    max: () => props.max,
    disabled: () => props.disabled,
    readonly: () => props.readonly,
    comparator: () => props.valueComparator as ((left: TValue, right: TValue) => boolean) | undefined,
    resolveTitle,
  })

  if (import.meta.dev && props.max !== undefined && !props.multiple) {
    console.warn('[m3:dropdown] `max` limits a multiple selection; a single-select field holds one value by definition.')
  }

  /**
   * Rows as the panel sees them. A row blocked by `max` is disabled for both
   * pointer and keyboard: it cannot be chosen, so walking onto it would offer
   * the user a move that does nothing.
   */
  const entries = computed<DropdownEntry<TItem, TValue>[]>(() => {
    const rows = options.visible
      ? options.visible(resolved.value, { isSelected: selection.isSelected })
      : resolved.value

    return rows.map((row) => {
      const blocked = selection.isBlocked(row.value)
      return {
        ...row,
        selected: selection.isSelected(row.value),
        blocked,
        disabled: row.itemDisabled || blocked,
      }
    })
  })

  const { activeIndex, activeEntry, activeDescendant, setActive, move } = useListbox(
    entries,
    open,
    () => options.autoSelectFirst?.() ?? !editable(),
  )

  const displayTitle = computed(() =>
    props.multiple ? '' : selection.selectedEntries.value[0]?.title ?? '')
  const hasSelection = computed(() => selection.selectedValues.value.length > 0)

  const panelStyle = computed<StyleValue | undefined>(() => {
    if (props.maxHeight === undefined) return undefined
    const value = typeof props.maxHeight === 'number' ? `${props.maxHeight}rem` : props.maxHeight
    return { '--m-dropdown-panel-max-height': value }
  })

  // --- panel ----------------------------------------------------------------
  // Set by a key that opens *and* aims (Home, End, a type-ahead match); read
  // once by the landing watcher below.
  let landing: PanelLanding | undefined

  function openAt(target?: PanelLanding) {
    if (props.disabled || props.readonly || open.value) return
    landing = target
    open.value = true
  }

  function openPanel() {
    openAt()
  }

  function closePanel() {
    if (!open.value) return
    open.value = false
  }

  function togglePanel() {
    if (open.value) closePanel()
    else openPanel()
  }

  watch(open, (value) => {
    if (value) {
      options.onOpen?.()
      return
    }
    chipFocus.value = null
    options.onClose?.()
  })

  // A key that aimed wins. Otherwise a select opens onto its current value; the
  // browser's own <select> does the same, and starting at the top would make
  // Enter re-pick the first row.
  watch(open, (value) => {
    if (!value) return
    const target = landing
    landing = undefined

    nextTick(() => {
      if (target === 'first' || target === 'last') return move(target)
      if (target !== undefined) return setActive(target)
      if (editable()) return

      const index = entries.value.findIndex(entry => entry.selected && !entry.disabled)
      if (index >= 0) setActive(index)
    })
  }, { flush: 'post' })

  // --- selection ------------------------------------------------------------
  function selectEntry(entry: DropdownEntry<TItem, TValue>) {
    if (entry.disabled) return

    if (props.multiple) {
      const wasSelected = entry.selected
      selection.toggle(entry.value)
      if (wasSelected) options.onRemove?.(entry)
      else options.onSelect?.(entry)
      return
    }

    selection.select(entry.value)
    options.onSelect?.(entry)
    closePanel()
  }

  function removeEntry(entry: DropdownResolvedItem<TItem, TValue>) {
    if (entry.itemDisabled) return
    selection.unselect(entry.value)
    options.onRemove?.(entry)
  }

  function clear() {
    selection.clear()
    options.onClear?.()
  }

  const { chipFocus, chipId, handleChipKeydown } = useDropdownChips({
    entries: selection.selectedEntries,
    multiple: () => props.multiple,
    draft,
    remove: removeEntry,
    namespace: listboxId,
  })

  // --- keyboard -------------------------------------------------------------
  function dismiss() {
    closePanel()
    options.onDismiss?.()
  }

  const onKeydown = useDropdownKeyboard({
    inert: () => props.disabled || props.readonly,
    editable,
    multiple: () => props.multiple,
    hasSelection: () => hasSelection.value,
    open,
    entries,
    activeIndex,
    activeEntry,
    move,
    setActive,
    openAt,
    closePanel,
    dismiss,
    selectEntry,
    clear,
    handleChipKeydown,
  })

  // --- attribute bags -------------------------------------------------------
  // A chip under the keyboard outranks the row: it is what Backspace deletes,
  // so it is what the screen reader has to name.
  const activeTarget = computed(() => {
    if (chipFocus.value !== null) return chipId(chipFocus.value)
    return open.value ? activeDescendant.value : undefined
  })

  const inputAttrs = computed<Record<string, unknown>>(() => ({
    'role': 'combobox',
    'aria-autocomplete': editable() ? 'list' : 'none',
    'aria-haspopup': 'listbox',
    'aria-expanded': String(open.value),
    'aria-controls': listboxId,
    'aria-activedescendant': activeTarget.value,
    'onKeydown': onKeydown,
  }))

  const listboxAttrs = computed<DropdownListboxAttrs>(() => ({
    id: listboxId,
    role: 'listbox',
    // The listbox is a separate widget in the accessibility tree; without its
    // own name it is announced as an anonymous list.
    ...(props.label ? { 'aria-label': props.label } : {}),
    ...(props.multiple ? { 'aria-multiselectable': 'true' as const } : {}),
    ...(props.loading ? { 'aria-busy': 'true' as const } : {}),
  }))

  const getOptionAttrs = (entry: DropdownEntry<TItem, TValue>): DropdownOptionAttrs => ({
    'id': entry.id,
    'role': 'option',
    'tabindex': -1,
    'aria-selected': entry.selected,
    ...(entry.disabled ? { 'aria-disabled': 'true' as const } : {}),
    'onClick': (event: MouseEvent) => {
      event.stopPropagation()
      selectEntry(entry)
    },
    'onPointermove': () => {
      const index = entries.value.findIndex(row => row.id === entry.id)
      if (index >= 0) setActive(index)
    },
  })

  const context: DropdownContext<TItem, TValue> = {
    entries,
    activeId: activeDescendant,
    isOpen: open,
    multiple: computed(() => props.multiple),
    disabled: computed(() => props.disabled),
    limitReached: selection.limitReached,
    listboxAttrs,
    getOptionAttrs,
    isSelected: selection.isSelected,
    select: selection.select,
    unselect: selection.unselect,
    toggle: selection.toggle,
    close: closePanel,
  }

  return {
    listboxId,
    entries,
    selectedEntries: selection.selectedEntries,
    displayTitle,
    hasSelection,
    activeIndex,
    activeId: activeDescendant,
    limitReached: selection.limitReached,
    canClear: computed(() => props.clearable && selection.canClear.value),
    chipFocus,
    chipId,
    panelStyle,
    inputAttrs,
    listboxAttrs,
    getOptionAttrs,
    isSelected: selection.isSelected,
    selectEntry,
    removeEntry,
    clear,
    openPanel,
    closePanel,
    togglePanel,
    onKeydown,
    setActive,
    context,
  }
}
