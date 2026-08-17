/**
 * Public prop surface for `<MExpansionPanels>` (the accordion group).
 *
 * Group-behaviour only — no shared color/variant/state props apply here.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mExpansionPanelsProps = {
  /** Allow multiple panels open at once. @default false (exclusive accordion). */
  multiple: { type: Boolean, default: false },
  /** Keep at least one panel open (exclusive mode only). @default false */
  mandatory: { type: Boolean, default: false },
}

export type MExpansionPanelsProps = ExtractPublicPropTypes<typeof mExpansionPanelsProps>
