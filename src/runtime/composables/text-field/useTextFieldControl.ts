/**
 * @module useTextFieldControl
 *
 * @remarks
 * Behavior layer of the single-line field. Turns a string model into
 * ready-to-spread attribute bags — `inputAttrs`, `labelAttrs`, `supportAttrs`,
 * `alertAttrs`, `prefixAttrs`, `suffixAttrs` — carrying the validation binding,
 * focus state and every ARIA relationship between the parts. It renders
 * nothing and assumes no markup: `<MTextField>` is one consumer of it, a
 * consumer's own markup is another.
 *
 * Layered the way the textarea is:
 * - `useFieldValidation` (`utils/text-field`) — the family's validity rule
 * - `useTextFieldControl` — that plus focus, ids and ARIA, markup-agnostic
 * - `<MTextField>` — one possible markup on top of this composable
 *
 * No classes and no `data-*` leave this composable. Unset attributes are left
 * out of `inputAttrs` rather than set to `undefined`, so a bag merged under it
 * (a composite's `aria-busy`, a consumer's `aria-describedby`) survives.
 *
 * @example
 * ```vue
 * <label v-bind="labelAttrs">Email</label>
 * <input v-model="value" v-bind="inputAttrs">
 * <p v-bind="supportAttrs">
 *   <span v-bind="alertAttrs">{{ isError ? message : '' }}</span>
 *   <template v-if="!isError">{{ message }}</template>
 * </p>
 * ```
 */
import { computed, useId } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useFieldValidation } from '#kit/utils/text-field/useFieldValidation'
import type { FieldMeta } from '#kit/composables/validation/types'

/**
 * The props `<MTextField>` hands over. Read inside computeds, so the
 * component's reactive props object keeps everything tracked; a plain object
 * works for markup with no component around it.
 */
export interface TextFieldControlProps {
  /** Validation-adapter path. Evaluated once at setup; absent means inert. */
  path?: string
  name?: string
  type?: string
  placeholder?: string
  helperText?: string
  errorMessage?: string
  error?: boolean
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  autofocus?: boolean
  autocomplete?: string
  prefix?: string
  suffix?: string
}

/** Attributes of the native input. Keys whose value would be unset are absent. */
export type TextFieldInputAttrs = Partial<{
  'id': string
  'type': string
  'name': string
  'placeholder': string
  'disabled': true
  'readonly': true
  'required': true
  'autofocus': true
  'autocomplete': string
  'aria-invalid': 'true'
  'aria-busy': 'true'
  'aria-required': 'true'
  'aria-describedby': string
}> & {
  onFocus: () => void
  onBlur: () => void
}

export interface TextFieldLabelAttrs {
  id: string
  for: string
}

export interface TextFieldPartAttrs {
  id: string
}

/** The persistent region the error is written into. */
export interface TextFieldAlertAttrs {
  role: 'alert'
}

export interface UseTextFieldControlReturn {
  fieldId: string
  isFocused: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  /** Support-line text: field error, then `errorMessage`, then `helperText`. */
  message: ComputedRef<string | undefined>
  /** Validation meta from the adapter (inert when there is none). */
  meta: FieldMeta<string>
  inputAttrs: ComputedRef<TextFieldInputAttrs>
  labelAttrs: ComputedRef<TextFieldLabelAttrs>
  supportAttrs: ComputedRef<TextFieldPartAttrs>
  alertAttrs: ComputedRef<TextFieldAlertAttrs>
  prefixAttrs: ComputedRef<TextFieldPartAttrs>
  suffixAttrs: ComputedRef<TextFieldPartAttrs>
}

function withoutUnset<T extends Record<string, unknown>>(bag: T): T {
  return Object.fromEntries(Object.entries(bag).filter(([, value]) => value !== undefined && value !== false)) as T
}

export function useTextFieldControl(
  model: Ref<string>,
  focused: Ref<boolean>,
  props: TextFieldControlProps,
  fieldId: string = useId() ?? 'm-text-field',
): UseTextFieldControlReturn {
  const supportId = `${fieldId}-support`
  const labelId = `${fieldId}-label`
  const prefixId = `${fieldId}-prefix`
  const suffixId = `${fieldId}-suffix`

  // The input contract is a string: a value synced back from the adapter as
  // `null` or `undefined` reaches the model as `''`.
  const stringModel = computed({
    get: () => model.value,
    set: (next) => {
      model.value = next ?? ''
    },
  })

  const { isError, message, meta } = useFieldValidation(stringModel, props)

  // The affixes are read out after the value, as part of what the field says
  // about it; the message comes first because it is what changes.
  const describedBy = computed(() => [
    message.value ? supportId : undefined,
    props.prefix ? prefixId : undefined,
    props.suffix ? suffixId : undefined,
  ].filter(Boolean).join(' ') || undefined)

  const inputAttrs = computed<TextFieldInputAttrs>(() => ({
    ...withoutUnset({
      'id': fieldId,
      'type': props.type,
      'name': props.name ?? props.path,
      'placeholder': props.placeholder,
      'disabled': props.disabled || undefined,
      'readonly': props.readonly || undefined,
      'required': props.required || undefined,
      'autofocus': props.autofocus || undefined,
      'autocomplete': props.autocomplete,
      'aria-invalid': isError.value ? 'true' : undefined,
      'aria-busy': meta.pending ? 'true' : undefined,
      'aria-required': props.required ? 'true' : undefined,
      'aria-describedby': describedBy.value,
    }),
    onFocus: () => {
      focused.value = true
    },
    onBlur: () => {
      focused.value = false
    },
  }) as TextFieldInputAttrs)

  return {
    fieldId,
    isFocused: computed(() => focused.value),
    isError,
    message,
    meta,
    inputAttrs,
    labelAttrs: computed(() => ({ id: labelId, for: fieldId })),
    // Only the error is announced: a description the user did not ask for
    // should not interrupt them mid-sentence.
    supportAttrs: computed(() => ({ id: supportId })),
    alertAttrs: computed(() => ({ role: 'alert' as const })),
    prefixAttrs: computed(() => ({ id: prefixId })),
    suffixAttrs: computed(() => ({ id: suffixId })),
  }
}
