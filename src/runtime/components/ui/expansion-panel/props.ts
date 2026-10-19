/**
 * Public prop surface for `<MExpansionPanel>`.
 *
 * Attributes that are not props (`id`, `aria-*`, `data-*`, listeners) land on
 * the header button; `class` and `style` stay on the panel root.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MHeadingLevel } from '#kit/shared/types/props'

/** Identity of a panel inside `<MExpansionPanels>`, and the type of the group's `v-model`. */
export type PanelValue = string | number

export const mExpansionPanelProps = {
  /** Prevents interaction and applies the disabled visual state. */
  disabled: { type: Boolean, default: false },
  /** Identity inside `<MExpansionPanels>`; generated when absent. */
  value: { type: [String, Number] as PropType<PanelValue>, default: undefined },
  /** Header text and the panel's accessible name; the `#header` slot replaces it. */
  title: { type: String, default: '' },
  /** Second header line under the title; the `#header` slot replaces it. */
  description: { type: String, default: '' },
  /**
   * Wraps the header button in `h{n}`, as the APG Accordion pattern asks. No
   * default: a fixed level would break the outline of a page the kit cannot see.
   */
  headingLevel: { type: Number as PropType<MHeadingLevel>, default: undefined },
}

export type MExpansionPanelProps = ExtractPublicPropTypes<typeof mExpansionPanelProps>

/** Slots of `<MExpansionPanel>`. */
export interface MExpansionPanelSlots {
  /** Replaces the title and description inside the header button. */
  header?: () => unknown
  /** Replaces the chevron; `expanded` follows the open state. */
  trailing?: (props: { expanded: boolean }) => unknown
  /** The panel's content. */
  default?: () => unknown
}
