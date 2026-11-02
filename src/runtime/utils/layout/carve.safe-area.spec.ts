import { describe, expect, it } from 'vitest'
import {
  SAFE_AREA_INLINE,
  SAFE_AREA_INSET,
  carve,
  sizeVar,
} from './carve'
import type { CarveItem, LayoutKind } from './carve'

const item = (id: string, kind: LayoutKind, size?: string, sticky?: boolean): CarveItem =>
  ({ id, kind, size, sticky })

const sizeRef = (id: string) => `var(${sizeVar(id)}, 0px)`

describe('carve — safe area', () => {
  const TOP = SAFE_AREA_INSET.top
  const BOTTOM = SAFE_AREA_INSET.bottom

  it('without the option no zone takes the cutouts', () => {
    const { grid, safeArea } = carve([
      item('ab', 'top', 'var(--ab)', true),
      item('content', 'main'),
    ])

    expect(safeArea.size).toBe(0)
    expect(grid.rows).toBe(`var(${sizeVar('ab')}, auto) minmax(0, 1fr)`)
  })

  it('the pinned top zone on the window edge reserves the cutout in its row', () => {
    const { grid, safeArea } = carve([
      item('sb', 'top', 'var(--sb)', true),
      item('ab', 'top', 'var(--ab)', true),
      item('content', 'main'),
    ], { safeArea: true })

    expect(grid.rows).toBe(`calc(${sizeRef('sb')} + ${TOP}) var(${sizeVar('ab')}, auto) minmax(0, 1fr)`)
    expect(safeArea.get('sb')).toEqual({ block: 'top', inline: true })
    expect(safeArea.get('ab')).toEqual({ block: undefined, inline: true })
  })

  it('the top cutout reaches the next pinned zone, the totals and the fixed reach', () => {
    const { insets, totals, fixed } = carve([
      item('sb', 'top', 'var(--sb)', true),
      item('ab', 'top', 'var(--ab)', true),
      item('rail', 'start', 'var(--r)', true),
      item('content', 'main'),
    ], { safeArea: true })

    const reach = `calc(${sizeRef('sb')} + ${TOP} + ${sizeRef('ab')})`

    expect(insets.get('sb')?.top).toBe('0px')
    expect(insets.get('ab')?.top).toBe(`calc(${sizeRef('sb')} + ${TOP})`)
    expect(insets.get('rail')?.top).toBe(reach)
    expect(totals.top).toBe(reach)
    expect(fixed.top).toBe(reach)
  })

  it('a sized in-flow top zone before the pinned one keeps the pinned zone off the window edge', () => {
    const { grid, safeArea } = carve([
      item('before', 'top', 'var(--b)'),
      item('ab', 'top', 'var(--ab)', true),
      item('content', 'main'),
    ], { safeArea: true })

    expect(safeArea.get('before')?.block).toBeUndefined()
    expect(safeArea.get('ab')?.block).toBeUndefined()
    expect(grid.rows).toBe(`var(${sizeVar('before')}, auto) var(${sizeVar('ab')}, auto) minmax(0, 1fr)`)
  })

  it('a sizeless sticky top zone stays in flow and takes no block cutout', () => {
    const { grid, safeArea } = carve([
      item('header', 'top', undefined, true),
      item('content', 'main'),
    ], { safeArea: true })

    expect(safeArea.get('header')).toEqual({ block: undefined, inline: true })
    expect(grid.rows).toBe('auto minmax(0, 1fr)')
  })

  it('the first pinned bottom zone takes the bottom cutout even behind an in-flow footer', () => {
    const { grid, insets, totals, fixed, safeArea } = carve([
      item('foot', 'bottom', 'var(--f)'),
      item('nav', 'bottom', 'var(--n)', true),
      item('rail', 'start', 'var(--r)', true),
      item('content', 'main'),
    ], { safeArea: true })

    const pinned = `calc(${sizeRef('nav')} + ${BOTTOM})`

    expect(safeArea.get('foot')?.block).toBeUndefined()
    expect(safeArea.get('nav')?.block).toBe('bottom')
    expect(grid.rows).toBe(`minmax(0, 1fr) calc(${sizeRef('nav')} + ${BOTTOM}) var(${sizeVar('foot')}, auto)`)
    expect(insets.get('rail')?.bottomSticky).toBe(pinned)
    expect(fixed.bottom).toBe(pinned)
    expect(totals.bottom).toBe(`calc(${sizeRef('foot')} + ${sizeRef('nav')} + ${BOTTOM})`)
  })

  it('only one pinned bottom zone takes the cutout', () => {
    const { safeArea } = carve([
      item('nav', 'bottom', 'var(--n)', true),
      item('bar', 'bottom', 'var(--b)', true),
      item('content', 'main'),
    ], { safeArea: true })

    expect(safeArea.get('nav')?.block).toBe('bottom')
    expect(safeArea.get('bar')?.block).toBeUndefined()
  })

  it('side cutouts go to the bars that span the full width and to the first zone of each side', () => {
    const railFirst = carve([
      item('rail', 'start', 'var(--r)', true),
      item('header', 'top', 'var(--h)', true),
      item('content', 'main'),
    ], { safeArea: true })

    expect(railFirst.safeArea.get('rail')).toEqual({ block: undefined, inline: false, side: 'start' })
    expect(railFirst.safeArea.get('header')).toEqual({ block: 'top', inline: false })

    const headerFirst = carve([
      item('header', 'top', 'var(--h)', true),
      item('rail', 'start', 'var(--r)', true),
      item('content', 'main'),
    ], { safeArea: true })

    expect(headerFirst.safeArea.get('header')).toEqual({ block: 'top', inline: true })
    expect(headerFirst.safeArea.get('rail')).toEqual({ block: undefined, inline: false, side: 'start' })
  })

  // The column of a side zone runs the whole height of the window edge, so it
  // meets the cutout whether it is pinned or not.
  it.each(['start', 'end'] as const)('the first %s zone grows its column by the cutout of its own edge', (side) => {
    const { grid, totals } = carve([
      item('side', side, 'var(--s)'),
      item('content', 'main'),
    ], { safeArea: true })
    const track = `calc(${sizeRef('side')} + ${SAFE_AREA_INLINE[side]})`

    expect(grid.columns).toBe(side === 'start' ? `${track} minmax(0, 1fr)` : `minmax(0, 1fr) ${track}`)
    expect(totals[side]).toBe(track)
  })

  it('only the first zone of a side takes its cutout', () => {
    const { grid, safeArea } = carve([
      item('rail', 'start', 'var(--r)', true),
      item('list', 'start', 'var(--l)'),
      item('content', 'main'),
    ], { safeArea: true })

    expect(safeArea.get('list')).toBeUndefined()
    expect(grid.columns).toBe(`calc(${sizeRef('rail')} + ${SAFE_AREA_INLINE.start}) var(${sizeVar('list')}, auto) minmax(0, 1fr)`)
  })

  it('a sizeless side zone keeps an auto column: its cutout border grows it', () => {
    const { grid, safeArea } = carve([
      item('rail', 'start'),
      item('content', 'main'),
    ], { safeArea: true })

    expect(safeArea.get('rail')?.side).toBe('start')
    expect(grid.columns).toBe('auto minmax(0, 1fr)')
  })

  it('a bar carved after the rail starts past the cutout', () => {
    const { insets } = carve([
      item('rail', 'start', 'var(--r)', true),
      item('ab', 'top', 'var(--ab)', true),
      item('content', 'main'),
    ], { safeArea: true })

    expect(insets.get('ab')!.start).toBe(`calc(${sizeRef('rail')} + ${SAFE_AREA_INLINE.start})`)
  })

  it('takes no side cutout without the safe-area option (a nested layout)', () => {
    const { grid, safeArea } = carve([
      item('rail', 'start', 'var(--r)', true),
      item('content', 'main'),
    ])

    expect(safeArea.size).toBe(0)
    expect(grid.columns).toBe(`var(${sizeVar('rail')}, auto) minmax(0, 1fr)`)
  })
})
