/**
 * Public prop surface for `<MCard>`.
 *
 * Resolved here so the SFC receives a plain imported props object.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'
import type { MHeadingLevel, MVariant } from '#kit/shared/types/props'

/** M3 card styles; `tonal` and `text` never had card styles. */
export type MCardVariant = Extract<MVariant, 'elevated' | 'filled' | 'outlined'>
/** Root behavior: a static `<article>` or a Nuxt link that is the whole card. */
export type MCardTag = 'article' | 'link'
/** Level of the title heading; the page outline decides it, not the kit. */
/** `<MCard>` props — a static MD3 `elevated` card by default. */
export const mCardProps = {
  /** Surface treatment of the card container. */
  variant: { type: String as PropType<MCardVariant>, default: 'elevated' },
  /** `link` turns the whole card into one Nuxt link with M3 interaction states. */
  tag: { type: String as PropType<MCardTag>, default: 'article' },
  /** Nuxt route destination when `tag` is `link`. */
  to: { type: [String, Object] as PropType<NuxtLinkProps['to']>, default: undefined },
  /** Disables a link card: no destination, out of the Tab order. */
  disabled: { type: Boolean, default: false },
  /** Plain-text headline; the header slot takes precedence. */
  title: { type: String, default: '' },
  /** Plain-text subhead, rendered with or without a title. */
  subtitle: { type: String, default: '' },
  /** Renders the title as `h2`–`h6`; left unset, it stays a paragraph. */
  headingLevel: { type: Number as PropType<MHeadingLevel>, default: undefined },
  /** Reserves the media box at this CSS `aspect-ratio` (e.g. `'16 / 9'`) and covers it. */
  mediaAspectRatio: { type: String, default: undefined },
}

export type MCardProps = ExtractPublicPropTypes<typeof mCardProps>
