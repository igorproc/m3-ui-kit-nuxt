import type { MListItemDensity } from './item/props'

/**
 * Colour role of the surface a list sits on — the surface and container roles
 * of `$theme-color-link`. Mirrored by the subheader's `sticky.container.color`
 * token map; a role added here has to be added there.
 */
export type MListSurface
  = 'surface'
    | 'surface-container-lowest'
    | 'surface-container-low'
    | 'surface-container'
    | 'surface-container-high'
    | 'surface-container-highest'

export interface MListProps<T extends { id: string | number }> {
  /** Rows to render through the default scoped slot; an empty array renders `#empty`. */
  items?: T[]
  /** Vertical scale inherited by every row that does not set its own. */
  density?: MListItemDensity
  /**
   * Declares the surface the list sits on; the list itself stays transparent.
   * Only a sticky subheader reads it, to fill itself with the same colour.
   */
  surface?: MListSurface
}
