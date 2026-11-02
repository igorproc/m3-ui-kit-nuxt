import { describe, expect, it } from 'vitest'
import {
  carve,
  cssSum,
  filterByRange,
  sanitizeAreaName,
  sizeVar,
} from './carve'
import type { CarveItem, LayoutKind } from './carve'

const item = (id: string, kind: LayoutKind, size?: string, sticky?: boolean): CarveItem =>
  ({ id, kind, size, sticky })

const sizeRef = (id: string) => `var(${sizeVar(id)}, 0px)`

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
    expect(totals.start).toBe(`var(${sizeVar('nav')}, 0px)`)
    expect(totals.end).toBe(`var(${sizeVar('side')}, 0px)`)
    expect(totals.bottom).toBe(`var(${sizeVar('foot')}, 0px)`)
  })

  it('fixed top reach counts an in-flow top zone carved before the pinned one, not one after it', () => {
    const { fixed } = carve([
      item('before', 'top', 'var(--b)'),
      item('ab', 'top', 'var(--ab)', true),
      item('after', 'top', 'var(--a)'),
      item('content', 'main'),
    ])

    expect(fixed.top).toBe(`calc(${sizeRef('before')} + ${sizeRef('ab')})`)
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
