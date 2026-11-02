/**
 * @module search/context
 *
 * @remarks
 * What `<MSearch>` shares with the rows of its view. A `<MSearchListItem>`
 * registers itself — its value, its title, whether it is disabled or removable —
 * and reads back the attributes the listbox engine gives it. The rows are the
 * app's markup, so the engine learns about them here instead of from an array.
 */
import type { Ref } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'

/** One row as the engine needs it. */
export interface SearchRow {
  /** The row's own id: identity for the engine and the base of its DOM id. */
  id: string
  /** Handed to `select` when the row is chosen. */
  value: unknown
  /** What a chosen row writes into the query. */
  title: string
  disabled: boolean
  removable: boolean
  /** The rendered row, for ordering by its place in the document. */
  el: () => HTMLElement | null
  /** Delete on the active row, or the pointer on its removal mark. */
  remove: () => void
}

export interface SearchContext {
  /** Adds a row; the returned function takes it out again. */
  register: (row: SearchRow) => () => void
  /** The option's id, role, state and handlers; empty until the engine knows the row. */
  optionAttrs: (id: string) => Record<string, unknown>
  /** The row holds the virtual focus. */
  isActive: (id: string) => boolean
  /** The keyboard, not the pointer, moved the virtual focus last. */
  keyboard: Readonly<Ref<boolean>>
  density: Readonly<Ref<MFieldDensity>>
}

export const [useSearchContext, provideSearchContext] = createContext<SearchContext>('m3:search')
