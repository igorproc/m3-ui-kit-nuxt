/**
 * Public prop surface for `<MAppBarTitle>` — the headline leaf of the app-bar
 * compound. Typography and alignment come from the `<MAppBar>` context (size +
 * align axes); this leaf only carries the text and reports subtitle presence up.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mAppBarTitleProps = {
  /** Headline text; override with the default slot for custom content. */
  title: { type: String, default: '' },
  /** Supporting text under the headline; override with the `subtitle` slot. */
  subtitle: { type: String, default: '' },
}

export type MAppBarTitleProps = ExtractPublicPropTypes<typeof mAppBarTitleProps>
