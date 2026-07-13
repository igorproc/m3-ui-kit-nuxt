import { describe, expect, it } from 'vitest'
import {
  buildLayoutCss,
  carve,
  cssSum,
  filterByRange,
  itemInsetVar,
  sanitizeAreaName,
  sizeVar,
} from '../app/composables/layout/carve'
import type { CarveItem, LayoutKind, RangeSpec } from '../app/composables/layout/carve'

const item = (id: string, kind: LayoutKind, size?: string, sticky?: boolean): CarveItem =>
  ({ id, kind, size, sticky })

describe('carve — grid templates', () => {
  it('empty registry → single main cell', () => {
    const { grid } = carve([])

    expect(grid.areas).toBe('"main"')
    expect(grid.columns).toBe('minmax(0, 1fr)')
    expect(grid.rows).toBe('minmax(0, 1fr)')
  })

  it('classic shell: header → aside → main → footer (aside owns the bottom corner)', () => {
    const { grid } = carve([
      item('header', 'top', 'var(--h)'),
      item('aside', 'start', 'var(--w)'),
      item('content', 'main'),
      item('footer', 'bottom'),
    ])

    expect(grid.areas).toBe('"header header" "aside content" "aside footer"')
    expect(grid.rows).toBe(`var(${sizeVar('header')}, auto) minmax(0, 1fr) auto`)
    expect(grid.columns).toBe(`var(${sizeVar('aside')}, auto) minmax(0, 1fr)`)
  })

  it('steam order: footer registered before drawer → footer takes full width', () => {
    const { grid } = carve([
      item('sb', 'top', 'var(--sb)'),
      item('ab', 'top', 'var(--ab)'),
      item('foot', 'bottom', 'var(--f)'),
      item('nav', 'start', 'var(--n)'),
    ])

    expect(grid.areas).toBe('"sb sb" "ab ab" "nav main" "foot foot"')
  })

  it('drawer registered before footer → drawer owns the bottom corner', () => {
    const { grid } = carve([
      item('sb', 'top', 'var(--sb)'),
      item('ab', 'top', 'var(--ab)'),
      item('nav', 'start', 'var(--n)'),
      item('foot', 'bottom', 'var(--f)'),
    ])

    expect(grid.areas).toBe('"sb sb" "ab ab" "nav main" "nav foot"')
  })

  it('explicit order stabilizes SSR when an async aside registers after the header', () => {
    const { grid } = carve([
      { ...item('header', 'top', 'var(--h)'), order: 1 },
      { ...item('aside', 'start', 'var(--w)'), order: 0 },
      { ...item('content', 'main'), order: 2 },
    ])

    expect(grid.areas).toBe('"aside header" "aside content"')
  })

  it('equal and omitted order values preserve registration order', () => {
    const { grid } = carve([
      { ...item('header', 'top'), order: 0 },
      item('aside', 'start'),
      item('content', 'main'),
    ])

    expect(grid.areas).toBe('"header header" "aside content"')
  })

  it('end side mirrors start: three-column shell', () => {
    const { grid } = carve([
      item('header', 'top', 'var(--h)'),
      item('left', 'start', 'var(--l)'),
      item('right', 'end', 'var(--r)'),
      item('content', 'main'),
    ])

    expect(grid.areas).toBe('"header header header" "left content right"')
    expect(grid.columns).toBe(`var(${sizeVar('left')}, auto) minmax(0, 1fr) var(${sizeVar('right')}, auto)`)
  })

  it('custom main id names the leftover cell', () => {
    const { grid } = carve([
      item('header', 'top'),
      item('layout-main', 'main'),
    ])

    expect(grid.areas).toBe('"header" "layout-main"')
  })

  it('sizeless band gets an auto track', () => {
    const { grid } = carve([item('header', 'top')])

    expect(grid.rows).toBe('auto minmax(0, 1fr)')
  })
})

