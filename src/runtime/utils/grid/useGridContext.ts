/**
 * @module useGridContext
 *
 * @remarks
 * Tells an `<m-col>` what its breakpoints measure: the window (`@media`, the
 * default) or the width of the nearest `<m-container container>` (`@container`).
 * The column's breakpoint classes differ per mode, because a media rule cannot
 * be switched off by an ancestor. Namespace: `m3:grid`; `null` outside a container.
 */
import { createContext } from '#kit/shared/utils/context/createContext'

export interface GridContext {
  readonly queries: 'window' | 'container'
}

export const [useGridContext, provideGridContext] = createContext<GridContext | null>('m3:grid', null)
