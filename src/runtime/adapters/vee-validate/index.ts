/**
 * @module adapters/vee-validate
 *
 * @remarks
 * The prebuilt `vee-validate` + `yup` {@link ValidationAdapter}, plus the whole
 * validation public surface, exposed through the `@pr0s1k/primetime-kit/validation`
 * entry point. Install it once, high in the tree:
 *
 * ```ts
 * import { provideValidationAdapter, veeValidateAdapter } from '@pr0s1k/primetime-kit/validation'
 * provideValidationAdapter(veeValidateAdapter())
 * ```
 *
 * `vee-validate` and `yup` are optional peer dependencies — importing from here
 * is what pulls them into the bundle. Apps that never import this module ship no
 * validation engine.
 */
import { computed, type Ref } from 'vue'
import { useField as useVeeField } from 'vee-validate'
import { buildYupSchema } from './schema'
import { useFormBuilder } from './useFormBuilder'
import type {
  CreateFormConfig,
  FieldBinding,
  FieldMeta,
  FormBinding,
  ValidationAdapter,
} from '#kit/composables/validation/types'

/** Creates the `vee-validate` + `yup` validation adapter. */
export function veeValidateAdapter(): ValidationAdapter {
  return {
    bindField<T>(path: string, options): FieldBinding<T> {
      const field = useVeeField<T>(() => path, undefined, {
        validateOnValueUpdate: options?.validateOnValueUpdate ?? true,
      })

      return {
        value: field.value as Ref<T>,
        errorMessage: field.errorMessage,
        meta: field.meta as FieldMeta<T>,
      }
    },

    createForm<TValues extends Record<string, unknown>>(
      config: CreateFormConfig<TValues>,
    ): FormBinding<TValues> {
      const form = useFormBuilder<TValues>({
        validationSchema: buildYupSchema(config.fields),
        initialValues: config.initialValues,
        onSubmit: config.onSubmit,
        onError: config.onError,
        onValidationError: config.onValidationError
          ? errors => config.onValidationError!(errors as Record<string, string | undefined>)
          : undefined,
      })

      return {
        submit: form.submit,
        pending: form.pending,
        isError: form.isError,
        values: computed(() => form.values as TValues),
        reset: () => form.resetForm(),
      }
    },
  }
}

// The full validation public surface, re-exported so custom-adapter authors can
// import everything from a single `@pr0s1k/primetime-kit/validation` entry.
export {
  provideValidationAdapter,
  injectValidationAdapter,
  VALIDATION_ADAPTER_KEY,
} from '#kit/composables/validation/context'

export type {
  ValidationAdapter,
  FieldBinding,
  FieldMeta,
  FieldRules,
  FieldKind,
  FieldDescriptor,
  BindFieldOptions,
  CreateFormConfig,
  FormBinding,
} from '#kit/composables/validation/types'

export {
  useFormBuilder,
  defineFormBuilder,
  resolveInitialValues,
  type FormBuilderOptions,
  type FormBuilderReturn,
  type InferFormValues,
} from './useFormBuilder'

export { buildYupSchema } from './schema'
