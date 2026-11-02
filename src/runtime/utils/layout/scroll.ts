/**
 * @module layout/scroll
 *
 * @remarks
 * Ref-counted scroll lock for the layout context zone. Two overlapping
 * consumers (e.g. a drawer over a dialog) produce one physical lock; the
 * scroll is restored only when the last one releases.
 *
 * The caller passes the elements to freeze; the layout zone hands over its
 * active scrollers (the document, plus `m-layout-main` in `full-height` mode).
 */
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { holdOverflow, releaseOverflow } from '#kit/utils/scroll/overflowLock'

export type ScrollLock = (locked: boolean) => void

export function createScrollLock(getTargets: () => (HTMLElement | null)[]): ScrollLock {
  let count = 0
  // What this lock froze, so it releases those even if the targets changed since.
  const held = new Set<HTMLElement>()

  const apply = () => {
    for (const el of getTargets()) {
      if (!el || held.has(el)) continue
      held.add(el)
      holdOverflow(el)
    }
  }

  const release = () => {
    for (const el of held) releaseOverflow(el)
    held.clear()
  }

  return (locked) => {
    if (!IN_BROWSER) return

    if (locked) {
      count++
      if (count === 1) apply()
      return
    }

    if (count === 0) {
      if (import.meta.dev) {
        console.warn('[m-layout] scrollLock(false) without a matching scrollLock(true)')
      }
      return
    }

    count--
    if (count === 0) release()
  }
}
