import { describe, expect, it } from 'vitest'
import { computePopoverPosition, joinPlacement, observePlacement, parsePlacement, placementToArea } from './placement'
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
    expect(parsePlacement('end-end')).toEqual(['end', 'end'])
  })
})

describe('placementToArea', () => {
  // Logical keywords only, never mixed with physical ones: RTL and other
  // writing modes then mirror the native path by themselves.
  it.each([
    ['bottom', 'start', 'block-end span-inline-end'],
    ['bottom', 'end', 'block-end span-inline-start'],
    ['bottom', 'center', 'block-end'],
    ['top', 'start', 'block-start span-inline-end'],
    ['top', 'center', 'block-start'],
    ['end', 'start', 'inline-end span-block-end'],
    ['start', 'end', 'inline-start span-block-start'],
    ['start', 'center', 'inline-start'],
  ] as const)('maps %s-%s onto %s', (side, align, area) => {
    expect(placementToArea(side, align)).toBe(area)
  })

  // A trigger in a subtree that runs against the root: the root's inline start
  // is the trigger's inline end, the block axis stays.
  it.each([
    ['bottom', 'start', 'block-end span-inline-start'],
    ['bottom', 'center', 'block-end'],
    ['end', 'start', 'inline-start span-block-end'],
    ['start', 'center', 'inline-end'],
  ] as const)('mirrors %s-%s onto %s', (side, align, area) => {
    expect(placementToArea(side, align, true)).toBe(area)
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
    const result = position({ placement: 'end-start', anchor: rect(850, 300) })

    expect(result.side).toBe('start')
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

  describe('right to left', () => {
    it('aligns a start placement to the anchor’s right edge', () => {
      expect(position({ direction: 'rtl' })).toEqual({ top: 340, left: 500 - 200, side: 'bottom', align: 'start' })
    })

    it('aligns an end placement to the anchor’s left edge', () => {
      expect(position({ placement: 'bottom-end', direction: 'rtl' }).left).toBe(400)
    })

    it('puts the start side on the right', () => {
      const result = position({ placement: 'start', direction: 'rtl' })

      expect(result.side).toBe('start')
      expect(result.left).toBe(500)
    })

    it('flips a start alignment to end near the left edge, in logical terms', () => {
      const result = position({ anchor: rect(10, 300, 40), direction: 'rtl' })

      expect(result.align).toBe('end')
      expect(result.left).toBe(10)
    })
  })

  it('does not flip or shift before the surface is measured', () => {
    const result = position({ anchor: rect(880, 700), surface: { width: 0, height: 0 } })

    expect(result).toEqual({ top: 740, left: 880, side: 'bottom', align: 'start' })
  })
})

describe('joinPlacement', () => {
  it.each([
    ['bottom', 'center', 'bottom'],
    ['top', 'end', 'top-end'],
    ['start', 'start', 'start-start'],
  ] as const)('%s + %s → %s', (side, align, placement) => {
    expect(joinPlacement(side, align)).toBe(placement)
  })
})

// The native path flips in CSS without saying where to: the boxes tell.
describe('observePlacement', () => {
  const anchor = rect(400, 300)

  it.each([
    ['below, start edges together', rect(400, 340, 200, 150), 'bottom-start', 'ltr', 'bottom-start'],
    ['flipped above', rect(400, 150, 200, 150), 'bottom-start', 'ltr', 'top-start'],
    ['flipped above and to the end edge', rect(300, 150, 200, 150), 'bottom-start', 'ltr', 'top-end'],
    ['below, left edges together in RTL', rect(400, 340, 200, 150), 'bottom-end', 'rtl', 'bottom-end'],
    ['flipped above, right edges together in RTL', rect(300, 150, 200, 150), 'bottom-start', 'rtl', 'top-start'],
    ['beside, at the inline end', rect(500, 300, 200, 150), 'start-start', 'ltr', 'end-start'],
    ['as wide as the anchor', rect(400, 150, 100, 150), 'bottom-start', 'ltr', 'top-start'],
    ['centred', rect(350, 340, 200, 150), 'bottom', 'ltr', 'bottom'],
  ] as const)('%s → %s', (_, surface, requested, direction, placement) => {
    expect(observePlacement(anchor, surface, requested, direction)).toBe(placement)
  })

  it('keeps the request while the surface is not laid out', () => {
    expect(observePlacement(rect(0, 0, 0, 0), rect(0, 0, 0, 0), 'top-start')).toBe('top-start')
  })

  it('keeps the request while the boxes overlap', () => {
    expect(observePlacement(anchor, rect(410, 310, 50, 20), 'bottom-end')).toBe('bottom-end')
  })
})
