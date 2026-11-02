/** Where a pointer is, in viewport coordinates. */
export interface TrackPoint {
  clientX: number
  clientY: number
}

/** How a track runs on screen. */
export interface TrackAxis {
  vertical: boolean
  /** A horizontal track runs from right to left. */
  rtl: boolean
}

/**
 * The share (0–100) of a track a point stands at, measured from the edge the
 * value starts at: the bottom of a vertical track, the inline start of a
 * horizontal one — the right edge in RTL.
 *
 * `offset` is how far the point sits from the thumb's centre along the track's
 * screen axis when a drag started on the thumb, so the thumb does not jump to
 * the pointer on the first move.
 */
export function percentAlong(rect: DOMRect, point: TrackPoint, axis: TrackAxis, offset = 0): number {
  const raw = axis.vertical
    ? (rect.bottom - (point.clientY - offset)) / rect.height
    : axis.rtl
      ? (rect.right - (point.clientX - offset)) / rect.width
      : (point.clientX - offset - rect.left) / rect.width

  return Math.max(0, Math.min(100, raw * 100))
}

/** Whether an element lays out right to left; read at event time, never while rendering. */
export function isRtl(element: Element | null): boolean {
  return element ? getComputedStyle(element).direction === 'rtl' : false
}
