/**
 * @module useField
 *
 * @remarks
 * The field **autopilot**: consolidates the repeated wiring that input
 * components (`MTextField`, `MCheckbox`, `MRadio`, …) each duplicated — a `path`
 * prop, a two-way `watch` syncing the component's `defineModel` ref with the
 * field value, and an exposed `errorMessage`.
 *
 * Engine-agnostic: the actual field binding is delegated to the injected
 * {@link ValidationAdapter} (see {@link injectValidationAdapter}). The field is
 * inert — `errorMessage` stays `undefined`, `hasError` is always `false`, no
 * validation runs — whenever **either** `path` is absent **or** no adapter has
 * been provided. So an app that never calls `provideValidationAdapter` ships no
 * validation engine, and inputs behave as plain controlled components.
 *
 * @example
 * ```ts
 * const model = defineModel<string>({ default: '' })
 * const { errorMessage, hasError, meta } = useField({ path: props.path, model })
 * ```
 */
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { injectValidationAdapter } from '#kit/composables/validation/context'
import type { FieldMeta } from '#kit/composables/validation/types'
import { isUndefined } from '#kit/shared/utils/guards/guards'

export interface UseFieldOptions<T> {
  /** Field path. Evaluated once at setup; when absent the field is inert. */
  path?: string
  /** The component's model ref to keep in two-way sync with the field value. */
  model: Ref<T>
  /** Forward validation-on-input. @default true */
  validateOnValueUpdate?: boolean
}

export interface UseFieldReturn<T> {
  /** Validation error message for this field (undefined when valid or inert). */
  errorMessage: Readonly<Ref<string | undefined>>
  /** Whether the field currently has an error. */
  hasError: ComputedRef<boolean>
  /** Field meta (valid/touched/dirty…) or an inert default when the field is inert. */
  meta: FieldMeta<T>
}

/** Inert, always-valid meta used when the field is not bound to an adapter. */
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
 * Bridges a component's `defineModel` ref to the injected validation adapter.
 */
export function useField<T>(options: UseFieldOptions<T>): UseFieldReturn<T> {
  const { path, model, validateOnValueUpdate = true } = options

  const errorMessage = ref<string | undefined>()

  const adapter = injectValidationAdapter()

  if (isUndefined(path) || !adapter) {
    return {
      errorMessage,
      hasError: computed(() => false),
      meta: createInertMeta<T>(),
    }
  }

  const field = adapter.bindField<T>(path, { validateOnValueUpdate })
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
