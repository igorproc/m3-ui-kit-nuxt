import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useField } from '#kit/composables/useField'
import type { FieldMeta } from '#kit/composables/validation/types'

/** The props every field of the family hands over for its validity. */
export interface FieldValidationProps {
  /** Validation-adapter path. Evaluated once at setup; absent means inert. */
  path?: string
  /** Forces the error state on, with or without a message. */
  error?: boolean
  errorMessage?: string
  helperText?: string
}

export interface FieldValidation<T> {
  /** Shown to the user: the `error` prop, an `errorMessage`, or an adapter error. */
  isError: ComputedRef<boolean>
  /** The support line: the adapter's error, then `errorMessage`, then `helperText`. */
  message: ComputedRef<string | undefined>
  /** Validation meta from the adapter (inert when there is none). */
  meta: FieldMeta<T>
}

/**
 * The one rule for a field's validity, shared by the text field, the textarea
 * and the number input: what counts as an error, and what the support line
 * says. Internal — the control composables are the public layer.
 *
 * @param model The field's model, kept in two-way sync with the adapter's value.
 * @param props The field's props, read inside computeds so they stay tracked.
 */
export function useFieldValidation<T>(model: Ref<T>, props: FieldValidationProps): FieldValidation<T> {
  const field = useField({ path: props.path, model })

  return {
    isError: computed(() => Boolean(props.error) || Boolean(props.errorMessage) || field.hasError.value),
    message: computed(() => field.errorMessage.value || props.errorMessage || props.helperText),
    meta: field.meta,
  }
}
