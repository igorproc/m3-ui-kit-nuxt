import {
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
   * Inside another `<m-layout>`: the document's scroll padding belongs to the
   * outermost layout, which owns the page's fixed bands.
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

function safeAreaDecls(item: CarveItem, safeArea: CarveSafeArea | undefined): string[] {
  if (!safeArea) return []

  const decls: string[] = []

  if (safeArea.block) {
    const inset = SAFE_AREA_INSET[safeArea.block]
    const side = safeArea.block === 'top' ? 'start' : 'end'

    decls.push(
      `border-block-${side}: ${inset} solid transparent;`,
      `min-block-size: calc(var(${sizeVar(item.id)}, 0px) + ${inset});`,
    )
  }

  if (safeArea.inline) {
    decls.push(
      `border-left: ${SAFE_AREA_INSET.left} solid transparent;`,
      `border-right: ${SAFE_AREA_INSET.right} solid transparent;`,
    )
  }

  return decls
}

/**
 * Page-scroll mode: the document scrolls under the pinned zones, so a focused
 * control or an `#anchor` target would come to rest beneath them. Scroll padding
 * on the root keeps it clear. The size vars are declared on the layout element,
 * out of the root's reach, so the rule carries its own copies.
 */
function scrollPaddingRule(items: CarveItem[], fixed: CarveResult['fixed']): string | null {
  if (fixed.top === '0px' && fixed.bottom === '0px') return null

  const lines = items
    .filter(item => item.size && (item.kind === 'top' || item.kind === 'bottom'))
    .map(item => `${sizeVar(item.id)}: ${item.size};`)

  if (fixed.top !== '0px') lines.push(`scroll-padding-top: ${fixed.top};`)
  if (fixed.bottom !== '0px') lines.push(`scroll-padding-bottom: ${fixed.bottom};`)

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
    const { grid, insets, totals, fixed, safeArea } = carve(visible, { safeArea: !options.nested })
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

    const scrollRule = options.fullHeight || options.nested ? null : scrollPaddingRule(visible, fixed)
    if (scrollRule) blocks.push(spec.media ? `@media ${spec.media} {\n${scrollRule}\n}` : scrollRule)

    const itemRules: string[] = []
    const visibleIds = new Set(visible.map(item => item.id))

    for (const item of items) {
      const selector = `#${layoutId} > [${ZONE_ATTR}="${item.id}"]`

      if (!visibleIds.has(item.id)) {
        itemRules.push(`${selector} {\n  display: none;\n}`)
        continue
      }

      const decls = [...stickyDecls(item) ?? [], ...safeAreaDecls(item, safeArea.get(item.id))]
      if (decls.length) itemRules.push(`${selector} {\n  ${decls.join('\n  ')}\n}`)
    }

    if (itemRules.length) {
      const media = spec.itemsMedia ?? spec.media
      const payload = itemRules.join('\n')
      blocks.push(media ? `@media ${media} {\n${payload}\n}` : payload)
    }
  })

  return blocks.join('\n\n')
}
