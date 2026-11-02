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

/**
 * Primary side the surface is placed on, relative to the trigger. `start` and
 * `end` are inline sides: they follow the writing direction, as the native
 * `position-area` logical keywords do.
 */
export type PopoverSide = 'top' | 'bottom' | 'start' | 'end'

/** Cross-axis alignment against the trigger, in the logical direction of that axis. */
export type PopoverAlign = 'start' | 'center' | 'end'

/** `'bottom'` (centered) or `'bottom-start'`/`'bottom-end'`, `'end-start'`, etc. */
export type PopoverPlacement = PopoverSide | `${PopoverSide}-${PopoverAlign}`

/** Inline direction the logical placement resolves against. */
export type PopoverDirection = 'ltr' | 'rtl'

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
  /** @default 'ltr' */
  direction?: PopoverDirection
}

export interface PopoverPosition {
  top: number
  left: number
  /** Side actually used after flipping. */
  side: PopoverSide
  /** Alignment actually used after flipping. */
  align: PopoverAlign
}

/** The geometry below works on screen sides; `start` alignment is the left or top edge. */
type PhysicalSide = 'top' | 'bottom' | 'left' | 'right'

const OPPOSITE_SIDE: Record<PhysicalSide, PhysicalSide> = {
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

const AREA_SIDE: Record<PopoverSide, string> = {
  top: 'block-start',
  bottom: 'block-end',
  start: 'inline-start',
  end: 'inline-end',
}

const MIRRORED_SIDE: Record<PopoverSide, PopoverSide> = { top: 'top', bottom: 'bottom', start: 'end', end: 'start' }

/**
 * Map a placement to a CSS `position-area` value, in logical keywords only —
 * mixing them with physical ones is invalid. The keywords resolve against the
 * root's direction (the surface's containing block); `mirrored` says the trigger
 * runs the other way, so its inline start is the root's inline end.
 */
export function placementToArea(side: PopoverSide, align: PopoverAlign, mirrored = false): string {
  const areaSide = mirrored ? MIRRORED_SIDE[side] : side
  if (align === 'center') return AREA_SIDE[areaSide]

  // Aligned to the anchor's start edge, the surface spans towards the end.
  const axis = side === 'top' || side === 'bottom' ? 'inline' : 'block'
  const towards = align === 'start' ? 'end' : 'start'
  const span = mirrored && axis === 'inline' ? OPPOSITE_ALIGN[towards] : towards

  return `${AREA_SIDE[areaSide]} span-${axis}-${span}`
}

function toPhysicalSide(side: PopoverSide, rtl: boolean): PhysicalSide {
  if (side === 'start') return rtl ? 'right' : 'left'
  if (side === 'end') return rtl ? 'left' : 'right'
  return side
}

function toLogicalSide(side: PhysicalSide, rtl: boolean): PopoverSide {
  if (side === 'left') return rtl ? 'end' : 'start'
  if (side === 'right') return rtl ? 'start' : 'end'
  return side
}

/** Only an inline cross axis mirrors in RTL; the block axis never does. */
function mirrorAlign(side: PhysicalSide, align: PopoverAlign, rtl: boolean): PopoverAlign {
  return rtl && isVertical(side) ? OPPOSITE_ALIGN[align] : align
}

const isVertical = (side: PhysicalSide) => side === 'top' || side === 'bottom'

/** Room between the anchor and the viewport edge on `side`, net of offset and margin. */
function spaceOn(side: PhysicalSide, { anchor, viewport, offset, margin }: PopoverPositionInput): number {
  switch (side) {
    case 'top': return anchor.top - offset - margin
    case 'bottom': return viewport.height - anchor.bottom - offset - margin
    case 'left': return anchor.left - offset - margin
    case 'right': return viewport.width - anchor.right - offset - margin
  }
}

/** Main-axis coordinate of the surface's leading edge (`top` or `left`). */
function mainStart(side: PhysicalSide, { anchor, surface, offset }: PopoverPositionInput): number {
  switch (side) {
    case 'top': return anchor.top - surface.height - offset
    case 'bottom': return anchor.bottom + offset
    case 'left': return anchor.left - surface.width - offset
    case 'right': return anchor.right + offset
  }
}

/** Cross-axis coordinate of the surface's leading edge for a given alignment. */
function crossStart(side: PhysicalSide, align: PopoverAlign, { anchor, surface }: PopoverPositionInput): number {
  const [start, end, size] = isVertical(side)
    ? [anchor.left, anchor.right, surface.width]
    : [anchor.top, anchor.bottom, surface.height]

  if (align === 'start') return start
  if (align === 'end') return end - size
  return start + (end - start - size) / 2
}

function fitsCross(side: PhysicalSide, align: PopoverAlign, input: PopoverPositionInput): boolean {
  const [size, limit] = isVertical(side)
    ? [input.surface.width, input.viewport.width]
    : [input.surface.height, input.viewport.height]
  const start = crossStart(side, align, input)

  return start >= input.margin && start + size <= limit - input.margin
}

function resolveSide(side: PhysicalSide, input: PopoverPositionInput): PhysicalSide {
  const extent = isVertical(side) ? input.surface.height : input.surface.width
  const opposite = OPPOSITE_SIDE[side]

  return spaceOn(side, input) < extent && spaceOn(opposite, input) >= extent ? opposite : side
}

function resolveAlign(side: PhysicalSide, align: PopoverAlign, input: PopoverPositionInput): PopoverAlign {
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
  const rtl = input.direction === 'rtl'
  const [logicalSide, logicalAlign] = parsePlacement(input.placement)
  const preferredSide = toPhysicalSide(logicalSide, rtl)
  const preferredAlign = mirrorAlign(preferredSide, logicalAlign, rtl)
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

  return { top, left, side: toLogicalSide(side, rtl), align: mirrorAlign(side, align, rtl) }
}

/** `'bottom'` for a centered surface, `'bottom-start'` otherwise. */
export function joinPlacement(side: PopoverSide, align: PopoverAlign): PopoverPlacement {
  return align === 'center' ? side : `${side}-${align}`
}

/** The side of `anchor` the laid-out `surface` sits on, or `null` while they overlap. */
function sideOf(anchor: PopoverRect, surface: PopoverRect, tolerance: number): PhysicalSide | null {
  if (surface.top >= anchor.bottom - tolerance) return 'bottom'
  if (surface.bottom <= anchor.top + tolerance) return 'top'
  if (surface.left >= anchor.right - tolerance) return 'right'
  if (surface.right <= anchor.left + tolerance) return 'left'
  return null
}

/**
 * The placement a surface actually took, read off the two laid-out boxes: the
 * native path flips in CSS (`position-try-fallbacks`) and never says where to.
 * Where the boxes cannot tell — the surface is not laid out, they overlap, or
 * both edges line up because the surface is as wide as its anchor — the
 * requested side or edge stands.
 */
export function observePlacement(
  anchor: PopoverRect,
  surface: PopoverRect,
  requested: PopoverPlacement,
  direction: PopoverDirection = 'ltr',
  tolerance = 1,
): PopoverPlacement {
  const isLaidOut = surface.width > 0 && (surface.height ?? surface.bottom - surface.top) > 0
  const side = isLaidOut ? sideOf(anchor, surface, tolerance) : null
  if (!side) return requested

  const rtl = direction === 'rtl'

  const [anchorStart, anchorEnd, surfaceStart, surfaceEnd] = isVertical(side)
    ? [anchor.left, anchor.right, surface.left, surface.right]
    : [anchor.top, anchor.bottom, surface.top, surface.bottom]
  const startsTogether = Math.abs(surfaceStart - anchorStart) <= tolerance
  const endsTogether = Math.abs(surfaceEnd - anchorEnd) <= tolerance

  const align = startsTogether === endsTogether
    ? parsePlacement(requested)[1]
    : mirrorAlign(side, startsTogether ? 'start' : 'end', rtl)

  return joinPlacement(toLogicalSide(side, rtl), align)
}
