/**
 * Public prop surface for the `<MBreadcrumbs>` family.
 *
 * The family normalizes a typed flat list into `nav > ol` semantics. It never
 * inspects the router: hierarchy and current-page state are data the consumer
 * supplies, so SSR and hydration always agree.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NuxtLinkProps } from '#app'

/** Behavior when crumbs exceed the available inline size. */
export type MBreadcrumbsOverflow = 'scroll' | 'wrap'

/** One crumb. No nested children, href/click API or raw HTML field exists. */
export interface MBreadcrumbItem {
  /** Stable key. Falls back to a serialized `to`, then to the index. */
  id?: PropertyKey
  /** Visible label and accessible text of the crumb. */
  title: string
  /** Route destination. A current crumb stays text even when `to` is set. */
  to?: NuxtLinkProps['to']
  /** Renders as noninteractive text with `aria-disabled`. */
  disabled?: boolean
  /** Marks the current page. The first explicit `current` wins. */
  current?: boolean
}

export const mBreadcrumbsProps = {
  /** Ordered crumbs, root first. Input objects are never mutated. */
  items: { type: Array as PropType<MBreadcrumbItem[]>, required: true as const },
  /** Accessible name of the navigation landmark. */
  ariaLabel: { type: String, default: 'Breadcrumbs' },
  /**
   * Separator between crumbs. Icon-like values render through `MIcon`; any
   * other value (for example `/`) renders as text.
   */
  divider: { type: String, default: 'round-chevron-right' },
  /** Constrained-width behavior. Every crumb is always preserved. */
  overflow: { type: String as PropType<MBreadcrumbsOverflow>, default: 'scroll' },
}

export type MBreadcrumbsProps = ExtractPublicPropTypes<typeof mBreadcrumbsProps>

/** Payload of the `item` slot; content only, leaf semantics stay owned. */
export interface MBreadcrumbsItemSlot {
  item: Readonly<MBreadcrumbItem>
  index: number
  current: boolean
  disabled: boolean
}
