import { describe, expect, it } from 'vitest'
import { SAFE_AREA_INLINE, SAFE_AREA_INSET, sizeVar } from './carve'
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

describe('buildLayoutCss — window insets on the root', () => {
  const DESKTOP: RangeSpec[] = [{ range: 'desktop' }]
  const rootRuleOf = (block: string) => block.slice(block.indexOf('html {')).split('}')[0]

  it('publishes the edges a teleported surface must clear, with its own copies of the sizes', () => {
    const css = buildLayoutCss(
      'lid',
      [
        item('ab', 'top', 'var(--ab)', true),
        item('rail', 'start', 'var(--r)'),
        item('nav', 'bottom', 'var(--n)', true),
        item('content', 'main'),
      ],
      DESKTOP,
    )
    const root = rootRuleOf(css)

    expect(root).toContain(`${sizeVar('ab')}: var(--ab);`)
    expect(root).toContain(`${sizeVar('rail')}: var(--r);`)
    expect(root).toContain(`${sizeVar('nav')}: var(--n);`)
    expect(root).toContain(`--m3-layout-inset-top: calc(${sizeRef('ab')} + ${SAFE_AREA_INSET.top});`)
    expect(root).toContain(`--m3-layout-inset-bottom: calc(${sizeRef('nav')} + ${SAFE_AREA_INSET.bottom});`)
    expect(root).toContain(`--m3-layout-inset-inline-start: calc(${sizeRef('rail')} + ${SAFE_AREA_INLINE.start});`)
    expect(root).toContain('--m3-layout-inset-inline-end: 0px;')
  })

  it('page scroll: a band in flow scrolls away, so only the pinned ones reach into the window', () => {
    const css = buildLayoutCss(
      'lid',
      [item('header', 'top', 'var(--h)'), item('foot', 'bottom', 'var(--f)'), item('content', 'main')],
      DESKTOP,
    )
    const layoutRule = css.slice(css.indexOf('#lid {')).split('}')[0]

    expect(layoutRule).toContain(`--m3-layout-inset-bottom: ${sizeRef('foot')};`)
    expect(rootRuleOf(css)).toContain('--m3-layout-inset-top: 0px;')
    expect(rootRuleOf(css)).toContain('--m3-layout-inset-bottom: 0px;')
  })

  it('full-height: every band stays on screen, so the root carries the whole edges', () => {
    const css = buildLayoutCss(
      'lid',
      [item('header', 'top', 'var(--h)'), item('foot', 'bottom', 'var(--f)'), item('content', 'main')],
      DESKTOP,
      { fullHeight: true },
    )
    const root = rootRuleOf(css)

    expect(root).toContain(`--m3-layout-inset-top: ${sizeRef('header')};`)
    expect(root).toContain(`--m3-layout-inset-bottom: ${sizeRef('foot')};`)
    expect(root).not.toContain('scroll-padding')
  })

  it('follows the device ranges: the mobile root drops the side zones', () => {
    const css = buildLayoutCss(
      'lid',
      [item('rail', 'start', 'var(--r)', true), item('content', 'main')],
      RANGES,
    )
    const mobile = css.slice(0, css.indexOf('min-width: 768px'))
    const desktop = css.slice(css.indexOf('min-width: 1200px'))

    expect(rootRuleOf(mobile)).toContain('--m3-layout-inset-inline-start: 0px;')
    expect(rootRuleOf(desktop)).toContain(`--m3-layout-inset-inline-start: calc(${sizeRef('rail')} + ${SAFE_AREA_INLINE.start});`)
  })
})