describe('carve — insets', () => {
  it('per-item top inset accumulates previous sized top bands', () => {
    const { insets } = carve([
      item('sb', 'top', 'var(--sb)'),
      item('ab', 'top', 'var(--ab)'),
      item('nav', 'start', 'var(--n)'),
    ])

    expect(insets.get('sb')?.top).toBe('0px')
    expect(insets.get('ab')?.top).toBe(`var(${sizeVar('sb')}, 0px)`)
    expect(insets.get('nav')?.top).toBe(`calc(var(${sizeVar('sb')}, 0px) + var(${sizeVar('ab')}, 0px))`)
  })

  it('bottom-sticky inset counts only sticky bottoms carved before the item', () => {
    const { insets } = carve([
      item('foot-sticky', 'bottom', 'var(--f1)', true),
      item('foot-plain', 'bottom', 'var(--f2)'),
      item('nav', 'start', 'var(--n)'),
    ])

    expect(insets.get('nav')?.bottomSticky).toBe(`var(${sizeVar('foot-sticky')}, 0px)`)
  })

  it('sizeless bands are skipped in inset sums (height unknown)', () => {
    const { insets } = carve([
      item('sb', 'top'),
      item('ab', 'top', 'var(--ab)'),
      item('nav', 'start'),
    ])

    expect(insets.get('ab')?.top).toBe('0px')
    expect(insets.get('nav')?.top).toBe(`var(${sizeVar('ab')}, 0px)`)
  })

  it('main gets the full sums regardless of its DOM position', () => {
    const { insets } = carve([
      item('content', 'main'),
      item('header', 'top', 'var(--h)'),
      item('foot', 'bottom', 'var(--f)', true),
    ])

    expect(insets.get('content')?.top).toBe(`var(${sizeVar('header')}, 0px)`)
    expect(insets.get('content')?.bottomSticky).toBe(`var(${sizeVar('foot')}, 0px)`)
  })

  it('start/end insets accumulate previous sized side bands', () => {
    const { insets } = carve([
      item('nav', 'start', 'var(--n)'),
      item('header', 'top', 'var(--h)'),
      item('side', 'end', 'var(--s)'),
    ])

    expect(insets.get('nav')?.start).toBe('0px')
    expect(insets.get('header')?.start).toBe(`var(${sizeVar('nav')}, 0px)`)
    expect(insets.get('header')?.end).toBe('0px')
    expect(insets.get('side')?.top).toBe(`var(${sizeVar('header')}, 0px)`)
  })

  it('totals sum every sized band per edge', () => {
    const { totals } = carve([
      item('sb', 'top', 'var(--sb)'),
      item('ab', 'top', 'var(--ab)'),
      item('nav', 'start', 'var(--n)'),
      item('side', 'end', 'var(--s)'),
      item('foot', 'bottom', 'var(--f)'),
    ])

    expect(totals.top).toBe(`calc(var(${sizeVar('sb')}, 0px) + var(${sizeVar('ab')}, 0px))`)
    expect(totals.left).toBe(`var(${sizeVar('nav')}, 0px)`)
    expect(totals.right).toBe(`var(${sizeVar('side')}, 0px)`)
    expect(totals.bottom).toBe(`var(${sizeVar('foot')}, 0px)`)
  })
})

describe('filterByRange', () => {
  const items = [
    item('header', 'top'),
    item('nav', 'start'),
    item('side', 'end'),
    item('content', 'main'),
  ]

  it('mobile drops side zones', () => {
    expect(filterByRange(items, 'mobile').map(i => i.id)).toEqual(['header', 'content'])
  })

  it('tablet drops the end side only', () => {
    expect(filterByRange(items, 'tablet').map(i => i.id)).toEqual(['header', 'nav', 'content'])
  })

  it('desktop keeps everything', () => {
    expect(filterByRange(items, 'desktop')).toEqual(items)
  })
})

describe('cssSum', () => {
  it('empty → 0px', () => {
    expect(cssSum([])).toBe('0px')
  })

  it('single value passes through', () => {
    expect(cssSum(['var(--a, 0px)'])).toBe('var(--a, 0px)')
  })

  it('multiple values wrap in calc', () => {
    expect(cssSum(['var(--a, 0px)', 'var(--b, 0px)'])).toBe('calc(var(--a, 0px) + var(--b, 0px))')
  })
})

