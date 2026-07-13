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

export interface CarveResult {
  grid: CarveGrid
  /** Per-item viewport offsets, keyed by item id. */
  insets: Map<string, CarveInsets>
  /** Total sized footprint per edge (`--m3-layout-inset-*`). */
  totals: { top: string, right: string, bottom: string, left: string }
}

export interface RangeSpec {
  range: DeviceRange
  /** Media query without the `@media` prefix; absent → base (mobile-first) block. */
  media?: string
  /**
   * Media for per-item rules (sticky positioning, out-of-range hiding). MUST be
   * bounded on both sides for the base range — `display: none` from an
   * unbounded block would leak onto desktop (unlike the grid templates, it is
   * not overridden by the later @media blocks).
   */
  itemsMedia?: string
}

/** Attribute selecting a registered zone element (set by `useLayoutItem`). */
export const ZONE_ATTR = 'data-m3-zone'

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
 * Carves the grid by explicit order, preserving input order for equal values.
 *
 * Each band spans the cross-axis cells that were still unclaimed when it was
 * processed, so earlier items own the corners — Vuetify layout semantics.
 */
export function carve(items: CarveItem[]): CarveResult {
  const orderedItems = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.order ?? 0) - (b.item.order ?? 0) || a.index - b.index)
    .map(entry => entry.item)

  const mainItem = orderedItems.find(item => item.kind === 'main')
  const mainArea = mainItem?.id ?? 'main'
  const bands = orderedItems.filter(item => item.kind !== 'main')

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
 * Sticky declarations for a zone (план §2.6). Emitted into the generated CSS —
 * NOT inline: a zone sized by children contributions resolves its size only
 * after the whole tree has rendered (head payload), while the parent's inline
 * style is computed before the children's setup, so SSR/no-JS would miss it.
 *
 * - top/bottom: containing block грид-итема = его grid area, и в строке точной
 *   высоты sticky двигаться некуда → прибиваем `position: fixed`, а строка
 *   грида резервирует место size-переменной (ноль CLS). Без размера строке
 *   нечего резервировать — правило не эмитится, зона остаётся в потоке.
 * - start/end: колонка тянется на высоту контента → обычный sticky со
 *   смещением и высотой из per-item insets.
 */
function stickyDecls(item: CarveItem): string[] | null {
  if (!item.sticky) return null

  const top = `var(${itemInsetVar(item.id, 'top')}, 0px)`
  const bottomSticky = `var(${itemInsetVar(item.id, 'bottom-sticky')}, 0px)`

  if (item.kind === 'top' || item.kind === 'bottom') {
    if (!item.size) return null

    return [
      'position: fixed;',
      item.kind === 'top' ? `inset-block-start: ${top};` : `inset-block-end: ${bottomSticky};`,
      `inset-inline-start: var(${itemInsetVar(item.id, 'start')}, 0px);`,
      `inset-inline-end: var(${itemInsetVar(item.id, 'end')}, 0px);`,
    ]
  }

  if (item.kind === 'start' || item.kind === 'end') {
    return [
      'position: sticky;',
      'align-self: start;',
      `inset-block-start: ${top};`,
      `height: calc(100dvh - ${top} - ${bottomSticky});`,
    ]
  }

  return null
}

/**
 * Assembles the per-layout `<style>` payload. Per device range:
 * - `#<layoutId>` rule — size vars (base block), insets, grid templates;
 * - per-item rules (`#<layoutId> > [data-m3-zone="<id>"]`) — sticky
 *   positioning and `display: none` for zones filtered out of the range
 *   (otherwise they would become implicit tracks and break the grid).
 */
export function buildLayoutCss(layoutId: string, items: CarveItem[], ranges: RangeSpec[]): string {
  const blocks: string[] = []

  ranges.forEach((spec, index) => {
    const visible = filterByRange(items, spec.range)
    const { grid, insets, totals } = carve(visible)
    const lines: string[] = []

    if (index === 0) {
      for (const item of items) {
        if (item.size) lines.push(`${sizeVar(item.id)}: ${item.size};`)
      }
    }

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

    const rootRule = `#${layoutId} {\n  ${lines.join('\n  ')}\n}`
    blocks.push(spec.media ? `@media ${spec.media} {\n${rootRule}\n}` : rootRule)

    const itemRules: string[] = []
    const visibleIds = new Set(visible.map(item => item.id))

    for (const item of items) {
      const selector = `#${layoutId} > [${ZONE_ATTR}="${item.id}"]`

      if (!visibleIds.has(item.id)) {
        itemRules.push(`${selector} {\n  display: none;\n}`)
        continue
      }

      const decls = stickyDecls(item)
      if (decls) itemRules.push(`${selector} {\n  ${decls.join('\n  ')}\n}`)
    }

    if (itemRules.length) {
      const media = spec.itemsMedia ?? spec.media
      const payload = itemRules.join('\n')
      blocks.push(media ? `@media ${media} {\n${payload}\n}` : payload)
    }
  })

  return blocks.join('\n\n')
}
