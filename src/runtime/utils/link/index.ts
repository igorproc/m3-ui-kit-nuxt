/**
 * @module utils/link
 *
 * @remarks
 * One behaviour for every component whose root can be a link (`MCard`,
 * `MListItem`, `MButton`). An enabled link is Nuxt's link with its `to`. A
 * disabled link stays an `<a>` but loses its destination: with no `href`
 * nothing follows it — not a click, a middle click, the context menu's "open
 * in new tab" or a drag — and it leaves the Tab order by itself. It says what it
 * is with `role="link"` (an `<a>` without `href` has no role) and
 * `aria-disabled="true"`.
 *
 * Internal to the kit: `utils/` is not auto-imported.
 */
import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'

/** Nuxt's link, loaded on first use: a page that renders no link root never pulls it in. */
export const NuxtLink: Component = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))

/** Element that draws a link root: Nuxt's link while it leads somewhere, a bare `<a>` while disabled. */
export function linkTag(disabled: boolean): Component | 'a' {
  return disabled ? 'a' : NuxtLink
}

/**
 * Own attributes of a link root: the destination while enabled, the
 * disabled-link semantics in its place while disabled.
 */
export function linkAttrs(to: unknown, disabled: boolean): Record<string, unknown> {
  return disabled ? { 'role': 'link', 'aria-disabled': 'true' } : { to }
}

/**
 * Drops a destination that arrived with the consumer's attributes (`href`,
 * `to`) from a disabled link's merged attributes, so `linkAttrs` stays true
 * whatever was passed. Returns the same object.
 */
export function withoutDestination<T extends Record<string, unknown>>(attrs: T): T {
  delete attrs.href
  delete attrs.to
  return attrs
}
