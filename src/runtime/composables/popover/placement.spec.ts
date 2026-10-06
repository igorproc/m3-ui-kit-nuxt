import { describe, expect, it } from 'vitest'
import { computePopoverPosition, parsePlacement, placementToArea } from './placement'
import type { PopoverPositionInput, PopoverRect } from './placement'

const VIEWPORT = { width: 1000, height: 800 }
const MARGIN = 8

function rect(left: number, top: number, width = 100, height = 40): PopoverRect {
  return { left, top, right: left + width, bottom: top + height, width, height }
}

function position(overrides: Partial<PopoverPositionInput>) {
  return computePopoverPosition({
    anchor: rect(400, 300),
    surface: { width: 200, height: 150 },
    viewport: VIEWPORT,
    placement: 'bottom-start',
    offset: 0,
    margin: MARGIN,
    flip: true,
    ...overrides,
  })
}

describe('parsePlacement', () => {
  it('defaults the alignment to center', () => {
    expect(parsePlacement('top')).toEqual(['top', 'center'])
    expect(parsePlacement('right-end')).toEqual(['right', 'end'])
  })
})

describe('placementToArea', () => {
  it('maps side + alignment onto a position-area', () => {
    expect(placementToArea('bottom', 'start')).toBe('bottom span-right')
    expect(placementToArea('bottom', 'end')).toBe('bottom span-left')
    expect(placementToArea('right', 'start')).toBe('right span-bottom')
    expect(placementToArea('top', 'center')).toBe('top')
  })
})

describe('computePopoverPosition', () => {
  it('keeps the preferred placement when it fits', () => {
    expect(position({})).toEqual({ top: 340, left: 400, side: 'bottom', align: 'start' })
  })

  it('applies the offset along the main axis', () => {
    expect(position({ offset: 4 }).top).toBe(344)
    expect(position({ placement: 'top-start', offset: 4 }).top).toBe(300 - 150 - 4)
  })

  it('centers on the anchor for a center alignment', () => {
    expect(position({ placement: 'bottom' }).left).toBe(400 + (100 - 200) / 2)
  })

  it('flips above the anchor near the bottom edge', () => {
    const result = position({ anchor: rect(400, 700) })

    expect(result.side).toBe('top')
    expect(result.top).toBe(700 - 150)
  })

  it('flips below the anchor near the top edge', () => {
    const result = position({ placement: 'top-start', anchor: rect(400, 20) })

    expect(result.side).toBe('bottom')
    expect(result.top).toBe(60)
  })

  it('flips to end alignment near the right edge', () => {
    const result = position({ anchor: rect(880, 300) })

    expect(result.align).toBe('end')
    expect(result.left).toBe(980 - 200)
  })

  it('flips to start alignment near the left edge', () => {
    const result = position({ placement: 'bottom-end', anchor: rect(10, 300, 40) })

    expect(result.align).toBe('start')
    expect(result.left).toBe(10)
  })

  it('flips both axes in the bottom-right corner', () => {
    const result = position({ anchor: rect(880, 700) })

    expect(result).toMatchObject({ side: 'top', align: 'end' })
  })

  it('flips horizontal sides near the right edge', () => {
    const result = position({ placement: 'right-start', anchor: rect(850, 300) })

    expect(result.side).toBe('left')
    expect(result.left).toBe(850 - 200)
  })

  it('keeps the preferred side and shifts inside when no side fits', () => {
    const result = position({ anchor: rect(400, 380), surface: { width: 200, height: 500 } })

    expect(result.side).toBe('bottom')
    expect(result.top).toBe(800 - 500 - MARGIN)
  })

  it('shifts a surface wider than both alignments inside the viewport', () => {
    const result = position({ anchor: rect(10, 300, 20), surface: { width: 990, height: 100 } })

    expect(result.left).toBe(MARGIN)
  })

  it('does not flip when flipping is disabled', () => {
    const result = position({ anchor: rect(400, 700), flip: false })

    expect(result.side).toBe('bottom')
    expect(result.top).toBe(800 - 150 - MARGIN)
  })

  it('does not flip or shift before the surface is measured', () => {
    const result = position({ anchor: rect(880, 700), surface: { width: 0, height: 0 } })

    expect(result).toEqual({ top: 740, left: 880, side: 'bottom', align: 'start' })
  })
})
