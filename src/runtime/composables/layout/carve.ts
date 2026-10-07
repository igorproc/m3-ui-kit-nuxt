/**
 * @module layout/carve
 *
 * @remarks
 * Pure carving engine for the auto-layout grid — no Vue, fully unit-testable.
 *
 * Items are processed by explicit order, then DOM/registration order; each one
 * cuts a band off the remaining rectangle (whoever comes first owns the corner).
 * The result is a `grid-template-areas/columns/rows` triple per device range
 * plus per-item viewport insets for sticky positioning.
 *
 * Grid area names equal item ids, so `grid-area: <id>` on the component side
 * always matches the generated template.
 */

export type LayoutKind = 'top' | 'bottom' | 'start' | 'end' | 'main'
type EdgeKind = Exclude<LayoutKind, 'main'>

export type DeviceRange = 'mobile' | 'tablet' | 'desktop'

/** Legacy v1 area names → logical kinds (kept while zones migrate). */
export const KIND_BY_AREA: Record<string, LayoutKind> = {
  header: 'top',
  footer: 'bottom',
  left: 'start',
  right: 'end',
  main: 'main',
}

export interface CarveItem {
  /** Sanitized unique id — doubles as the grid-area name. */
  id: string
  kind: LayoutKind
  /** CSS size expression: `var(--ui-app-bar-height-small)`, `360rem`, `calc(…)`. */
  size?: string
  /** The zone is pinned to the viewport — participates in sticky insets. */
  sticky?: boolean
  /** Lower values carve first; defaults to `0` like CSS flex/grid order. */
  order?: number
}

export interface CarveGrid {
  areas: string
  columns: string
  rows: string
}

export interface CarveInsets {
  /** Sum of sized top bands carved before the item. */
  top: string
  /** Sum of sized sticky bottom bands carved before the item. */
  bottomSticky: string
  /** Sum of sized start-side bands carved before the item. */
  start: string
  /** Sum of sized end-side bands carved before the item. */
  end: string
}

export type InsetEdge = 'top' | 'bottom-sticky' | 'start' | 'end'

export type SafeAreaBlockEdge = 'top' | 'bottom'

export interface CarveSafeArea {
  block?: SafeAreaBlockEdge
  inline: boolean
}

export interface CarveOptions {
  safeArea?: boolean
}

export interface CarveResult {
  grid: CarveGrid
  /** Per-item viewport offsets, keyed by item id. */
  insets: Map<string, CarveInsets>
  /** Total sized footprint per edge (`--m3-layout-inset-*`). */
  totals: { top: string, right: string, bottom: string, left: string }
  /**
   * How far the zones pinned with `position: fixed` reach into the viewport
   * from each edge. `top` ends at the far edge of the last pinned top zone, so
   * in-flow top zones carved before it count too: the pinned zone sits below them.
   */
  fixed: { top: string, bottom: string }
  safeArea: Map<string, CarveSafeArea>
}

/** Attribute selecting a registered zone element (set by `useLayoutItem`). */
export const ZONE_ATTR = 'data-m3-zone'

export const SAFE_AREA_INSET = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
} as const

const MAIN_TRACK = 'minmax(0, 1fr)'

/** CSS var carrying the resolved size of a registered item. */
export const sizeVar = (id: string) => `--m3-layout-${id}-size`

/** CSS var carrying a per-item viewport inset (для sticky/fixed позиционирования). */
export const itemInsetVar = (id: string, edge: InsetEdge) => `--m3-layout-${id}-${edge}`

/** Sums CSS expressions: `[] → 0px`, `[a] → a`, `[a, b] → calc(a + b)`. */
export function cssSum(parts: string[]): string {
  if (parts.length === 0) return '0px'
  if (parts.length === 1) return parts[0] ?? '0px'
  return `calc(${parts.join(' + ')})`
}

/** Grid-area names are CSS custom idents: strip junk, never start with a digit. */
export function sanitizeAreaName(raw: string): string {
  const cleaned = raw.replace(/[^\w-]/g, '')
  if (!cleaned) return 'zone'
  return /^[a-z_]/i.test(cleaned) ? cleaned : `z${cleaned}`
}

/** Device-range visibility: mobile drops side zones, tablet drops the end side. */
export function filterByRange(items: CarveItem[], range: DeviceRange): CarveItem[] {
  if (range === 'mobile') return items.filter(item => item.kind !== 'start' && item.kind !== 'end')
  if (range === 'tablet') return items.filter(item => item.kind !== 'end')
  return items
}

function windowEdgeOf(band: CarveItem, topBefore: string[], pinnedBottomBefore: string[]): SafeAreaBlockEdge | undefined {
  if (!band.sticky || !band.size) return undefined
  if (band.kind === 'top' && topBefore.length === 0) return 'top'
  if (band.kind === 'bottom' && pinnedBottomBefore.length === 0) return 'bottom'
  return undefined
}

