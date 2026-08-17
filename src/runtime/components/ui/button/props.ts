/**
 * Public prop surface for `<MButton>` and the thin button-family wrappers.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import { propsFactory } from '#kit/shared/utils/propsFactory'
import { makeColorProps, makeStateProps, makeVariantProps } from '#kit/shared/utils/props'

export type MButtonTag = 'button' | 'link'
export type MButtonType = 'button' | 'submit' | 'reset'

/** Generator for the button family (lets wrappers override defaults). */
export const makeMButtonProps = propsFactory({
  ...makeColorProps(),
  ...makeVariantProps(),
  ...makeStateProps(),
  /** Root behavior: native button or Nuxt link. */
  tag: { type: String as PropType<MButtonTag>, default: 'button' },
  /** Native button type when `tag` is `button`. */
  type: { type: String as PropType<MButtonType>, default: 'button' },
  /** Nuxt route destination when `tag` is `link`. */
  to: { type: [String, Object] as PropType<NuxtLinkProps['to']>, default: undefined },
})

/** Base `<MButton>` props (default `variant: 'filled'`). */
export const mButtonProps = makeMButtonProps()

/**
 * `<MIconButton>` props — icon buttons default to the `text` variant.
 *
 * `ariaLabel` supplies the accessible name an icon-only control needs (the
 * glyph carries no text). It can also be passed through as a native
 * `aria-label` fallthrough attribute.
 */
export const mIconButtonProps = {
  ...makeMButtonProps({ variant: 'text' }),
  /** Accessible name required by the icon-only button. */
  ariaLabel: { type: String as PropType<string>, default: undefined },
}

export type MButtonProps = ExtractPublicPropTypes<typeof mButtonProps>
export type MIconButtonProps = ExtractPublicPropTypes<typeof mIconButtonProps>
