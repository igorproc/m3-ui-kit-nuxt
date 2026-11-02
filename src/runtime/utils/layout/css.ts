import {
  SAFE_AREA_INLINE,
  SAFE_AREA_INSET,
  ZONE_ATTR,
  carve,
  filterByRange,
  itemInsetVar,
  sizeVar,
} from './carve'
import type { CarveItem, CarveResult, CarveSafeArea, DeviceRange } from './carve'

export interface LayoutCssOptions {
  /** `main` scrolls itself (`<m-layout full-height>`) instead of the document. */
  fullHeight?: boolean
  /**
   * Inside another `<m-layout>`: the outermost layout owns the window — its
   * pinned bands, cutouts and the document's scroll padding — so a nested
   * layout's sticky zones stay in flow.
   */
  nested?: boolean
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
 *   Fixed-зона выходит из грида и сжимается до контента — `min-block-size`
 *   держит её не ниже зарезервированной строки (с вырезом, если он её).
 * - start/end: колонка тянется на высоту контента → обычный sticky со
 *   смещением и высотой из per-item insets.
 */
function stickyDecls(item: CarveItem, safeArea: CarveSafeArea | undefined): string[] | null {
  if (!item.sticky) return null

  const top = `var(${itemInsetVar(item.id, 'top')}, 0px)`
  const bottomSticky = `var(${itemInsetVar(item.id, 'bottom-sticky')}, 0px)`

  if (item.kind === 'top' || item.kind === 'bottom') {
    if (!item.size) return null

    const blockSize = safeArea?.block
      ? `calc(var(${sizeVar(item.id)}, 0px) + ${SAFE_AREA_INSET[safeArea.block]})`
      : `var(${sizeVar(item.id)})`

    return [
      'position: fixed;',
      item.kind === 'top' ? `inset-block-start: ${top};` : `inset-block-end: ${bottomSticky};`,
      `inset-inline-start: var(${itemInsetVar(item.id, 'start')}, 0px);`,
      `inset-inline-end: var(${itemInsetVar(item.id, 'end')}, 0px);`,
      `min-block-size: ${blockSize};`,
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

function safeAreaDecls(safeArea: CarveSafeArea | undefined): string[] {
  if (!safeArea) return []

  const decls: string[] = []

  if (safeArea.block) {
    const side = safeArea.block === 'top' ? 'start' : 'end'

    decls.push(`border-block-${side}: ${SAFE_AREA_INSET[safeArea.block]} solid transparent;`)
  }

  if (safeArea.inline) {
    decls.push(
      `border-left: ${SAFE_AREA_INSET.left} solid transparent;`,
      `border-right: ${SAFE_AREA_INSET.right} solid transparent;`,
    )
  }

  if (safeArea.side) {
    decls.push(`border-inline-${safeArea.side}: ${SAFE_AREA_INLINE[safeArea.side]} solid transparent;`)
  }

  return decls
}

/**
 * `env()` has only physical side cutouts: the logical pair the side zones and
 * the inline insets use is declared per writing direction, on the layout and on
 * the root its window rule writes to.
 */
function logicalCutoutRules(layoutId: string): string[] {
  const pair = (start: string, end: string) =>
    `{\n  --m3-layout-safe-inline-start: ${start};\n  --m3-layout-safe-inline-end: ${end};\n}`
  const { left, right } = SAFE_AREA_INSET

  return [`#${layoutId}`, 'html'].flatMap(scope => [
    `${scope} ${pair(left, right)}`,
    `${scope}:dir(rtl) ${pair(right, left)}`,
  ])
}

/**
 * The window-level rule of the outermost layout. Surfaces teleported out of the
 * layout element (snackbar, FAB) read the edges they must clear from the root:
 * every band in `full-height` mode, where the grid is the window, but only the
 * pinned bands when the document scrolls — a band in flow scrolls away. In
 * page-scroll mode scroll padding also keeps a focused control or an `#anchor`
 * target clear of the pinned bands. The size vars are declared on the layout
 * element, out of the root's reach, so the rule carries its own copies.
 */
function windowRule(items: CarveItem[], carved: CarveResult, fullHeight: boolean): string {
  const { totals, fixed } = carved
  const reach = fullHeight ? { top: totals.top, bottom: totals.bottom } : fixed

  const lines = items
    .filter(item => item.size)
    .map(item => `${sizeVar(item.id)}: ${item.size};`)

  lines.push(`--m3-layout-inset-top: ${reach.top};`)
  lines.push(`--m3-layout-inset-bottom: ${reach.bottom};`)
  lines.push(`--m3-layout-inset-inline-start: ${totals.start};`)
  lines.push(`--m3-layout-inset-inline-end: ${totals.end};`)

  if (!fullHeight) {
    if (fixed.top !== '0px') lines.push(`scroll-padding-top: ${fixed.top};`)
    if (fixed.bottom !== '0px') lines.push(`scroll-padding-bottom: ${fixed.bottom};`)
  }

  return `html {\n  ${lines.join('\n  ')}\n}`
}

/**
 * Assembles the per-layout `<style>` payload. Per device range:
 * - `#<layoutId>` rule — size vars (base block), insets, grid templates;
 * - per-item rules (`#<layoutId> > [data-m3-zone="<id>"]`) — sticky
 *   positioning and `display: none` for zones filtered out of the range
 *   (otherwise they would become implicit tracks and break the grid);
 * - `html` scroll padding for the pinned zones, unless `main` scrolls itself.
 */
export function buildLayoutCss(
  layoutId: string,
  items: CarveItem[],
  ranges: RangeSpec[],
  options: LayoutCssOptions = {},
): string {
  const blocks: string[] = []

  ranges.forEach((spec, index) => {
    const visible = filterByRange(items, spec.range)
    const carved = carve(visible, { safeArea: !options.nested })
    const { grid, insets, totals, safeArea } = carved
    const lines: string[] = []

    if (index === 0) {
      for (const item of items) {
        if (item.size) lines.push(`${sizeVar(item.id)}: ${item.size};`)
      }
    }

    lines.push(`--m3-layout-inset-top: ${totals.top};`)
    lines.push(`--m3-layout-inset-bottom: ${totals.bottom};`)
    lines.push(`--m3-layout-inset-inline-start: ${totals.start};`)
    lines.push(`--m3-layout-inset-inline-end: ${totals.end};`)

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

    // A nested layout is content of an outer zone: the window belongs to the outer one
    if (!options.nested) {
      const rule = windowRule(visible, carved, Boolean(options.fullHeight))
      blocks.push(spec.media ? `@media ${spec.media} {\n${rule}\n}` : rule)
    }

    const itemRules: string[] = []
    const visibleIds = new Set(visible.map(item => item.id))

    for (const item of items) {
      const selector = `#${layoutId} > [${ZONE_ATTR}="${item.id}"]`

      if (!visibleIds.has(item.id)) {
        itemRules.push(`${selector} {\n  display: none;\n}`)
        continue
      }

      // Вложенный лейаут — содержимое чужой зоны: прибивать к viewport нечего,
      // окно и его вырезы принадлежат внешнему, зоны остаются в потоке
      if (options.nested) continue

      const itemSafeArea = safeArea.get(item.id)
      const decls = [...stickyDecls(item, itemSafeArea) ?? [], ...safeAreaDecls(itemSafeArea)]
      if (decls.length) itemRules.push(`${selector} {\n  ${decls.join('\n  ')}\n}`)
    }

    if (itemRules.length) {
      const media = spec.itemsMedia ?? spec.media
      const payload = itemRules.join('\n')
      blocks.push(media ? `@media ${media} {\n${payload}\n}` : payload)
    }
  })

  if (!options.nested && items.some(item => item.kind === 'start' || item.kind === 'end')) {
    blocks.push(...logicalCutoutRules(layoutId))
  }

  return blocks.join('\n\n')
}
