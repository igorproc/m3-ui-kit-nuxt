/**
 * @module overlay/useScrollLock
 *
 * @remarks
 * Reference-counted page scroll lock for the overlay runtime. Nested overlays
 * each acquire the lock; the page only unlocks once the last holder releases, so
 * closing a child modal does not re-enable scrolling while a parent is still
 * open. SSR-safe (no-op on the server); each holder auto-releases on scope
 * dispose.
 *
 * No layout shift: the lock hides the viewport scrollbar with `overflow: hidden`
 * on `<html>` and keeps its width reserved with `scrollbar-gutter: stable`, so
 * neither the content nor `position: fixed` bars move. The kit's base styles
 * already reserve the gutter on `<html>`; setting it here keeps the lock
 * shift-free for apps that override that. Only without
 * `scrollbar-gutter` does it fall back to padding `<body>` by the scrollbar width
 * (which cannot hold fixed elements still). Nothing is reserved when there is no
 * scrollbar to replace — overlay scrollbars, or a page that does not scroll —
 * since a stable gutter would then *add* width.
 */
import { onScopeDispose } from 'vue'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { supportsScrollbarGutter } from '#kit/shared/utils/support'

let lockCount = 0
let previous = { overflow: '', scrollbarGutter: '', bodyPaddingRight: '' }

function applyLock(reserveScrollBarGap: boolean) {
  const root = document.documentElement
  const body = document.body
  const scrollbarWidth = window.innerWidth - root.clientWidth

  previous = {
    overflow: root.style.overflow,
    scrollbarGutter: root.style.scrollbarGutter,
    bodyPaddingRight: body.style.paddingRight,
  }

  if (reserveScrollBarGap && scrollbarWidth > 0) {
    if (supportsScrollbarGutter()) root.style.scrollbarGutter = 'stable'
    else body.style.paddingRight = `${scrollbarWidth}px`
  }
  root.style.overflow = 'hidden'
}

function releaseLock() {
  const root = document.documentElement
  root.style.overflow = previous.overflow
  root.style.scrollbarGutter = previous.scrollbarGutter
  document.body.style.paddingRight = previous.bodyPaddingRight
}

export interface UseScrollLockReturn {
  /** `reserveScrollBarGap` only matters for the first holder — it is the one that hides the scrollbar. */
  lock: (reserveScrollBarGap?: boolean) => void
  unlock: () => void
}

/**
 * Returns a single holder of the shared, reference-counted scroll lock.
 */
export function useScrollLock(): UseScrollLockReturn {
  if (!IN_BROWSER) return { lock: () => {}, unlock: () => {} }

  let held = false

  function lock(reserveScrollBarGap = true) {
    if (held) return
    held = true
    if (++lockCount === 1) applyLock(reserveScrollBarGap)
  }

  function unlock() {
    if (!held) return
    held = false
    if (--lockCount === 0) releaseLock()
  }

  onScopeDispose(unlock)

  return { lock, unlock }
}

/** Test-only: force the shared counter back to zero. */
export function __resetScrollLock(): void {
  lockCount = 0
  if (IN_BROWSER) releaseLock()
}