function bandTrack(band: CarveItem, safeInset: string | undefined): string {
  if (!band.size) return 'auto'
  if (!safeInset) return `var(${sizeVar(band.id)}, auto)`
  return `calc(var(${sizeVar(band.id)}, 0px) + ${safeInset})`
}

/**
 * Carves the grid by explicit order, preserving input order for equal values.
 *
 * Each band spans the cross-axis cells that were still unclaimed when it was
 * processed, so earlier items own the corners — Vuetify layout semantics.
 */
export function carve(items: CarveItem[], options: CarveOptions = {}): CarveResult {
  const orderedItems = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.order ?? 0) - (b.item.order ?? 0) || a.index - b.index)
    .map(entry => entry.item)

  const mainItem = orderedItems.find(item => item.kind === 'main')
  const mainArea = mainItem?.id ?? 'main'
  const bands = orderedItems.filter((item): item is CarveItem & { kind: EdgeKind } => item.kind !== 'main')

  const counts = { top: 0, bottom: 0, start: 0, end: 0 }
  for (const band of bands) counts[band.kind]++

  const rowsCount = counts.top + 1 + counts.bottom
  const colsCount = counts.start + 1 + counts.end

  const matrix: string[][] = Array.from(
    { length: rowsCount },
    () => Array.from({ length: colsCount }, () => mainArea),
  )
  const rowSizes: string[] = Array.from({ length: rowsCount }, () => MAIN_TRACK)
  const colSizes: string[] = Array.from({ length: colsCount }, () => MAIN_TRACK)

  const insets = new Map<string, CarveInsets>()
  const safeArea = new Map<string, CarveSafeArea>()
  const seen = { top: 0, bottom: 0, start: 0, end: 0 }
  const sized = { top: [] as string[], right: [] as string[], bottom: [] as string[], left: [] as string[] }
  const bottomStickyAcc: string[] = []
  let fixedTop = '0px'

  const insetsSnapshot = (): CarveInsets => ({
    top: cssSum(sized.top),
    bottomSticky: cssSum(bottomStickyAcc),
    start: cssSum(sized.left),
    end: cssSum(sized.right),
  })

  for (const band of bands) {
    insets.set(band.id, insetsSnapshot())

    const isRow = band.kind === 'top' || band.kind === 'bottom'
    const windowEdge = options.safeArea ? windowEdgeOf(band, sized.top, bottomStickyAcc) : undefined
    const safeInset = windowEdge ? SAFE_AREA_INSET[windowEdge] : undefined
    const spansInline = Boolean(options.safeArea) && isRow && seen.start === 0 && seen.end === 0

    if (windowEdge || spansInline) safeArea.set(band.id, { block: windowEdge, inline: spansInline })

    const track = bandTrack(band, safeInset)

    if (isRow) {
      const row = band.kind === 'top' ? seen.top : rowsCount - 1 - seen.bottom
      const colFrom = seen.start
      const colTo = colsCount - 1 - seen.end

      for (let col = colFrom; col <= colTo; col++) {
        const cells = matrix[row]
        if (cells) cells[col] = band.id
      }
      rowSizes[row] = track
    } else {
      const col = band.kind === 'start' ? seen.start : colsCount - 1 - seen.end
      const rowFrom = seen.top
      const rowTo = rowsCount - 1 - seen.bottom

      for (let row = rowFrom; row <= rowTo; row++) {
        const cells = matrix[row]
        if (cells) cells[col] = band.id
      }
      colSizes[col] = track
    }

    if (band.size) {
      const expr = `var(${sizeVar(band.id)}, 0px)`
      const reach = safeInset ? [expr, safeInset] : [expr]

      if (band.kind === 'top') {
        sized.top.push(...reach)
        if (band.sticky) fixedTop = cssSum(sized.top)
      } else if (band.kind === 'bottom') {
        if (band.sticky) bottomStickyAcc.push(...reach)
        sized.bottom.push(...reach)
      } else if (band.kind === 'start') {
        sized.left.push(expr)
      } else {
        sized.right.push(expr)
      }
    }

    seen[band.kind]++
  }

  // Main is the leftover rectangle — constrained by every band regardless of
  // its own DOM position, so its insets are the full sums.
  if (mainItem) {
    insets.set(mainItem.id, insetsSnapshot())
  }

  return {
    grid: {
      areas: matrix.map(row => `"${row.join(' ')}"`).join(' '),
      columns: colSizes.join(' '),
      rows: rowSizes.join(' '),
    },
    insets,
    totals: {
      top: cssSum(sized.top),
      right: cssSum(sized.right),
      bottom: cssSum(sized.bottom),
      left: cssSum(sized.left),
    },
    fixed: {
      top: fixedTop,
      bottom: cssSum(bottomStickyAcc),
    },
    safeArea,
  }
}
