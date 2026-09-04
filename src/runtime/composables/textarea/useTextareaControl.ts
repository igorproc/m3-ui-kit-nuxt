/**
 * @module useTextareaControl
 *
 * @remarks
 * Behavior layer of the textarea. Turns a string model into ready-to-spread attr
 * bags — `inputAttrs`, `labelAttrs`, `supportAttrs`, `counterAttrs`, `gripAttrs`
 * — carrying the whole non-visual surface: validation binding, focus state, the
 * character counter, growth/resize and every ARIA relationship between them.
 * It renders nothing and assumes no markup.
 *
 * The textarea is layered the same way the slider is:
 * - {@link useTextField} — validation binding and focus, shared with `<MTextField>`
 * - {@link useTextareaResize} — height, growth and the resize grip
 * - `useTextareaControl` — both of those plus ids and ARIA, markup-agnostic
 * - `<MTextarea>` — one possible markup on top of this composable
 *
 * Presentation is deliberately absent: no classes and no `data-*` are produced
 * here, only state a consumer turns into whatever its own markup needs.
 *
 * @example
 * ```vue
 * <label v-bind="labelAttrs">Release notes</label>
 * <textarea ref="element" v-model="value" v-bind="inputAttrs" />
 * <span v-bind="counterAttrs">{{ counter?.text }}</span>
 * ```
 * ```ts
 * const control = useTextareaControl(model, focused, props)
 * ```
 */
import { computed, nextTick, shallowRef, useId, watch } from 'vue'
import type { ComputedRef, InjectionKey, Ref, ShallowRef } from 'vue'
import { useTextField } from '#kit/composables/text-field/useTextField'
import { useTextareaResize } from '#kit/composables/textarea/useTextareaResize'
import type { TextareaGripAttrs, TextareaResizeProps, UseTextareaResizeReturn } from '#kit/composables/textarea/useTextareaResize'

/**
 * How close to the limit the counter starts announcing itself. Below this the
 * counter stays silent — a live region that fires on every keystroke is worse
 * than no counter at all for a screen-reader user.
 */
const COUNTER_LIVE_RATIO = 0.1
const COUNTER_LIVE_MINIMUM = 10

export type MTextareaWrap = 'soft' | 'hard' | 'off'

/**
 * Interaction state the field publishes to anything rendered inside its
 * container — today the footer, which must go inert with the field rather than
 * leave live buttons in a disabled box.
 */
export interface TextareaFieldState {
  disabled: boolean
  readonly: boolean
}

export const textareaFieldStateKey: InjectionKey<ComputedRef<TextareaFieldState>>
  = Symbol('m-textarea-field-state')

export interface TextareaCounterState {
  length: number
  limit: number | undefined
  remaining: number | undefined
  /** `true` once the value is close enough to the limit to be worth announcing. */
  nearLimit: boolean
  text: string
}

export interface TextareaInputAttrs {
  'id': string
  'name': string | undefined
  'placeholder': string | undefined
  'rows': number
  'maxlength': number | undefined
  'disabled': boolean
  'readonly': boolean
  'required': boolean
  'autofocus': boolean
  'autocomplete': string | undefined
  'spellcheck': boolean | undefined
  'wrap': MTextareaWrap
  'aria-invalid': 'true' | undefined
  'aria-required': 'true' | undefined
  'aria-describedby': string | undefined
  'style': Record<string, string>
  'onFocus': () => void
  'onBlur': () => void
}

export interface TextareaLabelAttrs {
  id: string
  for: string
}

export interface TextareaSupportAttrs {
  id: string
  role: 'alert' | undefined
}

export interface TextareaCounterAttrs {
  'id': string
  'aria-live': 'polite' | undefined
  'aria-atomic': 'true' | undefined
}

/**
 * The props `<MTextarea>` hands over. It is read inside computeds, so passing
 * the component's reactive props object keeps everything tracked — and a plain
 * object works for a consumer with no component around it.
 */
export interface TextareaControlProps extends TextareaResizeProps {
  /** Validation-adapter path. Evaluated once at setup; absent means inert. */
  path?: string
  name?: string
  placeholder?: string
  helperText?: string
  errorMessage?: string
  error?: boolean
  required?: boolean
  autofocus?: boolean
  autocomplete?: string
  spellcheck?: boolean
  wrap?: MTextareaWrap
  maxlength?: number
  /** `true` counts against `maxlength`; a number sets a display-only limit. */
  counter?: boolean | number
}

export interface UseTextareaControlReturn extends Pick<
  UseTextareaResizeReturn,
  'isResizing' | 'hasManualHeight' | 'currentRows' | 'reset'
