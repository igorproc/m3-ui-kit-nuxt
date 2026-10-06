/**
 * @module overlay/useOverlayTarget
 *
 * @remarks
 * Where a floating surface (menu, tooltip, snackbar, nested overlay) teleports.
 *
 * Inside an open modal `<dialog>` it must render *inside that dialog*:
 * `showModal()` makes everything outside the dialog's subtree inert — top-layer
 * popovers included — so a menu or tooltip teleported to the page-level host
 * would paint above the dialog yet ignore every pointer and focus. Each
 * `<MOverlay>` therefore provides its root as the target for its descendants;
 * outside any overlay the shared `#ui-overlay-host` (or `fallback`) is used.
 */
import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { createContext } from '#kit/shared/utils/context/createContext'
import { IN_BROWSER } from '#kit/shared/constants/globals'

const OVERLAY_HOST = '#ui-overlay-host'

const [injectOverlayTarget, provideOverlayTarget] = createContext<Readonly<Ref<HTMLElement | null>> | null>('m3:overlay-target', null)

export { provideOverlayTarget }

/**
 * Teleport target for a floating surface: the nearest rendered overlay root,
 * else `#ui-overlay-host`, else `fallback` (also used during SSR).
 */
export function useOverlayTeleportTarget(fallback = 'body'): ComputedRef<string | HTMLElement> {
  const parent = injectOverlayTarget()

  return computed(() => {
    if (parent?.value) return parent.value
    if (IN_BROWSER && document.querySelector(OVERLAY_HOST)) return OVERLAY_HOST
    return fallback
  })
}
