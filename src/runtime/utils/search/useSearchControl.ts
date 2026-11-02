/**
 * @module useSearchControl
 *
 * @remarks
 * The behaviour of `<MSearch>`: a query, and a view of results the keyboard
 * walks. The listbox — rows, virtual focus, `aria-activedescendant`, the
 * pointer — is the selection family's engine ({@link useDropdownControl}).
 * What a search changes on top of it:
 *
 * - **the query is the value.** Nothing is selected and nothing is put back on
 *   blur; choosing a row writes its title into the query and reports the row;
 * - **Enter** chooses the active row, and with none it runs the query (`submit`);
 * - **Escape** steps back one thing at a time: it closes the view, then clears
 *   the query, then lets the key go to the dialog or sheet around the bar;
 * - **Delete** on a removable row (a recent query) removes it — the keyboard
 *   twin of the pointer's removal mark, since an option holds no buttons;
 * - **rows come from markup.** `<MSearchListItem>` registers itself, and the
 *   keyboard follows the rows' order in the document, not the order they
 *   registered in — a filter that brings a row back mounts it last.
 *
 * The docked view renders its rows only while open, so whether it has anything
 * to show is known only once it opens: an open view that turns out empty closes
 * again in the same flush, before anything is painted.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useDropdownControl } from '#kit/composables/dropdown/useDropdownControl'
import type { DropdownControlConfig, UseDropdownControlReturn } from '#kit/composables/dropdown/types'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'
import type { SearchContext, SearchRow } from './context'

/** What the view shows: rows, progress alone, the no-results message, or nothing. */
export type SearchViewState = 'rows' | 'loading' | 'no-results' | 'none'

interface SearchItem {
  id: string
  title: string
  value: unknown
  disabled: boolean
}

export interface UseSearchControlOptions {
  query: Ref<string>
  open: Ref<boolean>
  /** `inline` shows its view whenever there is something in it; `docked` opens and closes. */
  inline: () => boolean
  /** A view exists at all: results were passed as markup or as `items`. */
  hasView: () => boolean
  disabled: () => boolean
  loading: () => boolean
  /** A no-results message or slot exists. */
  canSayNoResults: () => boolean
  /** Names the listbox. */
  label: () => string | undefined
  density: () => MFieldDensity
  onSelect: (value: unknown) => void
  onSubmit: (query: string) => void
  onClear: () => void
}

export interface UseSearchControlReturn {
  engine: UseDropdownControlReturn<SearchItem, unknown>
  state: ComputedRef<SearchViewState>
  /** The focus came from the keyboard: the bar wears the ring. */
  keyboardFocus: Ref<boolean>
  /** Handlers, and the combobox ARIA while there is a view to control. */
  inputAttrs: ComputedRef<Record<string, unknown>>
  context: SearchContext
  /** The rows moved in the document; re-read their order. */
  reorder: () => void
  /** The pointer moved over the view: it, not the keyboard, drives the cursor now. */
  onViewPointer: () => void
  /** The next focus comes from the pointer (a press beside the input, on the bar). */
  markPointer: () => void
  clear: () => void
}

// `Node.DOCUMENT_POSITION_FOLLOWING`, without the DOM global the server lacks.
const DOCUMENT_POSITION_FOLLOWING = 4

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])

/** Document order; a row not rendered yet (the server) keeps its registration order. */
function byDocumentOrder(left: SearchRow, right: SearchRow): number {
  const a = left.el()
  const b = right.el()
  if (!a || !b) return 0
  return a.compareDocumentPosition(b) & DOCUMENT_POSITION_FOLLOWING ? -1 : 1
}

