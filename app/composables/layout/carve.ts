/**
 * @module layout/carve
 *
 * @remarks
 * Pure carving engine for the auto-layout grid — no Vue, fully unit-testable.
 *
 * Items are processed in DOM order; each one cuts a band off the remaining
 * rectangle (Vuetify-like semantics: whoever comes first owns the corner).
 * The result is a `grid-template-areas/columns/rows` triple per device range
 * plus per-item viewport insets for sticky positioning.
 *
 * Grid area names equal item ids, so `grid-area: <id>` on the component side
 * always matches the generated template.
 */

export type LayoutKind = 'top' | 'bottom' | 'start' | 'end' | 'main'

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

export interface CarveResult {
  grid: CarveGrid
  /** Per-item viewport offsets, keyed by item id. */
  insets: Map<string, CarveInsets>
  /** Total sized footprint per edge (`--m3-layout-inset-*`). */
  totals: { top: string, right: string, bottom: string, left: string }
}

export interface RangeCss {
  /** Media query without the `@media` prefix; absent → base (mobile-first) block. */
  media?: string
  result: CarveResult
}

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

/**
 * Carves the grid from items in DOM order.
 *
 * Each band spans the cross-axis cells that were still unclaimed when it was
 * processed, so earlier items own the corners — Vuetify layout semantics.
 */
export function carve(items: CarveItem[]): CarveResult {
  const mainItem = items.find(item => item.kind === 'main')
  const mainArea = mainItem?.id ?? 'main'
  const bands = items.filter(item => item.kind !== 'main')

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
  const seen = { top: 0, bottom: 0, start: 0, end: 0 }
  const sized = { top: [] as string[], right: [] as string[], bottom: [] as string[], left: [] as string[] }
  const bottomStickyAcc: string[] = []

  const insetsSnapshot = (): CarveInsets => ({
    top: cssSum(sized.top),
    bottomSticky: cssSum(bottomStickyAcc),
    start: cssSum(sized.left),
    end: cssSum(sized.right),
  })

  for (const band of bands) {
    insets.set(band.id, insetsSnapshot())

    const track = band.size ? `var(${sizeVar(band.id)}, auto)` : 'auto'

    if (band.kind === 'top' || band.kind === 'bottom') {
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

      if (band.kind === 'top') {
        sized.top.push(expr)
      } else if (band.kind === 'bottom') {
        if (band.sticky) bottomStickyAcc.push(expr)
        sized.bottom.push(expr)
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
  }
}

/**
 * Assembles the per-layout `<style>` payload: base (mobile-first) block with
 * item size vars + one block per device range with grid templates and insets.
 */
export function buildLayoutCss(
  layoutId: string,
  sizeDecls: Record<string, string>,
  ranges: RangeCss[],
): string {
  const blocks: string[] = []

  ranges.forEach((range, index) => {
    const lines: string[] = []

    if (index === 0) {
      for (const [name, value] of Object.entries(sizeDecls)) {
        lines.push(`${name}: ${value};`)
      }
    }

    const { grid, insets, totals } = range.result

    lines.push(`--m3-layout-inset-top: ${totals.top};`)
    lines.push(`--m3-layout-inset-right: ${totals.right};`)
    lines.push(`--m3-layout-inset-bottom: ${totals.bottom};`)
    lines.push(`--m3-layout-inset-left: ${totals.left};`)

    for (const [id, inset] of insets) {
      if (inset.top !== '0px') lines.push(`${itemInsetVar(id, 'top')}: ${inset.top};`)
      if (inset.bottomSticky !== '0px') lines.push(`${itemInsetVar(id, 'bottom-sticky')}: ${inset.bottomSticky};`)
      if (inset.start !== '0px') lines.push(`${itemInsetVar(id, 'start')}: ${inset.start};`)
      if (inset.end !== '0px') lines.push(`${itemInsetVar(id, 'end')}: ${inset.end};`)
    }

    lines.push(`grid-template-areas: ${grid.areas};`)
    lines.push(`grid-template-columns: ${grid.columns};`)
    lines.push(`grid-template-rows: ${grid.rows};`)

    const rule = `#${layoutId} {\n  ${lines.join('\n  ')}\n}`
    blocks.push(range.media ? `@media ${range.media} {\n${rule}\n}` : rule)
  })

  return blocks.join('\n\n')
}
