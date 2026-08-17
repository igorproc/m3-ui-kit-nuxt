/**
 * Public prop surface for `<MPagination>` — a controlled, 1-based page
 * navigator.
 *
 * It receives the number of pages and updates only the page model: it owns no
 * items, slicing, fetching, router query, loading or table layout, and stays
 * distinct from the compact private table footer.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mPaginationProps = {
  /** Number of pages. The sole source of the page count. */
  length: { type: Number, required: true as const },
  /** Maximum page/ellipsis slots. Normalized to a documented minimum. */
  totalVisible: { type: Number, default: 7 },
  /** Disables every control. */
  disabled: { type: Boolean, default: false },
  /** Renders the jump-to-first and jump-to-last controls. */
  showFirstLast: { type: Boolean, default: false },
  /** Renders the previous and next controls. */
  showPrevNext: { type: Boolean, default: true },
  /** Accessible name of the navigation landmark. */
  ariaLabel: { type: String, default: 'Pagination' },
  /** Accessible name of the jump-to-first control. */
  firstLabel: { type: String, default: 'First page' },
  /** Accessible name of the previous-page control. */
  previousLabel: { type: String, default: 'Previous page' },
  /** Accessible name of the next-page control. */
  nextLabel: { type: String, default: 'Next page' },
  /** Accessible name of the jump-to-last control. */
  lastLabel: { type: String, default: 'Last page' },
}

export type MPaginationProps = ExtractPublicPropTypes<typeof mPaginationProps>

/** Safe bindings for a page control replaced through the `item` slot. */
export interface PaginationItemSlot {
  page: number
  current: boolean
  props: {
    type: 'button'
    ariaLabel: string
    ariaCurrent?: 'page'
    disabled: boolean
    onClick: () => void
  }
}

/** Safe bindings for a directional control replaced through its slot. */
export interface PaginationControlSlot {
  page: number
  disabled: boolean
  props: {
    type: 'button'
    ariaLabel: string
    disabled: boolean
    onClick: () => void
  }
}
