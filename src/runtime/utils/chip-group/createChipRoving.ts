import { computed, shallowReactive, shallowRef } from 'vue'
import type { ComputedRef, ShallowRef } from 'vue'

/** One registered chip as the focus machinery sees it. */
export interface ChipView<TValue> {
  element: Readonly<ShallowRef<HTMLElement | null>>
  value: () => TValue
  blocked: () => boolean
}

export interface ChipRovingOptions<TValue> {
  comparator: () => (left: TValue, right: TValue) => boolean
  isSelected: (value: TValue) => boolean
  /** Called when the focused chip goes away and no other chip can take focus. */
  onOrphanedFocus: () => void
}

export interface ChipRoving<TValue> {
  /** The one chip that is a Tab stop. */
  activeView: ComputedRef<ChipView<TValue> | undefined>
  add: (view: ChipView<TValue>) => () => void
  focusNext: (value: TValue) => void
  focusPrev: (value: TValue) => void
  focusFirst: () => void
  focusLast: () => void
  /** Bind to the group's `focusin`: remembers where Tab should come back to. */
  onFocusin: (event: FocusEvent) => void
}

// `Node.DOCUMENT_POSITION_FOLLOWING`, spelled out: this runs while rendering,
// where the server has no `Node` (and no elements, so it never gets here).
const FOLLOWING = 4

/**
 * Registration order is not DOM order: a reordered `items` or a chip behind a
 * `v-if` registers last wherever it stands. The document decides.
 */
function byDocumentOrder<TValue>(left: ChipView<TValue>, right: ChipView<TValue>) {
  const a = left.element.value
  const b = right.element.value
  if (!a || !b || a === b) return 0
  return a.compareDocumentPosition(b) & FOLLOWING ? -1 : 1
}

/**
 * The roving focus of `<MChipGroup>`: one Tab stop, arrows around a closed
 * ring in document order, chips blocked by `max` skipped. Tab comes back to the
 * chip that last had focus (APG toolbar); on the first entry to the selected
 * chip, otherwise the first. A focused chip that is removed passes focus to its
 * neighbour. Internal to the chip group.
 */
export function createChipRoving<TValue>(options: ChipRovingOptions<TValue>): ChipRoving<TValue> {
  const views = shallowReactive<ChipView<TValue>[]>([])
  const lastFocused = shallowRef<ChipView<TValue> | null>(null)

  const focusable = () => views.filter(view => !view.blocked()).sort(byDocumentOrder)

  const activeView = computed(() => {
    const list = focusable()
    if (lastFocused.value && list.includes(lastFocused.value)) return lastFocused.value
    return list.find(view => options.isSelected(view.value())) ?? list[0]
  })

  const focusAt = (list: ChipView<TValue>[], index: number) => list[index]?.element.value?.focus()

  function move(value: TValue, step: 1 | -1) {
    const list = focusable()
    if (!list.length) return
    const equal = options.comparator()
    const current = list.findIndex(view => equal(view.value(), value))
    if (current === -1) {
      focusAt(list, step === 1 ? 0 : list.length - 1)
      return
    }
    // Wrap around: the group is a closed ring with one tab stop.
    focusAt(list, (current + step + list.length) % list.length)
  }

  function handOff(view: ChipView<TValue>) {
    const element = view.element.value
    if (!element || element.ownerDocument.activeElement !== element) return
    const list = focusable()
    const index = list.indexOf(view)
    const neighbour = list[index + 1] ?? list[index - 1]
    if (neighbour?.element.value) neighbour.element.value.focus()
    else options.onOrphanedFocus()
  }

  function add(view: ChipView<TValue>) {
    views.push(view)

    return () => {
      handOff(view)
      if (lastFocused.value === view) lastFocused.value = null
      const index = views.indexOf(view)
      if (index !== -1) views.splice(index, 1)
    }
  }

  function onFocusin(event: FocusEvent) {
    const view = views.find(candidate => candidate.element.value === event.target)
    if (view) lastFocused.value = view
  }

  return {
    activeView,
    add,
    focusNext: value => move(value, 1),
    focusPrev: value => move(value, -1),
    focusFirst: () => focusAt(focusable(), 0),
    focusLast: () => {
      const list = focusable()
      focusAt(list, list.length - 1)
    },
    onFocusin,
  }
}
