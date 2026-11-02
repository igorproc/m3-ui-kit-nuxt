/**
 * @module useButton
 *
 * @remarks
 * Internal core of the button family (`MButton`, `MButtonFab`,
 * `MButtonExtendedFab`): native-button vs Nuxt-link root, the
 * `disabled || softDisabled || loading` state, the toggle (`selected`) state, the ARIA/link
 * attributes, the ripple gate, and the BEM class group. It lives in `utils/`
 * (no auto-import) because it hands out the kit's own class names — the
 * escape hatch for a button is the native `<button>`.
 *
 * The caller passes its BEM `block` (e.g. `'ui-fab'`) so the class group is
 * namespaced correctly, plus any block-specific modifier suffixes.
 */
import { computed } from 'vue'
import type { Component } from 'vue'
import { linkAttrs, linkTag } from '#kit/utils/link'

export interface UseButtonProps {
  disabled?: boolean
  /** Disabled that keeps the Tab stop: `aria-disabled`, activation swallowed. */
  softDisabled?: boolean
  loading?: boolean
  variant?: string
  color?: string
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
  // Inert but still focusable: loading, or soft-disabled without a real `disabled`.
  const isFocusableInert = computed(() => !props.disabled && (Boolean(props.loading) || Boolean(props.softDisabled)))
  const isDisabled = computed(() => Boolean(props.disabled) || isFocusableInert.value)
  // A link navigates and has no pressed state to announce, so it is never a toggle.
  const isToggle = computed(() => !isLink.value && props.selected !== undefined)
  const isDisabledLink = computed(() => isLink.value && Boolean(props.disabled))
  const tag = computed<Component | string>(() => isLink.value ? linkTag(Boolean(props.disabled)) : 'button')

  const rootClass = computed(() => {
    const classes: Array<string | Record<string, boolean>> = [block]

    for (const axis of [props.variant, props.color, props.density, props.shape]) {
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

  // A loading or soft-disabled button is inert but keeps focus: a native
  // `disabled` would throw focus to <body> the moment the work starts or the
  // last page is reached. Only a real `disabled` button leaves the tab order.
  const rootAttrs = computed<Record<string, unknown>>(() => {
    const attrs: Record<string, unknown> = {
      'aria-busy': props.loading ? 'true' : undefined,
      'onClickCapture': swallowWhileInert,
      'onClick': toggle,
    }

    // A disabled link loses its destination (the kit's one disabled-link
    // behaviour, `utils/link`); a loading or soft-disabled one keeps it and its
    // Tab stop, and its activation is swallowed like a loading button's.
    if (isLink.value) {
      Object.assign(attrs, linkAttrs(props.to, Boolean(props.disabled)))
      if (isFocusableInert.value) attrs['aria-disabled'] = 'true'
      return attrs
    }

    attrs.type = props.type ?? 'button'
    attrs.disabled = Boolean(props.disabled)
    attrs['aria-disabled'] = isFocusableInert.value ? 'true' : undefined
    attrs['aria-pressed'] = isToggle.value ? String(Boolean(props.selected)) : undefined
    return attrs
  })

  // Capture on the root runs before any click listener the consumer attached to
  // it, so a keyboard activation of an inert button reaches no handler, no form
  // submit and no navigation.
  function swallowWhileInert(event: Event) {
    if (!props.loading && !props.softDisabled) return

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
    isDisabledLink,
    isDisabled,
    rippleEnabled: computed(() => !isDisabled.value),
    rootClass,
    rootAttrs,
  }
}
