/**
 * @module dropdown/types
 *
 * @remarks
 * Shared vocabulary of the selection family: what an item is, how its parts are
 * resolved, what a resolved row looks like, and the per-row facade a custom
 * panel receives.
 */
import type { ComputedRef, Ref, StyleValue } from 'vue'

/**
 * The one thing an item must declare. Identity cannot be inferred: a title
 * repeats, a value may be the object itself (and objects change identity on
 * every refetch), and an index changes when the list is filtered.
 */
export interface DropdownItemBase {
  id: PropertyKey
}

/** A key of the item, or a function computing the part from it. */
export type DropdownResolver<TItem, TResult> = keyof TItem | ((item: TItem, index: number) => TResult)

/**
 * The same thing as declared on a runtime props object, where the item type is
 * not available: a key by name, or a getter.
 */
export type DropdownRuntimeResolver<TResult> = string | ((item: never, index: number) => TResult)

/** Value equality, used for both selection and the model bridge. */
export type DropdownValueComparator = (left: never, right: never) => boolean

/** A row before selection state is known — what the resolvers produce. */
export interface DropdownResolvedItem<TItem = DropdownItemBase, TValue = unknown> {
  item: TItem
  key: PropertyKey
  id: string
  value: TValue
  title: string
  itemDisabled: boolean
}

/** An item after every resolver has been applied. */
export interface DropdownEntry<TItem = DropdownItemBase, TValue = unknown> {
  /** The source item, handed back untouched to slots. */
  item: TItem
  /** The item's declared identity. */
  key: PropertyKey
  /** DOM id of the row — the target of `aria-activedescendant`. */
  id: string
  /** What selecting this row writes to the model. */
  value: TValue
  /** Row text. */
  title: string
  /** Disabled by the data, or by the selection having reached `max`. */
  disabled: boolean
  /** Disabled by the data alone. */
  itemDisabled: boolean
  /** Cannot be selected right now only because `max` is reached. */
  blocked: boolean
  /** Currently part of the model. */
  selected: boolean
}

/** Attributes a custom panel spreads onto its own listbox root. */
export interface DropdownListboxAttrs {
  'id': string
  'role': 'listbox'
  'aria-multiselectable'?: 'true'
}

/** Attributes a custom panel spreads onto one row. */
export interface DropdownOptionAttrs {
  'id': string
  'role': 'option'
  /** Never a tab stop: the field keeps real focus and points here instead. */
  'tabindex': -1
  'aria-selected': boolean
  'aria-disabled'?: 'true'
  'onClick': (event: MouseEvent) => void
  'onPointermove': () => void
}

/**
 * Per-instance facade for the panel's children.
 *
 * A consumer replacing the panel (a virtual list, an infinite scroller) reads
 * this either from the `#default` slot scope or — when their own component
 * renders the rows — by injecting it, at any depth.
 */
export interface DropdownContext<TItem = DropdownItemBase, TValue = unknown> {
  /** Rows in data order; this order is also the keyboard order. */
  entries: ComputedRef<DropdownEntry<TItem, TValue>[]>
  /** Id of the row holding the virtual focus. */
  activeId: ComputedRef<string | undefined>
  /** Whether the panel is open. */
  isOpen: Readonly<Ref<boolean>>
  multiple: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  /** Whether `max` has been reached (`multiple` only). */
  limitReached: ComputedRef<boolean>
  listboxAttrs: ComputedRef<DropdownListboxAttrs>
  getOptionAttrs: (entry: DropdownEntry<TItem, TValue>) => DropdownOptionAttrs
  isSelected: (value: TValue) => boolean
  select: (value: TValue) => void
  unselect: (value: TValue) => void
  toggle: (value: TValue) => void
  close: () => void
}

/** Resolved configuration — defaults belong to the props, not to this file. */
export interface DropdownControlConfig {
  items: readonly DropdownItemBase[]
  itemTitle: DropdownRuntimeResolver<string>
  itemValue?: DropdownRuntimeResolver<unknown>
  itemDisabled: DropdownRuntimeResolver<boolean>
  valueComparator?: DropdownValueComparator
  multiple: boolean
  mandatory: boolean
  max?: number
  clearable: boolean
  disabled: boolean
  readonly: boolean
  loading: boolean
  maxHeight?: number | string
}

export interface UseDropdownControlOptions<TItem extends DropdownItemBase, TValue> {
  props: DropdownControlConfig
  model: Ref<TValue | TValue[] | undefined>
  open: Ref<boolean>
  /**
   * Whether the field accepts typing. A select swallows Space to choose the
   * active row; a combobox has to let it through as a character.
   */
  editable?: () => boolean
  /** Text in the field. Chip navigation only engages while it is empty. */
  draft?: () => string
  /**
   * Narrow the rows before they reach the panel (the autocomplete's filter).
   * Selection state arrives as an argument rather than being read back off the
   * control: the rows are evaluated while the control is still being built.
   */
  visible?: (
    rows: DropdownResolvedItem<TItem, TValue>[],
    api: { isSelected: (value: TValue) => boolean },
  ) => DropdownResolvedItem<TItem, TValue>[]
  /** Land the virtual focus on the first row whenever the rows change. */
  autoSelectFirst?: () => boolean
  onSelect?: (entry: DropdownResolvedItem<TItem, TValue>) => void
  onRemove?: (entry: DropdownResolvedItem<TItem, TValue>) => void
  onClear?: () => void
  onOpen?: () => void
  onClose?: () => void
  /** Escape and Tab, after the panel is closed (the combobox restores its draft). */
  onDismiss?: () => void
}

export interface UseDropdownControlReturn<TItem extends DropdownItemBase, TValue> {
  listboxId: string
  entries: ComputedRef<DropdownEntry<TItem, TValue>[]>
  selectedEntries: ComputedRef<DropdownResolvedItem<TItem, TValue>[]>
  displayTitle: ComputedRef<string>
  hasSelection: ComputedRef<boolean>
  activeIndex: Ref<number>
  activeId: ComputedRef<string | undefined>
  limitReached: ComputedRef<boolean>
  canClear: ComputedRef<boolean>
  chipFocus: Ref<number | null>
  chipId: (index: number) => string
  panelStyle: ComputedRef<StyleValue | undefined>
  inputAttrs: ComputedRef<Record<string, unknown>>
  listboxAttrs: ComputedRef<DropdownListboxAttrs>
  getOptionAttrs: (entry: DropdownEntry<TItem, TValue>) => DropdownOptionAttrs
  isSelected: (value: TValue) => boolean
  selectEntry: (entry: DropdownEntry<TItem, TValue>) => void
  removeEntry: (entry: DropdownResolvedItem<TItem, TValue>) => void
  clear: () => void
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  onKeydown: (event: KeyboardEvent) => void
  setActive: (index: number) => void
  context: DropdownContext<TItem, TValue>
}
