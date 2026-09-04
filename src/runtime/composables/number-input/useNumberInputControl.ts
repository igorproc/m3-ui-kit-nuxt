/**
 * @module useNumberInputControl
 *
 * @remarks
 * Behavior layer of the number input. Composes the value loop, the scrub
 * gesture and the validation binding into ready-to-spread attr bags —
 * `inputAttrs`, `labelAttrs`, `supportAttrs`, `incrementAttrs`,
 * `decrementAttrs` — carrying the whole non-visual surface and every ARIA
 * relationship between them. It renders nothing and assumes no markup.
 *
 * The number input is layered the same way the textarea and the slider are:
 * - {@link useNumberValue} — draft ⇄ model, stepping, clamping
 * - {@link useNumberScrub} — the horizontal drag gesture
 * - {@link useField} — validation-adapter binding
 * - `useNumberInputControl` — all three plus ids and ARIA, markup-agnostic
 * - `<MNumberInput>` — one possible markup on top of this composable
 *
 * Presentation is deliberately absent: no classes and no `data-*` are produced
 * here, only state a consumer turns into whatever its own markup needs.
 *
 * @example
 * ```vue
 * <label v-bind="labelAttrs">Width</label>
 * <input ref="element" v-model="draft" v-bind="inputAttrs">
 * <button v-bind="incrementAttrs">+</button>
 * ```
 * ```ts
 * const control = useNumberInputControl(model, focused, props)
 * ```
 */
import { computed, shallowRef, useId } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { useField } from '#kit/composables/useField'
import { useNumberValue } from '#kit/composables/number-input/useNumberValue'
import { useNumberScrub } from '#kit/composables/number-input/useNumberScrub'
import type { NumberValueHooks, NumberValueProps, UseNumberValueReturn } from '#kit/composables/number-input/useNumberValue'
import type { NumberScrubProps } from '#kit/composables/number-input/useNumberScrub'

export interface NumberInputControlProps extends NumberValueProps, NumberScrubProps {
  /** Validation-adapter path. Evaluated once at setup; absent means inert. */
  path?: string
  name?: string
  label?: string
  placeholder?: string
  helperText?: string
  errorMessage?: string
  error?: boolean
  required?: boolean
  autofocus?: boolean
  autocomplete?: string
  /** Accessible names for the stepper buttons — the only user-facing copy here. */
  incrementLabel?: string
  decrementLabel?: string
}

export interface NumberInputAttrs {
  'id': string
  'name': string | undefined
  'type': 'text'
  'inputmode': 'numeric' | 'decimal'
  'placeholder': string | undefined
  'disabled': boolean
  'readonly': boolean
  'required': boolean
  'autofocus': boolean
  'autocomplete': string | undefined
  'role': 'spinbutton'
  'aria-valuemin': number | undefined
  'aria-valuemax': number | undefined
  'aria-valuenow': number | undefined
  'aria-valuetext': string | undefined
  'aria-invalid': 'true' | undefined
  'aria-required': 'true' | undefined
  'aria-describedby': string | undefined
  'onFocus': () => void
  'onBlur': () => void
  'onInput': () => void
  'onKeydown': (event: KeyboardEvent) => void
  'onCompositionstart': () => void
  'onCompositionend': () => void
}

export interface NumberLabelAttrs {
  id: string
  for: string
}

export interface NumberSupportAttrs {
  id: string
  role: 'alert' | undefined
}

export interface NumberStepperAttrs {
  'type': 'button'
  'disabled': boolean
  'aria-label': string
  /**
   * Kept out of the tab order on purpose: the input is already a `spinbutton`
   * with ArrowUp/ArrowDown, so focusable steppers would add two tab stops per
   * field that reach nothing the keyboard could not already do (WAI-ARIA
   * spinbutton pattern).
   */
  'tabindex': -1
  'onClick': () => void
}

export interface UseNumberInputControlReturn {
  element: ShallowRef<HTMLInputElement | null>
  /** Drag handle for the scrub gesture — bind to the element acting as the handle. */
  handle: ShallowRef<HTMLElement | null>
  fieldId: string
  /** The editable string. Bind with `v-model` on the input. */
  draft: Ref<string>
  isFocused: Ref<boolean>
  isScrubbing: Readonly<Ref<boolean>>
  isPopulated: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  /** Error message when invalid, helper text otherwise. */
  message: ComputedRef<string | undefined>
  canIncrement: ComputedRef<boolean>
  canDecrement: ComputedRef<boolean>
  nextIncrement: ComputedRef<number>
  nextDecrement: ComputedRef<number>
  increment: () => void
  decrement: () => void
  inputAttrs: ComputedRef<NumberInputAttrs>
  labelAttrs: ComputedRef<NumberLabelAttrs>
  supportAttrs: ComputedRef<NumberSupportAttrs>
  incrementAttrs: ComputedRef<NumberStepperAttrs>
  decrementAttrs: ComputedRef<NumberStepperAttrs>
  /** The underlying value layer, for consumers that need the raw controls. */
  value: UseNumberValueReturn
}

/** Rows a PageUp/PageDown jump is worth, mirroring the native spinbutton feel. */
const PAGE_MULTIPLIER = 10

