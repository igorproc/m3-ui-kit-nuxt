/**
 * @module useChipControl
 *
 * @remarks
 * Behaviour layer of `<MChip>`: selection (standalone model or a `<MChipGroup>`
 * ticket), the arrow keys between the chip's actions and through its group,
 * and the remove action. Returns attribute bags for the main action and the
 * remove button; no classes, no `data-*`.
 *
 * Arrow keys: along the inline axis they first walk the chip's own actions
 * (main → remove, as material-web's multi-action chip) and only then pass to
 * the group; the group's own axis (`direction`) moves between chips. RTL swaps
 * the inline keys. Space and Enter stay native button activation.
 */
import { computed, onScopeDispose, shallowRef } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { tryUseChipGroupContext } from '#kit/composables/chip-group/context'
import type { MChipGroupTicket } from '#kit/composables/chip-group/context'
import type { MChipRemoval, MChipType } from '#kit/components/ui/chip/props'

export interface ChipControlProps {
  type: MChipType
  value?: unknown
  disabled: boolean
  removal: MChipRemoval
  removeLabel?: string
}

export interface ChipActionAttrs {
  'disabled': boolean
  'aria-pressed': boolean | undefined
  'aria-disabled': 'true' | undefined
  'aria-label': string | undefined
  'tabindex': number | undefined
  'onClick': () => void
  'onKeydown': (event: KeyboardEvent) => void
}

export interface ChipRemoveAttrs {
  'disabled': boolean
  'aria-label': string | undefined
  'tabindex': -1
  'onClick': (event: MouseEvent) => void
  'onKeydown': (event: KeyboardEvent) => void
}

export interface UseChipControlReturn {
  ticket: MChipGroupTicket<unknown> | undefined
  isSelected: ComputedRef<boolean>
  isDisabled: ComputedRef<boolean>
  isBlocked: ComputedRef<boolean>
  /** A toggle: a grouped chip, or a standalone filter chip. */
  isToggle: ComputedRef<boolean>
  /** Template ref for the remove button. */
  removeElement: ShallowRef<HTMLElement | null>
  actionAttrs: ComputedRef<ChipActionAttrs>
  removeAttrs: ComputedRef<ChipRemoveAttrs>
}

const isRtl = (element: HTMLElement | null) => (element ? getComputedStyle(element).direction === 'rtl' : false)

export function useChipControl(
  props: ChipControlProps,
  selectedModel: Ref<boolean>,
  element: Readonly<ShallowRef<HTMLElement | null>>,
  emitRemove: () => void,
): UseChipControlReturn {
  const group = tryUseChipGroupContext()
  const removeElement = shallowRef<HTMLElement | null>(null)

  /**
   * A chip joins the group only with a `value`. Without one it stays standalone —
   * a normal Tab stop with its own boolean model — even inside a group layout.
   */
  const ticket = group && props.value !== undefined
    ? group.register({ value: () => props.value, disabled: () => props.disabled, element })
    : undefined

  onScopeDispose(() => ticket?.stop())

  const isSelected = computed(() => (ticket ? ticket.selected.value : selectedModel.value))
  const isToggle = computed(() => Boolean(ticket) || props.type === 'filter')
  const isDisabled = computed(() => (ticket ? ticket.disabled.value : props.disabled))
  // Blocked by the group `max`: announced as unavailable through aria-disabled
  // rather than natively disabled, so it stays discoverable in the group.
  const isBlocked = computed(() => Boolean(ticket && ticket.blockReason.value === 'max'))

  function activate() {
    if (isDisabled.value) return

    if (props.removal === 'whole') {
      emitRemove()
      return
    }

    // The registry rejects a blocked toggle, so no local guard is duplicated.
    if (ticket) ticket.toggle()
    else if (props.type === 'filter') selectedModel.value = !selectedModel.value
  }

  /** Keys of the group's own axis, or `null` when the key is not one of them. */
  function groupStep(event: KeyboardEvent, inlineForward: string, inlineBackward: string): 'next' | 'prev' | 'first' | 'last' | null {
    if (event.key === 'Home') return 'first'
    if (event.key === 'End') return 'last'
    if (!group) return null
    const horizontal = group.direction.value === 'horizontal'
    if (event.key === (horizontal ? inlineForward : 'ArrowDown')) return 'next'
    if (event.key === (horizontal ? inlineBackward : 'ArrowUp')) return 'prev'
    return null
  }

  function moveInGroup(step: 'next' | 'prev' | 'first' | 'last' | null, event: KeyboardEvent) {
    if (!group || !ticket || !step) return
    event.preventDefault()
    if (step === 'next') group.focusNext(ticket.value.value)
    else if (step === 'prev') group.focusPrev(ticket.value.value)
    else if (step === 'first') group.focusFirst()
    else group.focusLast()
  }

  function onActionKeydown(event: KeyboardEvent) {
    const rtl = isRtl(element.value)
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft'

    if (event.key === forward && props.removal === 'button' && removeElement.value && !isDisabled.value) {
      event.preventDefault()
      removeElement.value.focus()
      return
    }

    moveInGroup(groupStep(event, forward, backward), event)
  }

  function onRemoveKeydown(event: KeyboardEvent) {
    const rtl = isRtl(removeElement.value)
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft'

    if (event.key === backward) {
      event.preventDefault()
      element.value?.focus()
      return
    }

    moveInGroup(groupStep(event, forward, backward), event)
  }

  const actionAttrs = computed<ChipActionAttrs>(() => ({
    'disabled': isDisabled.value,
    'aria-pressed': isToggle.value && props.removal !== 'whole' ? isSelected.value : undefined,
    'aria-disabled': isBlocked.value ? 'true' : undefined,
    // The whole chip removes: its name says so.
    'aria-label': props.removal === 'whole' ? props.removeLabel : undefined,
    'tabindex': ticket?.tabindex.value,
    'onClick': activate,
    'onKeydown': onActionKeydown,
  }))

  const removeAttrs = computed<ChipRemoveAttrs>(() => ({
    'disabled': isDisabled.value,
    'aria-label': props.removeLabel,
    // One Tab stop per chip: the arrows reach the remove action.
    'tabindex': -1,
    'onClick': (event: MouseEvent) => {
      event.stopPropagation()
      if (!isDisabled.value) emitRemove()
    },
    'onKeydown': onRemoveKeydown,
  }))

  return { ticket, isSelected, isDisabled, isBlocked, isToggle, removeElement, actionAttrs, removeAttrs }
}