export function useSearchControl(options: UseSearchControlOptions): UseSearchControlReturn {
  const { query, open } = options

  const rows = shallowRef<SearchRow[]>([])
  const orderVersion = ref(0)
  const ordered = computed(() => {
    void orderVersion.value
    return [...rows.value].sort(byDocumentOrder)
  })

  function register(row: SearchRow) {
    rows.value = [...rows.value, row]
    return () => {
      rows.value = rows.value.filter(entry => entry !== row)
    }
  }

  const items = computed<SearchItem[]>(() => ordered.value.map(row => ({
    id: row.id,
    title: row.title,
    value: row.value,
    disabled: row.disabled,
  })))

  // The engine expects a field's props; a search fixes most of them.
  const config: DropdownControlConfig = {
    get label() { return options.label() },
    get items() { return items.value },
    itemTitle: 'title',
    itemValue: 'value',
    itemDisabled: 'disabled',
    multiple: false,
    mandatory: false,
    clearable: false,
    get disabled() { return options.disabled() },
    readonly: false,
    get loading() { return options.loading() },
  }

  // The engine's selection model; a search holds no value, so it is emptied
  // as soon as a choice has been reported.
  const selection = ref<unknown>(undefined)

  const state = computed<SearchViewState>(() => {
    if (rows.value.length) return 'rows'
    if (options.loading()) return 'loading'
    if (query.value.trim() && options.canSayNoResults()) return 'no-results'
    return 'none'
  })

  const canOpen = () => options.hasView() && !options.disabled() && !options.inline()

  const engine = useDropdownControl<SearchItem, unknown>({
    props: config,
    model: selection,
    open,
    editable: () => true,
    draft: () => query.value,
    autoSelectFirst: () => false,
    landOnValue: () => false,
    canOpen,
    onSelect: (entry) => {
      query.value = entry.title
      selection.value = undefined
      options.onSelect(entry.value)
    },
  })

  // Docked: a view that opened onto nothing closes before it is painted.
  watch([open, state], () => {
    if (!options.inline() && open.value && state.value === 'none') engine.closePanel()
  }, { flush: 'post' })

  // Inline: the view is open exactly while it has something in it.
  watch(() => options.inline() && options.hasView() && state.value !== 'none', (shown) => {
    if (options.inline()) open.value = shown
  }, { immediate: true })

  const keyboard = ref(false)
  const keyboardFocus = ref(false)
  const composing = ref(false)
  // A press comes before the focus it causes: the one signal that tells a
  // pointer focus from a keyboard one (a text field matches `:focus-visible`
  // either way).
  let pressed = false

  const activeRow = () => {
    const id = engine.entries.value.find(entry => entry.id === engine.activeId.value)?.key
    return rows.value.find(row => row.id === id)
  }

  function clear() {
    query.value = ''
    options.onClear()
  }

  function onKeydown(event: KeyboardEvent) {
    if (composing.value || event.isComposing || event.keyCode === 229) return
    if (NAVIGATION_KEYS.has(event.key)) keyboard.value = true

    switch (event.key) {
      case 'Enter':
        if (open.value && activeRow()) break
        event.preventDefault()
        engine.closePanel()
        options.onSubmit(query.value)
        return
      case 'Escape':
        if (open.value && !options.inline()) break
        // Chromium empties a search field on Escape by itself, without telling
        // anyone; Firefox does not. An empty bar lets the key go on.
        if (!query.value || options.disabled()) return
        event.preventDefault()
        event.stopPropagation()
        clear()
        return
      case 'Delete': {
        const row = open.value ? activeRow() : undefined
        if (!row?.removable) return
        event.preventDefault()
        row.remove()
        return
      }
    }
    engine.onKeydown(event)
  }

  function openByPointer() {
    if (!open.value) engine.openPanel()
  }

  // Without a view the bar is a plain search field, not a combobox.
  const inputAttrs = computed<Record<string, unknown>>(() => ({
    ...(options.hasView() ? engine.inputAttrs.value : {}),
    onKeydown,
    onPointerdown: () => { pressed = true },
    onFocus: () => {
      keyboardFocus.value = !pressed
      if (pressed) openByPointer()
      pressed = false
    },
    onBlur: () => { keyboardFocus.value = false },
    // A press on a bar that already has focus (after Escape, say) opens it too.
    onClick: openByPointer,
    onInput: (event: Event) => {
      query.value = (event.target as HTMLInputElement).value
      if (!composing.value) engine.openPanel()
    },
    onCompositionstart: () => { composing.value = true },
    onCompositionend: () => {
      composing.value = false
      engine.openPanel()
    },
  }))

  const context: SearchContext = {
    register,
    optionAttrs: (id) => {
      const entry = engine.entries.value.find(row => row.key === id)
      return entry ? engine.getOptionAttrs(entry) : {}
    },
    isActive: id => engine.entries.value.some(entry => entry.key === id && entry.id === engine.activeId.value),
    keyboard,
    density: computed(options.density),
  }

  return {
    engine,
    state,
    keyboardFocus,
    inputAttrs,
    context,
    reorder: () => { orderVersion.value++ },
    onViewPointer: () => { keyboard.value = false },
    markPointer: () => { pressed = true },
    clear,
  }
}
