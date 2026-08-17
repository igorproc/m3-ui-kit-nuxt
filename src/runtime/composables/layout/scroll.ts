/**
 * @module layout/scroll
 *
 * @remarks
 * Ref-counted scroll lock for the layout context zone. Two overlapping
 * consumers (e.g. a drawer over a dialog) produce one physical lock; the
 * scroll is restored only when the last one releases.
 *
 * The lock is mode-agnostic: it freezes every potential scroller of the
 * layout (the document plus `m-layout-main` in `full-height` mode) —
 * freezing an element that does not currently scroll is a no-op visually,
 * so the caller never needs to know which mode the layout is in.
 */
import { IN_BROWSER } from '#kit/shared/constants/globals'

export type ScrollLock = (locked: boolean) => void

export function createScrollLock(getTargets: () => (HTMLElement | null)[]): ScrollLock {
  let count = 0
  const saved = new Map<HTMLElement, string>()

  const apply = () => {
    for (const el of getTargets()) {
      if (!el || saved.has(el)) continue
      saved.set(el, el.style.overflow)
      el.style.overflow = 'hidden'
    }
  }

  const release = () => {
    for (const [el, overflow] of saved) {
      el.style.overflow = overflow
    }
    saved.clear()
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
