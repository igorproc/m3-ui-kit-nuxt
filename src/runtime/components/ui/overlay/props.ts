/**
 * Public prop surface for `<MOverlay>` — the controlled primitive that owns the
 * lifecycle of a transient surface (top layer, stack order, scrim, dismissal,
 * scroll lock, focus trap and return, swipe). It does NOT style content:
 * dialog/sheet/drawer/confirm-edit remain their own components and supply
 * geometry, motion and keyboard semantics.
 *
 * `mModalLayerProps` is the shared modal-layer surface: `<MDialog>`, `<MSheet>`,
 * `<MNavigationDrawer>` and `<MDialogDate>` spread it and pass it through.
 */
import type { ExtractPublicPropTypes, PropType, TransitionProps } from 'vue'
import type { M3ModalContext } from '#kit/composables/modal/useModalContext'

export type MOverlayMode = 'modal' | 'popover'
export type MOverlayDismissReason = 'outside' | 'escape' | 'swipe'
export type MOverlaySwipeDirection = 'none' | 'up' | 'right' | 'down' | 'left'
export type MOverlayTransition = string | TransitionProps
/** Anything Vue's `:class` accepts. */
export type MOverlayClass = string | unknown[] | Record<string, unknown>

export const mModalLayerProps = {
  /** `if` unmounts the surface after closing; `show` keeps its DOM and state. */
  displayDirective: { type: String as PropType<'if' | 'show'>, default: 'if' },
  /** Render no scrim. Defaults to `false` in modal mode, `true` in popover mode. */
  hideOverlay: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** `auto` dims only the topmost modal; `persist` keeps every open modal's scrim. */
  overlayBehavior: { type: String as PropType<'auto' | 'persist'>, default: 'auto' },
  /** Scrim transition: a name or `TransitionProps`. */
  overlayTransition: { type: [String, Object] as PropType<MOverlayTransition>, default: 'ui-overlay-fade' },
  /** Content transition: a name or `TransitionProps`. */
  contentTransition: { type: [String, Object] as PropType<MOverlayTransition>, default: undefined },
  overlayClass: { type: [String, Array, Object] as PropType<MOverlayClass>, default: undefined },
  contentClass: { type: [String, Array, Object] as PropType<MOverlayClass>, default: undefined },
  /** Close on a pointer press outside the content (scrim in modal mode). */
  closeOnOutside: { type: Boolean, default: true },
  /** Close on Escape / the platform close request (topmost overlay only). */
  closeOnEscape: { type: Boolean, default: true },
  /** Swipe direction that closes the surface. */
  closeOnSwipe: { type: String as PropType<MOverlaySwipeDirection>, default: 'none' },
  /** Pointer travel (px) past which a swipe closes instead of snapping back. */
  swipeThreshold: { type: Number, default: 80 },
  /** Only the `swipe-banner` slot starts a swipe, not the whole content. */
  showSwipeBanner: { type: Boolean, default: false },
  /** Block user dismissal (outside / escape / swipe) — overrides the `closeOn*` props. */
  persistent: { type: Boolean, default: false },
  /** `interactive` keeps the page usable behind the overlay (no `inert`, no focus trap). */
  background: { type: String as PropType<'interactive' | 'non-interactive'>, default: 'non-interactive' },
  /**
   * Keep Tab inside the overlay: focus moves onto it when it opens and returns
   * when it closes. Defaults to on for a modal with a non-interactive background.
   */
  trapFocus: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** Lock page scroll while open (modal, non-interactive only). */
  lockScroll: { type: Boolean, default: true },
  /** Pad the page by the scrollbar width while locked, so it does not jump. */
  reserveScrollBarGap: { type: Boolean, default: true },
  /** Guard the screen edges against iOS back/forward swipe gestures. */
  preventNavigationGestures: { type: Boolean, default: false },
  /** Explicit parent for cascade closing (programmatic modals); omit to inject it. */
  parent: { type: Object as PropType<M3ModalContext | null>, default: undefined },
}

export const mOverlayProps = {
  /** `modal` isolates the page (scrim + inert + scroll lock + focus trap). `popover` keeps context. */
  mode: { type: String as PropType<MOverlayMode>, default: 'modal' },
  ...mModalLayerProps,
}

export type MModalLayerProps = ExtractPublicPropTypes<typeof mModalLayerProps>

const MODAL_LAYER_KEYS = Object.keys(mModalLayerProps) as Array<keyof typeof mModalLayerProps>

/** The modal-layer subset of a component's props, ready for `v-bind` on `<MOverlay>`. */
export function pickModalLayerProps(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(MODAL_LAYER_KEYS.map(key => [key, props[key]]))
}
export type MOverlayProps = ExtractPublicPropTypes<typeof mOverlayProps>

/** Lifecycle events every modal-layer component re-emits. */
export interface MOverlayEmits {
  (event: 'update:modelValue', value: boolean): void
  (event: 'beforeOpen' | 'beforeClose', payload: { stop: () => void }): void
  (event: 'opened' | 'closed' | 'clickOutside'): void
}
