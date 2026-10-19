import type { Locator, Page } from '@playwright/test'
import { traceMotion } from '../../e2e/probe'
import type { MotionTrace, ProbeRect } from '../../e2e/probe'

/**
 * Shape helpers for the button family's e2e. A corner is checked as it is
 * drawn, not as `getComputedStyle` reports it: CSS scales every radius of a
 * box down together once two of them overflow a side (Backgrounds 3 §5.5), so
 * a specified 999rem draws as half the height and drags a small neighbour
 * corner down with it.
 */

const CORNERS = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'] as const

type Corner = 'tl' | 'tr' | 'br' | 'bl'

function drawn(rect: ProbeRect, styles: Record<string, string>) {
  const [tl, tr, br, bl] = CORNERS.map(name => Number.parseFloat(styles[name] ?? '') || 0) as [number, number, number, number]
  const factor = Math.min(1, rect.width / (tl + tr || Infinity), rect.width / (bl + br || Infinity), rect.height / (tl + bl || Infinity), rect.height / (tr + br || Infinity))
  return { tl: tl * factor, tr: tr * factor, br: br * factor, bl: bl * factor }
}

/** Drawn radii of `locator`'s box, in rem. */
export async function drawnRadii(locator: Locator) {
  const { rect, styles, remPx } = await locator.evaluate((element, corners) => {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      rect: { x: box.x, y: box.y, width: box.width, height: box.height },
      styles: Object.fromEntries(corners.map(name => [name, style.getPropertyValue(name)])),
      remPx: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    }
  }, [...CORNERS])
  const radii = drawn(rect, styles)
  return Object.fromEntries(Object.entries(radii).map(([key, value]) => [key, value / remPx])) as Record<Corner, number>
}

export interface CornerMotion {
  fromRem: number
  toRem: number
  /** Milliseconds from the first frame the background changed to the first drawn corner change. */
  lagMs: number | null
  /** Largest single-frame step as a share of the whole move. */
  largestStepShare: number
}

/**
 * Records the drawn corner of `selector` while `act` runs: how long after the
 * colour starts the corner starts, and whether it arrives in one frame.
 */
export async function traceCorner(page: Page, selector: string, act: () => Promise<unknown>, corner: Corner = 'tl', duration = 600): Promise<CornerMotion> {
  const trace: MotionTrace = await traceMotion(page, {
    targets: { box: selector },
    styles: [...CORNERS, 'background-color'],
    duration,
    act,
  })
  const frames = trace.frames.filter(frame => frame.rects.box && frame.styles.box)
  const series = frames.map(frame => ({
    t: frame.t,
    radius: drawn(frame.rects.box!, frame.styles.box!)[corner] / trace.remPx,
    colour: frame.styles.box!['background-color'],
  }))
  const rest = series.filter(point => point.t < 0).at(-1) ?? series[0]!
  const after = series.filter(point => point.t >= 0)
  const total = (after.at(-1)?.radius ?? rest.radius) - rest.radius
  const colourAt = after.find(point => point.colour !== rest.colour)?.t
  const cornerAt = after.find(point => Math.abs(point.radius - rest.radius) > 0.05)?.t

  let largest = 0
  const all = [rest, ...after]
  for (let index = 1; index < all.length; index++) {
    largest = Math.max(largest, Math.abs(all[index]!.radius - all[index - 1]!.radius))
  }

  return {
    fromRem: rest.radius,
    toRem: after.at(-1)?.radius ?? rest.radius,
    lagMs: colourAt === undefined || cornerAt === undefined ? null : cornerAt - colourAt,
    largestStepShare: total ? largest / Math.abs(total) : 0,
  }
}
