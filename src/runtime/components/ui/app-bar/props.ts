/**
 * Public prop surface for `<MAppBar>`.
 *
 * MD3 Expressive (May 2025) splits the old size/alignment mix into two axes:
 * `type` is the *size* (`small | medium | large`) and `align` is the *headline
 * alignment* (`start | center`). The pre-Expressive `center-aligned` value is
 * kept as a `@deprecated` alias that normalizes to `type: 'small'` +
 * `align: 'center'` inside the container — nothing in consumer code breaks.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { AppBarAlign, AppBarSize } from '#kit/composables/app-bar/useAppBar'

/**
 * Accepted `type` values. `'center-aligned'` is a legacy alias — prefer
 * `type="small"` with `align="center"`.
 */
export type MAppBarType = AppBarSize | 'center-aligned'

export const mAppBarProps = {
  /** Ready-made headline text; omit and compose `<MAppBarTitle>` for full control. */
  title: { type: String, default: '' },
  /** Ready-made supporting text under the title. */
  subtitle: { type: String, default: '' },
  /** MD3 size. `'center-aligned'` is a deprecated alias for `small` + `align: center`. */
  type: { type: String as PropType<MAppBarType>, default: 'small' },
  /**
   * Headline alignment axis. Presets `start | center`; for anything more exotic
   * style `<MAppBarTitle>` / the actions slot directly — the compound children
   * accept ordinary `class`/`style` flex overrides.
   */
  align: { type: String as PropType<AppBarAlign>, default: 'start' },
  /** Pin to the top when the bar is a direct child of `m-layout`. */
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
