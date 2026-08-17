/**
 * @module useField
 *
 * @remarks
 * Consolidates the repeated `vee-validate` wiring that input components
 * (`MTextField`, `MCheckbox`, `MRadio`, …) each duplicated: a `path` prop, a
 * conditional `useField` call, a two-way `watch` syncing the component's
 * `defineModel` ref with the field value, and an exposed `errorMessage`.
 *
 * The `path` is read **once at setup** (matching the existing component
 * behaviour). When `path` is absent the field is inert: `errorMessage` stays
 * `undefined`, `hasError` is always `false`, and no validation runs. SSR-safe —
 * `vee-validate` is only touched when a `path` is provided.
 *
 * @example
 * ```ts
 * const model = defineModel<string>({ default: '' })
 * const { errorMessage, hasError, meta } = useField({ path: props.path, model })
 * ```
 */
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useField as useVeeField } from 'vee-validate'
import type { FieldMeta } from 'vee-validate'
import { isUndefined } from '#kit/shared/utils/guards'

export interface UseFieldOptions<T> {
  /** vee-validate field path. Evaluated once at setup; when absent the field is inert. */
  path?: string
  /** The component's model ref to keep in two-way sync with the vee-validate field. */
  model: Ref<T>
  /** Forward validation-on-input. @default true */
  validateOnValueUpdate?: boolean
}

export interface UseFieldReturn<T> {
  /** Validation error message for this field (undefined when valid or path absent). */
  errorMessage: Readonly<Ref<string | undefined>>
  /** Whether the field currently has an error. */
  hasError: ComputedRef<boolean>
  /** vee-validate meta (valid/touched/dirty…) or an inert default when path absent. */
  meta: FieldMeta<T>
}

/** Inert, always-valid meta used when no `path` is provided. */
function createInertMeta<T>(): FieldMeta<T> {
  return {
    required: false,
    touched: false,
    dirty: false,
    valid: true,
    validated: false,
    pending: false,
    initialValue: undefined,
  }
}

/**
 * Bridges a component's `defineModel` ref to a `vee-validate` field.
 */
export function useField<T>(options: UseFieldOptions<T>): UseFieldReturn<T> {
  const { path, model, validateOnValueUpdate = true } = options

  const errorMessage = ref<string | undefined>()

  if (isUndefined(path)) {
    return {
      errorMessage,
      hasError: computed(() => false),
      meta: createInertMeta<T>(),
    }
  }

  const field = useVeeField<T>(() => path, undefined, { validateOnValueUpdate })
  const { value, errorMessage: fieldError } = field

  watch(
    value,
    (next) => {
      model.value = next
    },
    { immediate: true },
  )

  watch(
    model,
    (next) => {
      value.value = next
    },
  )

  watch(
    fieldError,
    (next) => {
      errorMessage.value = next || undefined
    },
    { immediate: true },
  )

  return {
    errorMessage,
    hasError: computed(() => Boolean(errorMessage.value)),
    meta: field.meta,
  }
}