> {
  fieldId: string
  /** Template ref for the native control — required for growth and resize. */
  element: ShallowRef<HTMLTextAreaElement | null>
  isFocused: ComputedRef<boolean>
  isPopulated: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  /** Support-line text: field error, then `errorMessage`, then `helperText`. */
  message: ComputedRef<string | undefined>
  counter: ComputedRef<TextareaCounterState | undefined>
  /** Interaction state, also provided to descendants under {@link textareaFieldStateKey}. */
  fieldState: ComputedRef<TextareaFieldState>
  inputAttrs: ComputedRef<TextareaInputAttrs>
  labelAttrs: ComputedRef<TextareaLabelAttrs>
  supportAttrs: ComputedRef<TextareaSupportAttrs>
  counterAttrs: ComputedRef<TextareaCounterAttrs>
  gripAttrs: ComputedRef<TextareaGripAttrs>
}

export function useTextareaControl(
  model: Ref<string>,
  focused: Ref<boolean>,
  props: TextareaControlProps,
  fieldId: string = useId() ?? 'm-textarea',
): UseTextareaControlReturn {
  const element = shallowRef<HTMLTextAreaElement | null>(null)

  const supportId = `${fieldId}-support`
  const counterId = `${fieldId}-counter`
  const labelId = `${fieldId}-label`

  const field = useTextField({
    path: props.path,
    model,
    focused,
    error: () => Boolean(props.error),
    externalError: () => props.errorMessage,
  })

  const resize = useTextareaResize(element, props)

  const isPopulated = computed(() => model.value.length > 0)
  const message = computed(() => field.errorMessage.value || props.helperText)

  const fieldState = computed<TextareaFieldState>(() => ({
    disabled: Boolean(props.disabled),
    readonly: Boolean(props.readonly),
  }))

  const counter = computed<TextareaCounterState | undefined>(() => {
    const requested = props.counter ?? false

    if (requested === false) {
      return undefined
    }

    const limit = typeof requested === 'number' ? requested : props.maxlength
    const length = model.value.length
    const remaining = limit === undefined ? undefined : limit - length
    const threshold = limit === undefined
      ? 0
      : Math.max(COUNTER_LIVE_MINIMUM, Math.ceil(limit * COUNTER_LIVE_RATIO))

    return {
      length,
      limit,
      remaining,
      nearLimit: remaining !== undefined && remaining <= threshold,
      text: limit === undefined ? String(length) : `${length} / ${limit}`,
    }
  })

  const describedBy = computed(() => [
    message.value ? supportId : undefined,
    counter.value ? counterId : undefined,
  ].filter(Boolean).join(' ') || undefined)

  const inputAttrs = computed<TextareaInputAttrs>(() => ({
    'id': fieldId,
    'name': props.name ?? props.path,
    'placeholder': props.placeholder,
    'rows': Math.max(props.rows ?? 3, 1),
    'maxlength': props.maxlength,
    'disabled': Boolean(props.disabled),
    'readonly': Boolean(props.readonly),
    'required': Boolean(props.required),
    'autofocus': Boolean(props.autofocus),
    'autocomplete': props.autocomplete,
    'spellcheck': props.spellcheck,
    'wrap': props.wrap ?? 'soft',
    'aria-invalid': !field.meta.valid || field.isError.value ? 'true' : undefined,
    'aria-required': props.required ? 'true' : undefined,
    'aria-describedby': describedBy.value,
    'style': resize.style.value,
    'onFocus': field.onFocus,
    'onBlur': field.onBlur,
  }))

  const labelAttrs = computed<TextareaLabelAttrs>(() => ({
    id: labelId,
    for: fieldId,
  }))

  // The support line is one slot shared by helper text and the error. Only the
  // error is announced: a description the user has not asked for should not
  // interrupt them mid-sentence.
  const supportAttrs = computed<TextareaSupportAttrs>(() => ({
    id: supportId,
    role: field.isError.value ? 'alert' : undefined,
  }))

  const counterAttrs = computed<TextareaCounterAttrs>(() => ({
    'id': counterId,
    'aria-live': counter.value?.nearLimit ? 'polite' : undefined,
    'aria-atomic': counter.value?.nearLimit ? 'true' : undefined,
  }))

  watch(
    () => [model.value, props.rows, props.maxRows, props.autoGrow] as const,
    () => nextTick(resize.sync),
    { immediate: true },
  )

  return {
    fieldId,
    element,
    isFocused: computed(() => focused.value),
    isPopulated,
    isError: field.isError,
    message,
    counter,
    fieldState,
    inputAttrs,
    labelAttrs,
    supportAttrs,
    counterAttrs,
    gripAttrs: resize.gripAttrs,
    isResizing: resize.isResizing,
    hasManualHeight: resize.hasManualHeight,
    currentRows: resize.currentRows,
    reset: resize.reset,
  }
}
