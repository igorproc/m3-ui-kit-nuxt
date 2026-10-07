/**
 * @module useButton
 *
 * @remarks
 * Shared headless core for the button family (`MButton`, `MButtonFab`,
 * `MButtonExtendedFab`, and any future member). Owns the behavior every button
 * repeats: native-button vs Nuxt-link root, the `disabled || loading` state,
 * the toggle (`selected`) state, the ARIA/link attributes, the ripple gate, and
 * the BEM class group.
 *
 * The caller passes its BEM `block` (e.g. `'ui-fab'`) so the class group is
 * namespaced correctly, plus any block-specific modifier suffixes.
 */
import { computed, defineAsyncComponent } from 'vue'
import type { Component } from 'vue'

const NuxtLink = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))

export interface UseButtonProps {
  disabled?: boolean
  loading?: boolean
  variant?: string
  color?: string
  size?: string
  density?: string
  shape?: string
  /** Toggle state; `undefined` keeps a plain action button. */
  selected?: boolean
  tag?: 'button' | 'link'
  type?: string
  to?: unknown
}

interface UseButtonOptions {
  /** BEM root class, e.g. `'ui-button'` or `'ui-fab'`. */
  block: string
  props: UseButtonProps
  /** Extra block-specific modifiers, keyed by suffix (`'icon-only'` → `${block}--icon-only`). */
  modifiers?: () => Record<string, boolean>
  /** Receives the next state when a toggle button is activated. */
  onToggle?: (selected: boolean) => void
}

export function useButton(options: UseButtonOptions) {
  const { block, props } = options

  const isLink = computed(() => props.tag === 'link')
  const isDisabled = computed(() => Boolean(props.disabled) || Boolean(props.loading))
  const isToggle = computed(() => props.selected !== undefined)
  const tag = computed<Component | string>(() => isLink.value ? NuxtLink : 'button')

  const rootClass = computed(() => {
    const classes: Array<string | Record<string, boolean>> = [block]

    for (const axis of [props.variant, props.color, props.size, props.density, props.shape]) {
      if (axis) classes.push(`${block}--${axis}`)
    }

    const state: Record<string, boolean> = {
      [`${block}--disabled`]: isDisabled.value,
      [`${block}--loading`]: Boolean(props.loading),
      [`${block}--selected`]: isToggle.value && Boolean(props.selected),
      [`${block}--unselected`]: isToggle.value && !props.selected,
    }
    for (const [suffix, active] of Object.entries(options.modifiers?.() ?? {})) {
      state[`${block}--${suffix}`] = active
    }
    classes.push(state)

    return classes
  })

  // A loading button is inert but keeps focus: a native `disabled` would throw
  // focus to <body> the moment the work starts. Only a real `disabled` button
  // leaves the tab order.
  const rootAttrs = computed<Record<string, unknown>>(() => {
    const attrs: Record<string, unknown> = {
      'aria-busy': props.loading ? 'true' : undefined,
      'onClickCapture': swallowWhileLoading,
      'onClick': toggle,
    }

    if (isLink.value) {
      if (props.to !== undefined) attrs.to = props.to
      attrs['aria-disabled'] = isDisabled.value ? 'true' : undefined
      attrs.tabindex = props.disabled ? -1 : undefined
      return attrs
    }

    attrs.type = props.type ?? 'button'
    attrs.disabled = Boolean(props.disabled)
    attrs['aria-disabled'] = props.loading && !props.disabled ? 'true' : undefined
    attrs['aria-pressed'] = isToggle.value ? String(Boolean(props.selected)) : undefined
    return attrs
  })

  // Capture on the root runs before any click listener the consumer attached to
  // it, so a keyboard activation of a loading button reaches no handler, no form
  // submit and no navigation.
  function swallowWhileLoading(event: Event) {
    if (!props.loading) return

    event.preventDefault()
    event.stopImmediatePropagation()
  }

  function toggle() {
    if (!isToggle.value || isDisabled.value) return

    options.onToggle?.(!props.selected)
  }

  return {
    tag,
    isLink,
    isDisabled,
    rippleEnabled: computed(() => !isDisabled.value),
    rootClass,
    rootAttrs,
  }
}
