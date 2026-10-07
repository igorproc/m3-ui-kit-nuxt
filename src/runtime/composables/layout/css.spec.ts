import { describe, expect, it } from 'vitest'
import { SAFE_AREA_INSET, itemInsetVar, sizeVar } from './carve'
import type { CarveItem, LayoutKind } from './carve'
import { buildLayoutCss } from './css'
import type { RangeSpec } from './css'

const item = (id: string, kind: LayoutKind, size?: string, sticky?: boolean): CarveItem =>
  ({ id, kind, size, sticky })

const sizeRef = (id: string) => `var(${sizeVar(id)}, 0px)`

const RANGES: RangeSpec[] = [
  { range: 'mobile', itemsMedia: 'only screen and (max-width: 767px)' },
  { range: 'tablet', media: 'only screen and (min-width: 768px) and (max-width: 1199px)' },
  { range: 'desktop', media: 'only screen and (min-width: 1200px)' },
]

describe('buildLayoutCss', () => {
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

describe('buildLayoutCss — safe area', () => {
  const TOP = SAFE_AREA_INSET.top
  const BOTTOM = SAFE_AREA_INSET.bottom

  it('the pinned top zone on the window edge takes the cutout as a transparent border and grows by it', () => {
    const css = buildLayoutCss(
      'lid',
      [item('sb', 'top', 'var(--sb)', true), item('ab', 'top', 'var(--ab)', true), item('content', 'main')],
      RANGES,
    )

    expect(css).toContain(`#lid > [data-m3-zone="sb"] {\n  position: fixed;`)
    expect(css).toContain(`border-block-start: ${TOP} solid transparent;`)
    expect(css).toContain(`min-block-size: calc(${sizeRef('sb')} + ${TOP});`)
    expect(css).toContain(`${itemInsetVar('ab', 'top')}: calc(${sizeRef('sb')} + ${TOP});`)
    expect(css).toContain(`--m3-layout-inset-top: calc(${sizeRef('sb')} + ${TOP} + ${sizeRef('ab')});`)
    expect(css.match(/border-block-start/g)).toHaveLength(RANGES.length)
  })

  it('the pinned bottom zone on the window edge takes the bottom cutout', () => {
    const css = buildLayoutCss(
      'lid',
      [item('nav', 'bottom', 'var(--n)', true), item('content', 'main')],
      RANGES,
    )

    expect(css).toContain(`border-block-end: ${BOTTOM} solid transparent;`)
    expect(css).toContain(`min-block-size: calc(${sizeRef('nav')} + ${BOTTOM});`)
    expect(css).toContain(`grid-template-rows: minmax(0, 1fr) calc(${sizeRef('nav')} + ${BOTTOM});`)
  })

  it('a bar spanning the full width takes the side cutouts as physical borders', () => {
    const css = buildLayoutCss(
      'lid',
      [item('ab', 'top', 'var(--ab)', true), item('content', 'main')],
      RANGES,
    )

    expect(css).toContain(`border-left: ${SAFE_AREA_INSET.left} solid transparent;`)
    expect(css).toContain(`border-right: ${SAFE_AREA_INSET.right} solid transparent;`)
  })

  it('a bar beside a rail spans the full width only where the rail is out of the grid', () => {
    const css = buildLayoutCss(
      'lid',
      [item('rail', 'start', 'var(--r)', true), item('ab', 'top', 'var(--ab)', true), item('content', 'main')],
      RANGES,
    )

    const mobileBlock = css.slice(0, css.indexOf('min-width: 768px'))
    const desktopBlock = css.slice(css.indexOf('min-width: 1200px'))

    expect(mobileBlock).toContain('border-left')
    expect(desktopBlock).not.toContain('border-left')
    expect(desktopBlock).toContain(`border-block-start: ${TOP} solid transparent;`)
  })

  it('a zone without cutouts gets no safe-area declarations', () => {
    const css = buildLayoutCss(
      'lid',
      [item('nav', 'start', 'var(--n)', true), item('content', 'main')],
      RANGES,
    )

    expect(css).not.toContain('safe-area')
    expect(css).not.toContain('min-block-size')
  })

  it('a nested layout leaves the window cutouts to the outer one', () => {
    const css = buildLayoutCss(
      'lid',
      [item('ab', 'top', 'var(--ab)', true), item('nav', 'bottom', 'var(--n)', true), item('content', 'main')],
      RANGES,
      { nested: true },
    )

    expect(css).toContain('position: fixed;')
    expect(css).not.toContain('safe-area')
  })
})

describe('buildLayoutCss — scroll padding for pinned zones', () => {
  const DESKTOP: RangeSpec[] = [{ range: 'desktop' }]

  it('pinned top zones → html scroll-padding-top reaching the last pinned zone and the cutout', () => {
    const css = buildLayoutCss(
      'lid',
      [item('sb', 'top', 'var(--sb)', true), item('ab', 'top', 'var(--ab)', true), item('content', 'main')],
      DESKTOP,
    )

    expect(css).toContain('html {')
    expect(css).toContain(`scroll-padding-top: calc(${sizeRef('sb')} + ${SAFE_AREA_INSET.top} + ${sizeRef('ab')});`)
    expect(css).toContain(`${sizeVar('ab')}: var(--ab);`)
    expect(css).not.toContain('scroll-padding-bottom')
  })

  it('pinned bottom zone → html scroll-padding-bottom with the cutout', () => {
    const css = buildLayoutCss(
      'lid',
      [item('nav', 'bottom', 'var(--n)', true), item('content', 'main')],
      DESKTOP,
    )

    expect(css).toContain(`scroll-padding-bottom: calc(${sizeRef('nav')} + ${SAFE_AREA_INSET.bottom});`)
    expect(css).not.toContain('scroll-padding-top')
  })

  it('no pinned zones → no scroll padding', () => {
    const css = buildLayoutCss(
      'lid',
      [item('header', 'top', 'var(--h)'), item('nav', 'start', 'var(--n)', true), item('content', 'main')],
      DESKTOP,
    )

    expect(css).not.toContain('scroll-padding')
  })

  it('sizeless sticky zone stays in flow → no scroll padding', () => {
    const css = buildLayoutCss(
      'lid',
      [item('header', 'top', undefined, true), item('content', 'main')],
      DESKTOP,
    )

    expect(css).not.toContain('scroll-padding')
  })

  it('full-height: main scrolls itself → no scroll padding', () => {
    const css = buildLayoutCss(
      'lid',
      [item('ab', 'top', 'var(--ab)', true), item('nav', 'bottom', 'var(--n)', true), item('content', 'main')],
      DESKTOP,
      { fullHeight: true },
    )

    expect(css).toContain('position: fixed;')
    expect(css).not.toContain('scroll-padding')
    expect(css).not.toContain('html {')
  })

  it('nested layout: the outer layout owns the document scroll padding', () => {
    const css = buildLayoutCss(
      'lid',
      [item('ab', 'top', 'var(--ab)', true), item('content', 'main')],
      DESKTOP,
      { nested: true },
    )

    expect(css).not.toContain('scroll-padding')
    expect(css).not.toContain('html {')
  })
})
