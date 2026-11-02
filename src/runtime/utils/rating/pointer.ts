/**
 * @module rating/pointer
 *
 * @remarks
 * Turns a pointer position into a rating value by the item under it, so the
 * item the pointer is on is the one that fills. The share of that item is
 * measured over its glyph — the box the fill clips — and rounded up to the step.
 */
import { clamp } from '#kit/shared/utils/helpers'

/** Screen boxes of one item: its cell, and the glyph inside it the fill clips. */
export interface RatingItemBox {
  cell: Pick<DOMRect, 'left' | 'right'>
  glyph: Pick<DOMRect, 'left' | 'right' | 'width'>
}

export interface RatingPointerOptions {
  rtl: boolean
  step: number
  length: number
}

// Pointing at an item at all gives at least one step into it: its padding
// before the glyph still names that item, never the one before.
const MIN_SHARE = 1e-6
// Float slack, so `2.5 / 0.5` never ceils to the next step.
const GRID_SLACK = 1e-9

/** Value for a pointer at `x`; `boxes` are the items in value order. */
export function ratingValueAt(boxes: readonly RatingItemBox[], x: number, options: RatingPointerOptions): number {
  const index = itemIndexAt(boxes, x, options.rtl)
  const glyph = boxes[index]?.glyph
  if (!glyph) return 0

  const offset = options.rtl ? glyph.right - x : x - glyph.left
  const share = glyph.width > 0 ? clamp(offset / glyph.width, MIN_SHARE, 1) : 1
  const value = Math.ceil((index + share) / options.step - GRID_SLACK) * options.step

  return Math.min(options.length, value)
}

/** The last item whose inline-start edge the pointer has passed; a gap belongs to the item before it. */
function itemIndexAt(boxes: readonly RatingItemBox[], x: number, rtl: boolean): number {
  let index = 0

  boxes.forEach(({ cell }, position) => {
    if (rtl ? x <= cell.right : x >= cell.left) index = position
  })

  return index
}
