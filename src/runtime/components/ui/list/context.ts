/**
 * @module list/context
 *
 * @remarks
 * One-value context: the vertical scale a `<MList>` sets for the rows inside
 * it. A row still takes its own `density` prop, so the context only answers
 * "what should I be if nobody told me". Namespace: `m3:list`.
 *
 * It is a context rather than a prop on every row because the scale belongs to
 * the list as a whole — a panel whose rows disagree about their height is not a
 * list, and making the consumer repeat the prop per row guarantees that one
 * day one of them will be missed.
 */
import { shallowRef } from 'vue'
import type { Ref } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import type { MListItemDensity } from './item/props'

export interface ListContext {
  /** Scale for the rows of this list. */
  density: Ref<MListItemDensity>
}

/** Standalone rows (no `<MList>` ancestor) fall back to the default scale. */
const FALLBACK: ListContext = { density: shallowRef<MListItemDensity>('default') }

export const [useListContext, provideListContext] = createContext<ListContext>('m3:list', FALLBACK)
