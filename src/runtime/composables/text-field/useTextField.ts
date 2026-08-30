/**
 * @module useTextField
 *
 * @remarks
 * Owns the non-presentational logic of `<MTextField>`: the adapter-backed
 * field binding (via the shared {@link useField} composable), focus state, and
 * the derived error resolution that the view turns into classes / ARIA.
 *
 * The view keeps everything presentational — `fieldId`, `controlClasses`, the
 * `describedBy` wiring and the template — so the markup (and thus the
 * co-located SCSS) is untouched. Error precedence mirrors the historical
 * component behaviour exactly:
 *
 * - displayed message: field error → `props.errorMessage` → `helperText`
 * - `isError`: `props.error || !!props.errorMessage || field.hasError`
 * - `aria-invalid`: `!meta.valid || props.error || !!props.errorMessage`
 *
 * @example
 * ```ts
 * const model = defineModel<string>({ default: '' })
 * const focused = defineModel<boolean>('focused', { default: false })
 * const { errorMessage, isError, meta, onFocus, onBlur } = useTextField({
 *   path: props.path,
 *   model,
 *   focused,
 *   error: () => props.error,
 *   externalError: () => props.errorMessage,
 * })
 * ```
 */
import { computed, type ComputedRef, type Ref } from 'vue'
import { useField } from '#kit/composables/useField'
import type { FieldMeta } from '#kit/composables/validation/types'

export interface UseTextFieldOptions {
  /** vee-validate field path. Evaluated once at setup; when absent the field is inert. */
  path?: string
  /** The text-field's string model, kept in two-way sync with the field value. */
  model: Ref<string>
  /** The component-owned focus model, flipped by {@link UseTextFieldReturn.onFocus}/`onBlur`. */
  focused: Ref<boolean>
  /** Reactive accessor for the `error` prop (forces the error state on). */
  error: () => boolean
  /** Reactive accessor for the externally-provided `errorMessage` prop. */
  externalError: () => string | undefined
}

export interface UseTextFieldReturn {
  /** Resolved message to display: field error first, then the `errorMessage` prop. */
  errorMessage: ComputedRef<string | undefined>
  /** Combined error flag: `error` prop, external `errorMessage`, or a field error. */
  isError: ComputedRef<boolean>
  /** vee-validate meta (drives `aria-invalid` via `meta.valid`). */
  meta: FieldMeta<string>
  /** Focus handler — sets the `focused` model to `true`. */
  onFocus: () => void
  /** Blur handler — sets the `focused` model to `false`. */
  onBlur: () => void
}

/**
 * Bridges the text-field's models to a `vee-validate` field and exposes the
 * derived error/focus primitives the view composes into classes and ARIA.
 */
export function useTextField(options: UseTextFieldOptions): UseTextFieldReturn {
  const { path, model, focused, error, externalError } = options

  // Coerce synced field values to a string (the input contract) without
  // mutating the shared `useField` composable.
  const stringModel = computed({
    get: () => model.value,
    set: (next) => {
      model.value = next ?? ''
    },
  })

  const field = useField({ path, model: stringModel })

  const errorMessage = computed(() => field.errorMessage.value || externalError())
  const isError = computed(() => error() || Boolean(externalError()) || field.hasError.value)

  const onFocus = () => {
    focused.value = true
  }

  const onBlur = () => {
    focused.value = false
  }

  return {
    errorMessage,
    isError,
    meta: field.meta,
    onFocus,
    onBlur,
  }
}
