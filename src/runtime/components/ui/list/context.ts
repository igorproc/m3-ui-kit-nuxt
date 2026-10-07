/**
 * @module list/context
 *
 * @remarks
 * What a `<MList>` tells the parts inside it. Namespace: `m3:list`.
 *
 * - `density` — the vertical scale for rows that set none. It is a context
 *   rather than a prop on every row because the scale belongs to the list as a
 *   whole: making the consumer repeat it per row guarantees one row will miss it.
 * - `present` / `semantic` — whether a list encloses the caller, and whether
 *   that list is a `ul`. A row, a subheader and a divider pick their element
 *   from them: a direct child of a `ul` has to be an `li`, and a divider inside
 *   a list is decoration, not a separator.
 * - `surface` — the colour role the list sits on, which a sticky subheader has
 *   to fill itself with.
 */
import { shallowRef } from 'vue'
import type { Ref } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { MListItemDensity } from './item/props'
import type { MListSurface } from './types'

export interface ListContext {
  /** Scale for the rows of this list. */
  density: Readonly<Ref<MListItemDensity>>
  /** `false` only when no `<MList>` encloses the caller. */
  present: boolean
  /** The list renders as `ul`, so its direct children are `li`. `false` when the consumer gave it a role (a listbox). */
  semantic: Readonly<Ref<boolean>>
  /** Colour role of the surface the list sits on. */
  surface: Readonly<Ref<MListSurface>>
}

/** No `<MList>` ancestor: default scale, no list semantics, plain surface. */
export const LIST_CONTEXT_FALLBACK: ListContext = {
  density: shallowRef<MListItemDensity>('default'),
  present: false,
  semantic: shallowRef(false),
  surface: shallowRef<MListSurface>('surface'),
}

export const [useListContext, provideListContext] = createContext<ListContext>('m3:list', LIST_CONTEXT_FALLBACK)
