/**
 * @module support
 *
 * @remarks
 * Feature detection for the native platform features the overlay family builds
 * on. The kit uses these natively and falls back to its own code when a check
 * fails — no polyfill packages. Functions, not constants: they are read on the
 * client at call time, so SSR never touches `CSS` and tests can stub
 * `CSS.supports` per case.
 */
import { IN_BROWSER } from '#kit/shared/constants/globals'

function supportsCss(declaration: string): boolean {
  return IN_BROWSER
    && typeof CSS !== 'undefined'
    && typeof CSS.supports === 'function'
    && CSS.supports(declaration)
}

/**
 * CSS anchor positioning *with* try-fallbacks. An engine that anchors but
 * cannot flip would pin the surface off-screen at the viewport edge, so it is
 * treated as unsupported and the JS path (which flips and shifts) takes over.
 */
export function supportsAnchorPositioning(): boolean {
  return supportsCss('anchor-name: --a') && supportsCss('position-try-fallbacks: flip-block')
}

/**
 * Popover API (top layer without `inert`). Checked on the method, not the
 * attribute: some engines reflect `popover` without implementing `showPopover`.
 */
export function supportsPopover(): boolean {
  return IN_BROWSER
    && typeof HTMLElement !== 'undefined'
    && typeof HTMLElement.prototype.showPopover === 'function'
}

/** `scrollbar-gutter`: reserve the scrollbar's width without the scrollbar. */
export function supportsScrollbarGutter(): boolean {
  return supportsCss('scrollbar-gutter: stable')
}
