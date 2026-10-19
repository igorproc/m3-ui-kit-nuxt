/**
 * @module useExpansionPanelControl
 *
 * @remarks
 * Behaviour of `<MExpansionPanel>`: the open state, the APG Accordion wiring
 * and the group membership. It hands out attribute bags and no classes or
 * `data-*`, so the same behaviour runs on markup the kit knows nothing about.
 *
 * - The header button carries `aria-expanded` / `aria-controls`; the content is
 *   a region labelled by it.
 * - Collapsed content is `inert`: out of the Tab order and the accessibility
 *   tree while it is still in the DOM for the height animation. If focus was
 *   inside when the panel closes, it moves to the header button.
 * - Inside an exclusive `mandatory` group the open panel cannot close, so its
 *   button says so with `aria-disabled="true"`.
 * - Inside `<MExpansionPanels>` the panel registers under its `value` and
 *   registers again when the value changes.
 *
 * @example
 * ```ts
 * const open = defineModel<boolean>({ default: false })
 * const { isOpen, headingTag, buttonAttrs, regionAttrs } = useExpansionPanelControl(open, props)
 * ```
 */
import { computed, onScopeDispose, useId, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useExpansionPanelGroupContext } from '#kit/components/ui/expansion-panels/context'
import type { PanelValue } from '#kit/components/ui/expansion-panel/props'
import type { MHeadingLevel } from '#kit/shared/types/props'

export interface ExpansionPanelControlProps {
  disabled: boolean
  /** Identity inside a group; generated when absent. */
  value?: PanelValue
  /** Heading level around the button; no heading when absent. */
  headingLevel?: MHeadingLevel
}

export interface UseExpansionPanelControlOptions {
  /** `id` of the header button (e.g. one the consumer set); generated when absent. */
  id?: string
}

export interface UseExpansionPanelControlReturn {
  isOpen: ComputedRef<boolean>
  /** Open in an exclusive `mandatory` group: the button cannot collapse it. */
  isLocked: ComputedRef<boolean>
  /** Inside `<MExpansionPanels>`: the group, not the panel's own model, decides the open state. */
  isGrouped: boolean
  toggle: () => void
  /** Native heading element for `headingLevel` (`h2`–`h6`), `undefined` without one. */
  headingTag: ComputedRef<`h${MHeadingLevel}` | undefined>
  /** The same heading for an element that is not `h{n}`: `role="heading"` and `aria-level`. */
  headingAttrs: ComputedRef<Record<string, unknown>>
  buttonAttrs: ComputedRef<Record<string, unknown>>
  regionAttrs: ComputedRef<Record<string, unknown>>
}

/**
 * @param open Open state of a standalone panel (its `v-model`); a group decides it otherwise.
 * @param props Resolved panel props, read reactively.
 */
export function useExpansionPanelControl(
  open: Ref<boolean>,
  props: ExpansionPanelControlProps,
  options: UseExpansionPanelControlOptions = {},
): UseExpansionPanelControlReturn {
  const group = useExpansionPanelGroupContext()

  const buttonId = options.id ?? useId()
  const regionId = useId()
  const generatedValue = useId()
  const panelValue = computed(() => props.value ?? generatedValue)

  if (group) {
    const register = (value: PanelValue) => group.register({ value, disabled: () => props.disabled })
    let ticket = register(panelValue.value)

    watch(panelValue, (value) => {
      group.unregister(ticket.id)
      ticket = register(value)
    })

    onScopeDispose(() => group.unregister(ticket.id))
  }

  const isOpen = computed(() => (group ? group.isOpen(panelValue.value) : open.value))
  const isLocked = computed(() => Boolean(group?.isLocked(panelValue.value)))

  function toggle() {
    if (props.disabled) return

    if (group) group.toggle(panelValue.value)
    else open.value = !open.value
  }

  // Runs before the DOM update makes the region inert, while the focused
  // element is still focusable; inert would otherwise drop focus to <body>.
  watch(isOpen, (nowOpen) => {
    if (nowOpen || typeof document === 'undefined') return

    const region = document.getElementById(regionId)
    if (region?.contains(document.activeElement)) document.getElementById(buttonId)?.focus()
  })

  const headingTag = computed(() => (props.headingLevel ? `h${props.headingLevel}` as const : undefined))

  const headingAttrs = computed<Record<string, unknown>>(() => (props.headingLevel
    ? { 'role': 'heading', 'aria-level': props.headingLevel }
    : {}))

  const buttonAttrs = computed<Record<string, unknown>>(() => ({
    'id': buttonId,
    'type': 'button',
    'disabled': props.disabled,
    'aria-expanded': String(isOpen.value),
    'aria-controls': regionId,
    'aria-disabled': isLocked.value ? 'true' : undefined,
    'onClick': toggle,
  }))

  const regionAttrs = computed<Record<string, unknown>>(() => ({
    'id': regionId,
    'role': 'region',
    'aria-labelledby': buttonId,
    'inert': !isOpen.value,
  }))

  return { isOpen, isLocked, isGrouped: Boolean(group), toggle, headingTag, headingAttrs, buttonAttrs, regionAttrs }
}
