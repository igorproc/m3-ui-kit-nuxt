/**
 * @module useButton
 *
 * @remarks
 * Shared headless core for the button family (`MButton`, `MButtonFab`,
 * `MButtonExtendedFab`, and any future member). Owns the behavior every button
 * repeats: native-button vs Nuxt-link root, the `disabled || loading` state,
 * the ARIA/link attributes, the ripple gate, and the BEM class group.
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
}

export function useButton(options: UseButtonOptions) {
  const { block, props } = options

  const isLink = computed(() => props.tag === 'link')
  const isDisabled = computed(() => Boolean(props.disabled) || Boolean(props.loading))
  const tag = computed<Component | string>(() => isLink.value ? NuxtLink : 'button')

  const rootClass = computed(() => {
    const classes: Array<string | Record<string, boolean>> = [block]

    if (props.variant) classes.push(`${block}--${props.variant}`)
    if (props.color) classes.push(`${block}--${props.color}`)
    if (props.size) classes.push(`${block}--${props.size}`)

    const state: Record<string, boolean> = {
      [`${block}--disabled`]: isDisabled.value,
      [`${block}--loading`]: Boolean(props.loading),
    }
    for (const [suffix, active] of Object.entries(options.modifiers?.() ?? {})) {
      state[`${block}--${suffix}`] = active
    }
    classes.push(state)

    return classes
  })

  const rootAttrs = computed<Record<string, unknown>>(() => {
    const attrs: Record<string, unknown> = {
      'aria-busy': props.loading ? 'true' : undefined,
    }

    if (isLink.value) {
      if (props.to !== undefined) attrs.to = props.to
      attrs['aria-disabled'] = isDisabled.value ? 'true' : undefined
      attrs.tabindex = isDisabled.value ? -1 : undefined
      return attrs
    }

    attrs.type = props.type ?? 'button'
    attrs.disabled = isDisabled.value
    return attrs
  })

  return {
    tag,
    isLink,
    isDisabled,
    rippleEnabled: computed(() => !isDisabled.value),
    rootClass,
    rootAttrs,
  }
}
