/**
 * Public prop surface for `<MButton>` and the thin button-family wrappers.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import { propsFactory } from '#kit/shared/utils/props/propsFactory'
import { makeColorProps, makeStateProps, makeVariantProps } from '#kit/shared/utils/props'
import type { MFieldDensity } from '#kit/components/ui/text-field/props'
import type { MColor, MVariant } from '#kit/shared/types/props'

export type MButtonTag = 'button' | 'link'
export type MButtonType = 'button' | 'submit' | 'reset'
/** Button scale: the kit's density steps at M3 XS / S / M (32 / 40 / 56). */
export type MButtonDensity = MFieldDensity
/**
 * M3's round / square container pair. A documented exception to the kit's
 * `shape` vocabulary (an `MShape` step elsewhere): the radius of `square`
 * follows the density step, so the consumer never picks a mismatched corner.
 */
export type MButtonShape = 'round' | 'square'

/** Generator for the button family (lets wrappers override defaults). */
export const makeMButtonProps = propsFactory({
  ...makeColorProps(),
  ...makeVariantProps(),
  ...makeStateProps(),
  /** Height, padding, icon and type step. */
  density: { type: String as PropType<MButtonDensity>, default: 'default' },
  /** Resting container shape; a selected toggle is always square. */
  shape: { type: String as PropType<MButtonShape>, default: 'round' },
  /**
   * Toggle state, exposed as `aria-pressed` (`v-model:selected`). Left
   * `undefined`, the button is a plain action with no pressed state.
   */
  selected: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** Root behavior: native button or Nuxt link. */
  tag: { type: String as PropType<MButtonTag>, default: 'button' },
  /** Native button type when `tag` is `button`. */
  type: { type: String as PropType<MButtonType>, default: 'button' },
  /** Nuxt route destination when `tag` is `link`. */
  to: { type: [String, Object] as PropType<NuxtLinkProps['to']>, default: undefined },
})

/** Base `<MButton>` props (default `variant: 'filled'`). */
export const mButtonProps = makeMButtonProps()

/** M3 icon buttons: standard (`text`), filled, tonal, outlined — no elevated. */
export type MIconButtonVariant = Extract<MVariant, 'filled' | 'tonal' | 'outlined' | 'text'>
/** M3 icon button widths; the height follows `density`. */
export type MIconButtonWidth = 'narrow' | 'default' | 'wide'

/**
 * `<MIconButton>` props — icon buttons default to the `text` variant.
 *
 * `ariaLabel` supplies the accessible name an icon-only control needs (the
 * glyph carries no text). It can also be passed through as a native
 * `aria-label` fallthrough attribute.
 */
export const mIconButtonProps = {
  ...makeMButtonProps({ variant: 'text' }),
  /** Low-emphasis M3 icon button style. */
  variant: { type: String as PropType<MIconButtonVariant>, default: 'text' },
  /**
   * Colour role. Left unset, a standard or outlined icon button takes the
   * content colour of its container (an app bar, a toolbar, an alert).
   */
  color: { type: String as PropType<MColor>, default: undefined },
  /** Container width at the density's height. */
  width: { type: String as PropType<MIconButtonWidth>, default: 'default' },
  /** Accessible name required by the icon-only button. */
  ariaLabel: { type: String as PropType<string>, default: undefined },
}

export type MButtonProps = ExtractPublicPropTypes<typeof mButtonProps>
export type MIconButtonProps = ExtractPublicPropTypes<typeof mIconButtonProps>