describe('sanitizeAreaName', () => {
  it('strips invalid characters', () => {
    expect(sanitizeAreaName('v:1')).toBe('v1')
  })

  it('never starts with a digit', () => {
    expect(sanitizeAreaName('1abc')).toBe('z1abc')
  })

  it('never returns an empty ident', () => {
    expect(sanitizeAreaName(':::')).toBe('zone')
  })
})

describe('buildLayoutCss', () => {
  const RANGES: RangeSpec[] = [
    { range: 'mobile', itemsMedia: 'only screen and (max-width: 767px)' },
    { range: 'tablet', media: 'only screen and (min-width: 768px) and (max-width: 1199px)' },
    { range: 'desktop', media: 'only screen and (min-width: 1200px)' },
  ]

  it('emits the base block with size vars and media blocks per range', () => {
    const css = buildLayoutCss(
      'm-layout-test',
      [item('header', 'top', 'var(--h)'), item('content', 'main')],
      RANGES,
    )

    expect(css).toContain('#m-layout-test {')
    expect(css).toContain(`${sizeVar('header')}: var(--h);`)
    expect(css).toContain('@media only screen and (min-width: 768px) and (max-width: 1199px)')
    expect(css).toContain('@media only screen and (min-width: 1200px)')
    expect(css).toContain('grid-template-areas: "header" "content";')
    expect(css).toContain('--m3-layout-inset-top: var(--m3-layout-header-size, 0px);')
    expect(css).toContain('--m3-layout-content-top: var(--m3-layout-header-size, 0px);')
  })

  it('pins a sized sticky top zone with fixed + per-item insets (no inline, no JS)', () => {
    const css = buildLayoutCss(
      'lid',
      [item('sb', 'top', 'var(--sb)', true), item('ab', 'top', 'var(--ab)', true), item('content', 'main')],
      RANGES,
    )

    expect(css).toContain('#lid > [data-m3-zone="ab"] {')
    expect(css).toContain('position: fixed;')
    expect(css).toContain(`inset-block-start: var(${itemInsetVar('ab', 'top')}, 0px);`)
    expect(css).toContain(`inset-inline-start: var(${itemInsetVar('ab', 'start')}, 0px);`)
  })

  it('pins a sized sticky bottom zone via inset-block-end', () => {
    const css = buildLayoutCss(
      'lid',
      [item('nav', 'bottom', 'var(--n)', true), item('content', 'main')],
      RANGES,
    )

    expect(css).toContain('#lid > [data-m3-zone="nav"] {')
    expect(css).toContain(`inset-block-end: var(${itemInsetVar('nav', 'bottom-sticky')}, 0px);`)
  })

  it('sizeless sticky top zone emits no position rule (degrades in-flow)', () => {
    const css = buildLayoutCss(
      'lid',
      [item('header', 'top', undefined, true), item('content', 'main')],
      RANGES,
    )

    expect(css).not.toContain('position: fixed')
  })

  it('sticky side zone gets real sticky with viewport-clamped height', () => {
    const top = `var(${itemInsetVar('nav', 'top')}, 0px)`
    const bottom = `var(${itemInsetVar('nav', 'bottom-sticky')}, 0px)`

    const css = buildLayoutCss(
      'lid',
      [item('nav', 'start', 'var(--n)', true), item('content', 'main')],
      RANGES,
    )

    expect(css).toContain('#lid > [data-m3-zone="nav"] {')
    expect(css).toContain('position: sticky;')
    expect(css).toContain('align-self: start;')
    expect(css).toContain(`height: calc(100dvh - ${top} - ${bottom});`)
  })

  it('zones filtered out of a range are hidden inside the BOUNDED range media', () => {
    const css = buildLayoutCss(
      'lid',
      [item('nav', 'start'), item('content', 'main')],
      RANGES,
    )

    // моб. диапазон ограничен с обеих сторон — display: none не протекает выше
    expect(css).toContain(
      '@media only screen and (max-width: 767px) {\n#lid > [data-m3-zone="nav"] {\n  display: none;\n}\n}',
    )

    const desktopBlock = css.slice(css.indexOf('min-width: 1200px'))
    expect(desktopBlock).not.toContain('display: none')
  })
})
