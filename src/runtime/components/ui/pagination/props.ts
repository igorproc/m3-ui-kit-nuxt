/**
 * Public prop surface for `<MPagination>` — a controlled, 1-based page
 * navigator.
 *
 * It receives the number of pages and updates only the page model: it owns no
 * items, slicing, fetching, router query, loading or table layout, and stays
 * distinct from the compact private table footer.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

/** Accessible name of a page button; without it the button is named by its number. */
export type MPaginationPageLabel = (page: number, current: boolean) => string

// The kit ships no names of its own (they would be English in an app that may
// not be): the icon controls and the landmark warn in dev when left unnamed.
export const mPaginationProps = {
  /** Number of pages. The sole source of the page count. */
  length: { type: Number, required: true as const },
  /** Maximum page/ellipsis slots. Normalized to a documented minimum. */
  totalVisible: { type: Number, default: 7 },
  /** Disables every control; each keeps its Tab stop (`aria-disabled`). */
  disabled: { type: Boolean, default: false },
  /** Renders the jump-to-first and jump-to-last controls. */
  showFirstLast: { type: Boolean, default: false },
  /** Renders the previous and next controls. */
  showPrevNext: { type: Boolean, default: true },
  /** Accessible name of the navigation landmark. */
  ariaLabel: { type: String, default: undefined },
  /** Accessible name of the jump-to-first control. */
  firstLabel: { type: String, default: undefined },
  /** Accessible name of the previous-page control. */
  previousLabel: { type: String, default: undefined },
  /** Accessible name of the next-page control. */
  nextLabel: { type: String, default: undefined },
  /** Accessible name of the jump-to-last control. */
  lastLabel: { type: String, default: undefined },
  /** Accessible name of a page button: `(3, true)` → "Page 3, current page". Unset, the number names it. */
  pageLabel: { type: Function as PropType<MPaginationPageLabel>, default: undefined },
}

export type MPaginationProps = ExtractPublicPropTypes<typeof mPaginationProps>

/**
 * Safe bindings for a page control replaced through the `item` slot; spread
 * `props` on it. While the pagination is disabled it is `aria-disabled`, not
 * `disabled`, so it keeps focus — `disabled` is there for the look.
 */
export interface PaginationItemSlot {
  page: number
  current: boolean
  disabled: boolean
  props: {
    'type': 'button'
    'aria-label'?: string
    'aria-current'?: 'page'
    'aria-disabled'?: 'true'
    'onClick': () => void
  }
}

/**
 * Safe bindings for a directional control replaced through its slot; spread
 * `props` on it. At a boundary it is `aria-disabled`, not `disabled`, so it
 * keeps focus — `disabled` is there for the look (`softDisabled` on `MButton`).
 */
export interface PaginationControlSlot {
  page: number
  disabled: boolean
  props: {
    'type': 'button'
    'aria-label'?: string
    'aria-disabled'?: 'true'
    'onClick': () => void
  }
}
