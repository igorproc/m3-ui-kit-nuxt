/**
 * Public prop surface for `<MAppBar>`.
 *
 * MD3 Expressive (May 2025) splits the old size/alignment mix into two axes:
 * `type` is the *size* (`small | medium | large`) and `align` is the *headline
 * alignment* (`start | center`).
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { AppBarAlign, AppBarHeadingLevel, AppBarScrollBehavior, AppBarSize, AppBarTag } from '#kit/composables/app-bar/useAppBar'

/** Accepted `type` values: the MD3 size. */
export type MAppBarType = AppBarSize

export const mAppBarProps = {
  /** Ready-made headline text; omit and compose `<MAppBarTitle>` for full control. */
  title: { type: String, default: '' },
  /** Ready-made supporting text under the title. */
  subtitle: { type: String, default: '' },
  /** MD3 size. */
  type: { type: String as PropType<MAppBarType>, default: 'small' },
  /**
   * Root element. Unset, a `<header>` — the page banner at the top level — or a
   * `<div>` inside `m-layout-header`, which is the header already.
   */
  tag: { type: String as PropType<AppBarTag>, default: undefined },
  /**
   * `collapse` folds a medium or large bar into the small height as its
   * scroller moves (scroll-driven where the browser has it, at once elsewhere).
   * A small bar is the folded form already; a zone of a `full-height` layout
   * stays open, since its grid row keeps the expanded height.
   */
  scrollBehavior: { type: String as PropType<AppBarScrollBehavior>, default: 'pinned' },
  /**
   * Headline alignment axis. Presets `start | center`; for anything more exotic
   * style `<MAppBarTitle>` / the actions slot directly — the compound children
   * accept ordinary `class`/`style` flex overrides.
   */
  align: { type: String as PropType<AppBarAlign>, default: 'start' },
  /**
   * Renders the headline as `h1`–`h6`, here and in a composed `<MAppBarTitle>`
   * that names no level of its own; left unset, it stays a paragraph.
   */
  headingLevel: { type: Number as PropType<AppBarHeadingLevel>, default: undefined },
  /**
   * Keeps the bar at the top while the page scrolls: pinned as a zone when it is
   * a direct child of `m-layout`, `position: sticky` anywhere else. Off, it scrolls away.
   */
  sticky: { type: Boolean, default: true },
  /**
   * Scroll-fill control (MD3: fill, not shadow).
   * - `undefined` (default) — auto: follows the layout/window scroll offset.
   * - `true` / `false` — controlled: pins the state and skips the scroll
   *   listener entirely (opt out of any scroll reaction).
   */
  scrolled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
}

export type MAppBarProps = ExtractPublicPropTypes<typeof mAppBarProps>
