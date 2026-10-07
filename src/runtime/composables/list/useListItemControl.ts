/**
 * @module useListItemControl
 *
 * @remarks
 * Behaviour of one `<MListItem>`: which element draws the row, whether an `li`
 * wraps it, and the attribute bag that element carries — role, tab stop,
 * disabled and selected state. Returns no classes and no `data-*`
 * (behavior.md); the component owns the presentation.
 *
 * Semantics follow the element. Inside a `ul` a static row is the `li` itself
 * and an interactive row is a button or link inside its `li`. A row whose
 * consumer set a `role` (a listbox option) belongs to that role's owner: the
 * row adds no role and no selected state of its own.
 */
import { computed, defineAsyncComponent, mergeProps } from 'vue'
import type { Component, ComputedRef } from 'vue'

const NuxtLink = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))

export interface ListItemControlProps {
  tag: string
  to?: unknown
  interactive: boolean
  disabled: boolean
  /** `undefined` keeps a plain row; a boolean makes the row part of a selection. */
  selected?: boolean
}

export interface UseListItemControlOptions {
  props: ListItemControlProps
  /** Attributes the consumer put on the row, merged last. */
  attrs: () => Record<string, unknown>
  /** The enclosing list renders as `ul`. */
  semantic: () => boolean
}

export interface UseListItemControlReturn {
  isInteractive: ComputedRef<boolean>
  /** An `li` has to wrap the row element. */
  wrapped: ComputedRef<boolean>
  /** Element, or `NuxtLink`, that draws the row. */
  tag: ComputedRef<string | Component>
  /** The row element's attributes: its own, then the consumer's. */
  rowAttrs: ComputedRef<Record<string, unknown>>
}

export function useListItemControl({ props, attrs, semantic }: UseListItemControlOptions): UseListItemControlReturn {
  const isLink = computed(() => Boolean(props.to) || props.tag === 'a')
  const isInteractive = computed(() => props.interactive || props.tag === 'button' || isLink.value)
  // Native button and anchor bring their own role, tab stop and Enter/Space;
  // any other interactive element has to emulate a button.
  const emulatesButton = computed(() => isInteractive.value && !isLink.value && props.tag !== 'button')
  const hasConsumerRole = computed(() => attrs().role !== undefined)

  const tag = computed<string | Component>(() => {
    if (props.to) return props.disabled ? 'a' : NuxtLink
    if (semantic() && !isInteractive.value) return 'li'
    return props.tag
  })

  // A link announces the current page; a button announces a toggle. Nothing
  // when the row is not part of a selection, so a plain action row stays a
  // plain button.
  const selectionAttrs = (): Record<string, string> => {
    if (props.selected === undefined || !isInteractive.value) return {}
    if (isLink.value) return props.selected ? { 'aria-current': 'page' } : {}
    return { 'aria-pressed': String(props.selected) }
  }

  const activateOnKey = (event: KeyboardEvent) => {
    if (props.disabled) return
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return

    event.preventDefault()
    const row = event.currentTarget as HTMLElement
    row.click()
  }

  const isNativeButton = computed(() => props.tag === 'button' && !props.to)

  const ownAttrs = computed(() => {
    const own: Record<string, unknown> = {}

    if (props.to && !props.disabled) own.to = props.to
    // Dimmed text is not the only sign of a disabled row (color-and-state.md):
    // a native button says it with `disabled`, everything else with ARIA.
    if (isNativeButton.value) own.disabled = props.disabled
    else if (props.disabled) own['aria-disabled'] = 'true'

    if (emulatesButton.value) {
      own.tabindex = props.disabled ? -1 : 0
      own.onKeydown = activateOnKey
    }

    if (hasConsumerRole.value) return own

    if (emulatesButton.value) own.role = 'button'
    // Without `href` an anchor has no role; `link` keeps it announced as a
    // link that is unavailable.
    if (isLink.value && props.disabled) own.role = 'link'

    return { ...own, ...selectionAttrs() }
  })

  const rowAttrs = computed(() => {
    const merged = mergeProps(ownAttrs.value, attrs())
    // A disabled link leaves the tab order the way a disabled button does: an
    // anchor without `href` is not focusable and Enter does not follow it.
    if (isLink.value && props.disabled) delete merged.href
    // A row never submits a form, whatever `type` it was handed: submitting
    // belongs to a button placed in one of its slots.
    if (isNativeButton.value) merged.type = 'button'
    return merged
  })

  return {
    isInteractive,
    wrapped: computed(() => semantic() && isInteractive.value),
    tag,
    rowAttrs,
  }
}
