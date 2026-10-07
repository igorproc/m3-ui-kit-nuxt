/**
 * @module useCard
 *
 * @remarks
 * Headless core of `MCard`. Picks the root — a static `<article>` or a Nuxt
 * link that is the whole card — and owns the wiring between the parts: the
 * root named by its title, the title's heading level, a disabled link with no
 * destination. Returns attribute bags only; classes stay with the component.
 */
import { computed, defineAsyncComponent, useId } from 'vue'
import type { Component, ComputedRef } from 'vue'
import type { MCardTag } from '#kit/components/ui/card/props'
import type { MHeadingLevel } from '#kit/shared/types/props'

const NuxtLink = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))

export interface UseCardProps {
  tag: MCardTag
  to?: unknown
  disabled: boolean
  title: string
  headingLevel?: MHeadingLevel
}

export interface UseCardReturn {
  isLink: ComputedRef<boolean>
  /** Only a link card can be disabled; a static card has no state to lose. */
  isDisabled: ComputedRef<boolean>
  rootTag: ComputedRef<Component | string>
  rootAttrs: ComputedRef<Record<string, unknown>>
  titleTag: ComputedRef<string>
  titleAttrs: ComputedRef<Record<string, unknown>>
}

export interface UseCardOptions {
  /**
   * Whether the title element renders; defaults to "a title was given". A
   * header slot that replaces the title must say so, or the root would point
   * `aria-labelledby` at an element that is not there.
   */
  hasTitle?: () => boolean
}

export function useCard(props: UseCardProps, options: UseCardOptions = {}): UseCardReturn {
  const titleId = useId()
  const hasTitle = options.hasTitle ?? (() => Boolean(props.title))

  const isLink = computed(() => props.tag === 'link')
  const isDisabled = computed(() => isLink.value && props.disabled)

  // A disabled link card keeps its anchor but loses the destination: without
  // `href` it leaves the Tab order on its own (no tabindex needed), and
  // `role="link"` keeps `aria-disabled` meaningful to a screen reader.
  const rootTag = computed<Component | string>(() => {
    if (!isLink.value) return 'article'

    return isDisabled.value ? 'a' : NuxtLink
  })

  // The title names the card, article or link alike: a link card's content
  // would otherwise read out whole as its name. Without a title the link
  // falls back to that content.
  const rootAttrs = computed<Record<string, unknown>>(() => {
    const named = { 'aria-labelledby': hasTitle() ? titleId : undefined }

    if (!isLink.value) return named
    if (isDisabled.value) return { ...named, 'role': 'link', 'aria-disabled': 'true' }

    return { ...named, to: props.to }
  })

  const titleTag = computed(() => (props.headingLevel ? `h${props.headingLevel}` : 'p'))
  const titleAttrs = computed<Record<string, unknown>>(() => ({ id: titleId }))

  return { isLink, isDisabled, rootTag, rootAttrs, titleTag, titleAttrs }
}
