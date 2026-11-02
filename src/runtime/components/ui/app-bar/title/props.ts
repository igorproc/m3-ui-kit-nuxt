/**
 * Public prop surface for `<MAppBarTitle>` — the headline leaf of the app-bar
 * compound. Typography and alignment come from the `<MAppBar>` context (size +
 * align axes); this leaf only carries the text and reports subtitle presence up.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { AppBarHeadingLevel } from '#kit/composables/app-bar/useAppBar'

export const mAppBarTitleProps = {
  /** Headline text; override with the default slot for custom content. */
  title: { type: String, default: '' },
  /** Supporting text under the headline; override with the `subtitle` slot. */
  subtitle: { type: String, default: '' },
  /** Renders the headline as `h1`–`h6`; unset, it takes the bar's level, or stays a paragraph. */
  headingLevel: { type: Number as PropType<AppBarHeadingLevel>, default: undefined },
}

export type MAppBarTitleProps = ExtractPublicPropTypes<typeof mAppBarTitleProps>
