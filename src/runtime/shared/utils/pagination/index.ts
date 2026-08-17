/**
 * @module pagination
 *
 * @remarks
 * Pure, deterministic helpers for `<MPagination>`. Kept free of component and
 * reactive state so the ellipsis range and page clamping are identical on the
 * server and the client, and so table pagination can reuse the boundary maths
 * without importing the component.
 */

export type PaginationRangeItem
  = | { type: 'page', page: number }
    | { type: 'ellipsis', key: 'start' | 'end' }

/** Smallest `totalVisible` that can still show both ends plus the current page. */
const MIN_TOTAL_VISIBLE = 5
/** Pages pinned at each end. */
const BOUNDARY = 1

/**
 * Clamps a 1-based page into `[1, length]`. Zero length normalizes to 1 and
 * renders no page buttons; non-finite or fractional input is truncated first.
 */
export function normalizePage(page: number, length: number): number {
  const safeLength = Math.max(0, Math.floor(length))
  if (safeLength === 0) return 1
  const safePage = Number.isFinite(page) ? Math.trunc(page) : 1
  return Math.min(Math.max(safePage, 1), safeLength)
}

function pages(from: number, to: number): PaginationRangeItem[] {
  const items: PaginationRangeItem[] = []
  for (let page = from; page <= to; page += 1) items.push({ type: 'page', page })
  return items
}

/**
 * Builds the visible page/ellipsis sequence.
 *
 * The first and last pages are always present when an ellipsis is needed, the
 * window is centered on the current page where possible, and small lengths
 * render every page. A one-page gap is rendered as that page instead of an
 * ellipsis that would hide it, so the total slot count stays at `totalVisible`.
 *
 * The window is a boundary/sibling construction: `totalVisible` is 2 boundary
 * pages + 2 ellipses + the current page + `2 * siblingCount`, so
 * `siblingCount = floor((totalVisible - 5) / 2)`.
 */
export function createPaginationRange(
  page: number,
  length: number,
  totalVisible: number,
): PaginationRangeItem[] {
  const safeLength = Math.max(0, Math.floor(length))
  if (safeLength === 0) return []

  const visible = Math.max(MIN_TOTAL_VISIBLE, Math.floor(totalVisible))
  if (import.meta.dev && totalVisible < MIN_TOTAL_VISIBLE) {
    console.warn(`[m-pagination] totalVisible ${totalVisible} is below the minimum ${MIN_TOTAL_VISIBLE}; clamped.`)
  }

  if (safeLength <= visible) return pages(1, safeLength)

  const current = normalizePage(page, safeLength)
  const siblings = Math.floor((visible - 5) / 2)

  // Sibling window, kept inside the boundary pages and never spilling past the
  // point where an ellipsis would only hide a single page.
  const siblingsStart = Math.max(
    Math.min(current - siblings, safeLength - BOUNDARY - siblings * 2 - 1),
    BOUNDARY + 2,
  )
  const siblingsEnd = Math.min(
    Math.max(current + siblings, BOUNDARY + siblings * 2 + 2),
    safeLength - BOUNDARY - 1,
  )

  const items: PaginationRangeItem[] = pages(1, BOUNDARY)

  if (siblingsStart > BOUNDARY + 2) items.push({ type: 'ellipsis', key: 'start' })
  else if (siblingsStart === BOUNDARY + 2) items.push({ type: 'page', page: BOUNDARY + 1 })

  items.push(...pages(siblingsStart, siblingsEnd))

  if (siblingsEnd < safeLength - BOUNDARY - 1) items.push({ type: 'ellipsis', key: 'end' })
  else if (siblingsEnd === safeLength - BOUNDARY - 1) items.push({ type: 'page', page: safeLength - BOUNDARY })

  items.push(...pages(safeLength - BOUNDARY + 1, safeLength))
  return items
}
