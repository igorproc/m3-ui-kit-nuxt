/**
 * @module overlay/useScrollLock
 *
 * @remarks
 * Reference-counted body scroll lock for the overlay runtime. Nested overlays
 * each acquire the lock; the page only unlocks once the last holder releases, so
 * closing a child modal does not re-enable scrolling while a parent is still
 * open. Scrollbar width is compensated with `padding-right` to avoid layout
 * shift. SSR-safe (no-op on the server); each holder auto-releases on scope
 * dispose.
 */
import { onScopeDispose } from 'vue'
import { IN_BROWSER } from '~~/shared/constants/globals'

let lockCount = 0
let previousOverflow = ''
let previousPaddingRight = ''

function applyLock() {
  const body = document.body
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  previousOverflow = body.style.overflow
  previousPaddingRight = body.style.paddingRight
  body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
}

function releaseLock() {
  const body = document.body
  body.style.overflow = previousOverflow
  body.style.paddingRight = previousPaddingRight
}

export interface UseScrollLockReturn {
  lock: () => void
  unlock: () => void
}

/**
 * Returns a single holder of the shared, reference-counted scroll lock.
 */
export function useScrollLock(): UseScrollLockReturn {
  if (!IN_BROWSER) return { lock: () => {}, unlock: () => {} }

  let held = false

  function lock() {
    if (held) return
    held = true
    if (++lockCount === 1) applyLock()
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
