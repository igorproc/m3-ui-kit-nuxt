import type { MListItemDensity } from './item/props'

export interface MListProps<T extends { id: string | number }> {
  items?: T[]
  /** Vertical scale inherited by every row that does not set its own. */
  density?: MListItemDensity
}