/**
 * Binds a nullable numeric model to an input, its steppers and its scrub handle.
 *
 * @param model The numeric model; `null` means empty.
 * @param focused The component-owned focus model.
 * @param props Reactive props bag, see {@link NumberInputControlProps}.
 * @param hooks Bridges for the component's `increment`/`decrement`/`invalid` emits.
 * @param fieldId Stable id; generated when omitted.
 */
export function useNumberInputControl(
  model: Ref<number | null>,
  focused: Ref<boolean>,
  props: NumberInputControlProps,
  hooks: NumberValueHooks = {},
  fieldId: string = useId() ?? 'm-number-input',
): UseNumberInputControlReturn {
  const element = shallowRef<HTMLInputElement | null>(null)
  const messageId = `${fieldId}-message`

  const field = useField({ path: props.path, model })
  const value = useNumberValue(model, focused, props, hooks)
  const { handle, isScrubbing } = useNumberScrub(value, props)

  const isError = computed(() => Boolean(props.error) || Boolean(props.errorMessage) || field.hasError.value)
  const message = computed(() => (isError.value
    ? field.errorMessage.value || props.errorMessage || props.helperText
    : props.helperText))
  const isPopulated = computed(() => value.draft.value !== '')

  const describedBy = computed(() => (message.value ? messageId : undefined))
  const inputMode = computed<'numeric' | 'decimal'>(() => (value.precision.value > 0 ? 'decimal' : 'numeric'))

  function increment() {
    value.step(1)
  }

  function decrement() {
    value.step(-1)
  }

  function onKeydown(event: KeyboardEvent) {
    const actions: Partial<Record<string, () => void>> = {
      ArrowUp: () => value.step(1),
      ArrowDown: () => value.step(-1),
      PageUp: () => value.step(1, PAGE_MULTIPLIER),
      PageDown: () => value.step(-1, PAGE_MULTIPLIER),
      Home: value.toMin,
      End: value.toMax,
      Enter: () => value.commit(),
      Escape: () => value.revert(),
    }

    const action = actions[event.key]
    if (!action) return

    // Home/End only belong to the field when it has a bound to jump to;
    // otherwise they stay the caret shortcuts the user expects in a text input.
    if (event.key === 'Home' && !value.hasMin.value) return
    if (event.key === 'End' && !value.hasMax.value) return

    event.preventDefault()
    action()
  }

  const inputAttrs = computed<NumberInputAttrs>(() => ({
    'id': fieldId,
    'name': props.name ?? props.path,
    // A `text` input with `inputmode` beats `type="number"`: it keeps the
    // locale-aware draft (grouping separators, `1,5`) that the codec parses,
    // and drops the scroll-wheel-eats-your-value behaviour.
    'type': 'text',
    'inputmode': inputMode.value,
    'placeholder': props.placeholder,
    'disabled': Boolean(props.disabled),
    'readonly': Boolean(props.readonly),
    'required': Boolean(props.required),
    'autofocus': Boolean(props.autofocus),
    'autocomplete': props.autocomplete,
    'role': 'spinbutton',
    'aria-valuemin': props.min,
    'aria-valuemax': props.max,
    'aria-valuenow': model.value ?? undefined,
    'aria-valuetext': model.value === null ? undefined : value.codec.value.format(model.value),
    'aria-invalid': !field.meta.valid || isError.value ? 'true' : undefined,
    'aria-required': props.required ? 'true' : undefined,
    'aria-describedby': describedBy.value,
    'onFocus': value.onFocus,
    'onBlur': value.onBlur,
    'onInput': value.onInput,
    'onKeydown': onKeydown,
    'onCompositionstart': value.onCompositionStart,
    'onCompositionend': value.onCompositionEnd,
  }))

  const labelAttrs = computed<NumberLabelAttrs>(() => ({
    id: `${fieldId}-label`,
    for: fieldId,
  }))

  const supportAttrs = computed<NumberSupportAttrs>(() => ({
    id: messageId,
    // Only a real error interrupts; a helper line that announces itself on
    // every render is noise.
    role: isError.value ? 'alert' : undefined,
  }))

  const incrementAttrs = computed<NumberStepperAttrs>(() => ({
    'type': 'button',
    'disabled': !value.canIncrement.value,
    'aria-label': props.incrementLabel ?? 'Increase value',
    'tabindex': -1,
    'onClick': increment,
  }))

  const decrementAttrs = computed<NumberStepperAttrs>(() => ({
    'type': 'button',
    'disabled': !value.canDecrement.value,
    'aria-label': props.decrementLabel ?? 'Decrease value',
    'tabindex': -1,
    'onClick': decrement,
  }))

  return {
    element,
    handle,
    fieldId,
    draft: value.draft,
    isFocused: focused,
    isScrubbing,
    isPopulated,
    isError,
    message,
    canIncrement: value.canIncrement,
    canDecrement: value.canDecrement,
    nextIncrement: value.nextIncrement,
    nextDecrement: value.nextDecrement,
    increment,
    decrement,
    inputAttrs,
    labelAttrs,
    supportAttrs,
    incrementAttrs,
    decrementAttrs,
    value,
  }
}
