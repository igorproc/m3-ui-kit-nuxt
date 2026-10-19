/**
 * @module useSelectionShell
 *
 * @remarks
 * What `<MDropdown>` and `<MAutocomplete>` do around the shared control, so the
 * two components hold it once: validation and the error shown, the field's
 * parts (the panel anchors to the drawn box, focus goes to the input), who
 * drives the virtual focus — keyboard or pointer — and the dev warning for a
 * control left without a name.
 */
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useField } from '#kit/composables/useField'
import type { UseFieldReturn } from '#kit/composables/useField'
import type { MFieldParts } from '#kit/components/ui/text-field/props'
import type { MDropdownMessages } from '#kit/components/ui/dropdown/props'

/** Keys that move nothing: holding one must not turn the pointer's row into the keyboard's. */
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'])

export interface SelectionShellProps {
  path?: string
  error: boolean
  errorMessage?: string
  messages?: MDropdownMessages
}

export interface UseSelectionShellOptions<TValue> {
  props: SelectionShellProps
  model: Ref<TValue | TValue[] | undefined>
  open: Ref<boolean>
}

export interface UseSelectionShellReturn<TValue> {
  fieldRef: Ref<MFieldParts | null>
  /** The drawn box: the panel anchors to it, not to the root with its support line. */
  fieldControl: ComputedRef<HTMLElement | null>
  field: UseFieldReturn<TValue | TValue[] | undefined>
  isError: ComputedRef<boolean>
  displayError: ComputedRef<string | undefined>
  /** The keyboard drives the virtual focus, so the active row wears the ring. */
  keyboardCursor: Ref<boolean>
  onKeyboard: (event: KeyboardEvent) => void
  onPointer: () => void
  focusInput: () => void
  /** The field's own frame around the box (not the box, a label or the support line). */
  isFieldFrame: (target: EventTarget | null) => boolean
}

export function useSelectionShell<TValue>(options: UseSelectionShellOptions<TValue>): UseSelectionShellReturn<TValue> {
  const { props, model, open } = options

  const fieldRef = ref<MFieldParts | null>(null)
  const fieldControl = computed(() => fieldRef.value?.control ?? null)

  // Validation binds the selection, not the text in the box.
  const field = useField<TValue | TValue[] | undefined>({ path: props.path, model })
  const isError = computed(() => props.error || Boolean(props.errorMessage) || field.hasError.value)
  const displayError = computed(() => field.errorMessage.value ?? props.errorMessage)

  const keyboardCursor = ref(false)

  function onKeyboard(event: KeyboardEvent) {
    if (!MODIFIER_KEYS.has(event.key)) keyboardCursor.value = true
  }

  function onPointer() {
    keyboardCursor.value = false
  }

  // The page is where the user put it; focusing the input must not scroll it.
  function focusInput() {
    fieldRef.value?.input?.focus({ preventScroll: true })
  }

  // A click can land on the box, the label or the indicator — none of which is
  // focusable — so the input takes focus whenever the panel opens. Without it
  // the combobox has no DOM focus and `aria-activedescendant` points from nowhere.
  watch(open, (value) => {
    if (value) nextTick(focusInput)
  })

  const isFieldFrame = (target: EventTarget | null) => target != null && target === fieldControl.value?.parentElement

  return { fieldRef, fieldControl, field, isError, displayError, keyboardCursor, onKeyboard, onPointer, focusInput, isFieldFrame }
}

/**
 * Warns in dev when a control on screen has no phrase in `messages` for a name:
 * the kit ships no English fallback, and an unnamed button is worse.
 *
 * @param component Tag shown in the warning, e.g. `'m-dropdown'`.
 * @param messages The component's phrases.
 * @param named The `messages` keys of the controls rendered right now.
 */
export function useUnnamedControlWarning(component: string, messages: () => MDropdownMessages | undefined, named: () => Array<keyof MDropdownMessages>) {
  if (!import.meta.dev) return
  watchEffect(() => {
    for (const key of named()) {
      if (!messages()?.[key]) console.warn(`[${component}] a control has no accessible name: pass \`messages.${key}\`.`)
    }
  })
}
