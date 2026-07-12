/**
 * Public prop surface for `<MOverlay>` — the controlled primitive that owns the
 * lifecycle of a transient surface (stack order, scrim, dismissal, scroll lock,
 * focus return, teleport). It does NOT style content: dialog/sheet/menu remain
 * their own components and supply geometry, motion and keyboard semantics.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MOverlayMode = 'modal' | 'popover'
export type MOverlayDismissReason = 'outside' | 'escape'

export const mOverlayProps = {
  /** `modal` isolates the background (scrim + scroll lock + focus). `popover` keeps context. */
  mode: { type: String as PropType<MOverlayMode>, default: 'modal' },
  /** Block user dismissal (outside/escape); programmatic `v-model` still closes. */
  persistent: { type: Boolean, default: false },
  /** Render a scrim. Defaults to `true` in modal mode, `false` in popover mode. */
  scrim: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** Close on an outside pointer press. */
  closeOnOutside: { type: Boolean, default: true },
  /** Close on Escape (only the topmost eligible overlay). */
  closeOnEscape: { type: Boolean, default: true },
  /** Teleport target for the overlay root. */
  teleportTo: { type: [String, Object] as PropType<string | HTMLElement>, default: '#ui-overlay-host' },
  /** Content transition name; `false` disables it. Consumers usually supply motion. */
  transition: { type: [String, Boolean] as PropType<string | false>, default: undefined },
}

export type MOverlayProps = ExtractPublicPropTypes<typeof mOverlayProps>
