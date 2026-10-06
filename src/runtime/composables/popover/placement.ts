/**
 * @module placement
 *
 * @remarks
 * Pure geometry behind {@link usePopover}'s JS path — the one taken when the
 * browser cannot anchor natively. It reproduces what the native path gets from
 * `position-try-fallbacks: flip-block, flip-inline`, then shifts the surface so
 * it never leaves the viewport.
 *
 * Order matters: flip first (a flipped surface stays attached to its anchor),
 * shift last (only when no side fits, the surface slides along the edge).
 */
import { clamp } from '#kit/shared/utils/helpers'

/** Primary side the surface is placed on, relative to the trigger. */
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right'

/** Cross-axis alignment against the trigger. */
export type PopoverAlign = 'start' | 'center' | 'end'

/** `'bottom'` (centered) or `'bottom-start'`/`'bottom-end'`, etc. */
export type PopoverPlacement = PopoverSide | `${PopoverSide}-${PopoverAlign}`

/** Viewport-relative geometry of the trigger. `height` is derived when omitted. */
export interface PopoverRect {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height?: number
}

export interface PopoverSize {
  width: number
  height: number
}

export interface PopoverPositionInput {
  anchor: PopoverRect
  surface: PopoverSize
  viewport: PopoverSize
  placement: PopoverPlacement
  /** Gap between trigger and surface along the main axis. */
  offset: number
  /** Minimum gap kept from the viewport edges. */
  margin: number
  flip: boolean
}

export interface PopoverPosition {
  top: number
  left: number
  /** Side actually used after flipping. */
  side: PopoverSide
  /** Alignment actually used after flipping. */
  align: PopoverAlign
}

const OPPOSITE_SIDE: Record<PopoverSide, PopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const OPPOSITE_ALIGN: Record<PopoverAlign, PopoverAlign> = {
  start: 'end',
  center: 'center',
  end: 'start',
}

/** Split a placement string into side + align (defaulting align to center). */
export function parsePlacement(placement: PopoverPlacement): [PopoverSide, PopoverAlign] {
  const [side, align = 'center'] = placement.split('-') as [PopoverSide, PopoverAlign?]
  return [side, align]
}

/** Map a placement to a CSS `position-area` value. */
export function placementToArea(side: PopoverSide, align: PopoverAlign): string {
  if (align === 'center') return side

  // For a vertical side the surface spans horizontally and vice-versa.
  const spanByAlign: Record<PopoverSide, Record<'start' | 'end', string>> = {
    top: { start: 'span-right', end: 'span-left' },
    bottom: { start: 'span-right', end: 'span-left' },
    left: { start: 'span-bottom', end: 'span-top' },
    right: { start: 'span-bottom', end: 'span-top' },
  }

  return `${side} ${spanByAlign[side][align]}`
}

const isVertical = (side: PopoverSide) => side === 'top' || side === 'bottom'

/** Room between the anchor and the viewport edge on `side`, net of offset and margin. */
function spaceOn(side: PopoverSide, { anchor, viewport, offset, margin }: PopoverPositionInput): number {
  switch (side) {
    case 'top': return anchor.top - offset - margin
    case 'bottom': return viewport.height - anchor.bottom - offset - margin
    case 'left': return anchor.left - offset - margin
    case 'right': return viewport.width - anchor.right - offset - margin
  }
}

/** Main-axis coordinate of the surface's leading edge (`top` or `left`). */
function mainStart(side: PopoverSide, { anchor, surface, offset }: PopoverPositionInput): number {
  switch (side) {
    case 'top': return anchor.top - surface.height - offset
    case 'bottom': return anchor.bottom + offset
    case 'left': return anchor.left - surface.width - offset
    case 'right': return anchor.right + offset
  }
}

/** Cross-axis coordinate of the surface's leading edge for a given alignment. */
function crossStart(side: PopoverSide, align: PopoverAlign, { anchor, surface }: PopoverPositionInput): number {
  const [start, end, size] = isVertical(side)
    ? [anchor.left, anchor.right, surface.width]
    : [anchor.top, anchor.bottom, surface.height]

  if (align === 'start') return start
  if (align === 'end') return end - size
  return start + (end - start - size) / 2
}

function fitsCross(side: PopoverSide, align: PopoverAlign, input: PopoverPositionInput): boolean {
  const [size, limit] = isVertical(side)
    ? [input.surface.width, input.viewport.width]
    : [input.surface.height, input.viewport.height]
  const start = crossStart(side, align, input)

  return start >= input.margin && start + size <= limit - input.margin
}

function resolveSide(side: PopoverSide, input: PopoverPositionInput): PopoverSide {
  const extent = isVertical(side) ? input.surface.height : input.surface.width
  const opposite = OPPOSITE_SIDE[side]

  return spaceOn(side, input) < extent && spaceOn(opposite, input) >= extent ? opposite : side
}

function resolveAlign(side: PopoverSide, align: PopoverAlign, input: PopoverPositionInput): PopoverAlign {
  const opposite = OPPOSITE_ALIGN[align]

  return !fitsCross(side, align, input) && fitsCross(side, opposite, input) ? opposite : align
}

/**
 * Fixed-position coordinates for a surface next to its anchor.
 *
 * @remarks
 * Flipping needs the surface size, so it is skipped until the surface has been
 * measured (zero size). Each axis flips only when the opposite side actually
 * fits; otherwise the preferred side is kept and the shift clamps it in.
 */
export function computePopoverPosition(input: PopoverPositionInput): PopoverPosition {
  const [preferredSide, preferredAlign] = parsePlacement(input.placement)
  const { surface, viewport, margin } = input
  const isMeasured = surface.width > 0 && surface.height > 0

  let side = preferredSide
  let align = preferredAlign

  if (input.flip && isMeasured) {
    side = resolveSide(preferredSide, input)
    align = resolveAlign(side, preferredAlign, input)
  }

  const main = mainStart(side, input)
  const cross = crossStart(side, align, input)
  let top = isVertical(side) ? main : cross
  let left = isVertical(side) ? cross : main

  if (surface.width > 0 && viewport.width > 0) {
    left = clamp(left, margin, Math.max(margin, viewport.width - surface.width - margin))
  }
  if (surface.height > 0 && viewport.height > 0) {
    top = clamp(top, margin, Math.max(margin, viewport.height - surface.height - margin))
  }

  return { top, left, side, align }
}
