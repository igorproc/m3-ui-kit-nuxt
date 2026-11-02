/**
 * @module scroll/overflowLock
 *
 * @remarks
 * One reference count per element for `overflow: hidden`. The overlay lock and
 * the layout zone's lock both freeze `<html>`; with a snapshot each, releasing
 * them in crossed order restored the other's `hidden` and left the page frozen.
 * Browser-only: both callers stop on the server before reaching it.
 */

const holds = new WeakMap<HTMLElement, { count: number, overflow: string }>()

/** Hides the element's overflow; the first holder keeps its inline value for the last release. */
export function holdOverflow(el: HTMLElement): void {
  const hold = holds.get(el)

  if (hold) {
    hold.count++
    return
  }

  holds.set(el, { count: 1, overflow: el.style.overflow })
  el.style.overflow = 'hidden'
}

/** Drops one hold; the last one brings back the inline overflow the first holder found. */
export function releaseOverflow(el: HTMLElement): void {
  const hold = holds.get(el)
  if (!hold || --hold.count > 0) return

  holds.delete(el)
  el.style.overflow = hold.overflow
}

/** Test-only: drops every hold on the element at once. */
export function clearOverflowHold(el: HTMLElement): void {
  const hold = holds.get(el)
  if (!hold) return

  holds.delete(el)
  el.style.overflow = hold.overflow
}
