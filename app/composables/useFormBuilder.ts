import { ref, type Ref } from 'vue'
import { useForm } from 'vee-validate'
import type { FormOptions, FormContext, FormErrors } from 'vee-validate'
import type { AnyObjectSchema, InferType } from 'yup'

// --- Types ---

export interface FormBuilderOptions<TValues extends Record<string, any>>
  extends Omit<FormOptions<TValues>, 'validationSchema' | 'initialValues'> {
  /**
   * Validation schema (e.g., yup.object())
   */
  validationSchema: any

  /**
   * Initial values for the form.
   * If not provided, they will be generated from the schema.
   */
  initialValues?: Partial<TValues> | Record<string, any>

  /**
   * Automatically parse schema to generate default empty values.
   * @default true
   */
  autoGenerateInitialValues?: boolean

  /**
   * Main submit handler. Automatically sets pending/isError states.
   */
  onSubmit?: (values: TValues) => Promise<void> | void

  /**
   * Called when onSubmit throws an error.
   */
  onError?: (error: unknown, values: TValues) => void

  /**
   * Called when validation fails before onSubmit is executed.
   */
  onValidationError?: (errors: FormErrors<TValues>) => void
}

export type FormBuilderReturn<TValues extends Record<string, any>> = FormContext<TValues> & {
  /** Reactive state indicating if the form is currently submitting */
  pending: Ref<boolean>
  /** Reactive state indicating if the last submission threw an error */
  isError: Ref<boolean>
  /** Wrapped submit handler that manages pending/isError states and calls onSubmit */
  submit: ReturnType<FormContext<TValues>['handleSubmit']>
}

// --- Utils ---

/**
 * Extracts initial empty values from a schema based on field types.
 */
export function resolveInitialValues<TValues extends Record<string, any>>(
  schema: any,
  fallbackValues: Partial<TValues> | Record<string, any> = {},
): Partial<TValues> {
  const initial: Record<string, any> = { ...fallbackValues }

  if (!schema || !schema.fields) {
    return initial as Partial<TValues>
  }

  for (const [key, field] of Object.entries(schema.fields as Record<string, any>)) {
    // Skip if value is already provided
    if (initial[key] !== undefined) {
      continue
    }

    const type = field?.type
    switch (type) {
      case 'boolean':
        initial[key] = false
        break
      case 'string':
        initial[key] = ''
        break
      case 'number':
        initial[key] = null
        break
      case 'array':
        initial[key] = []
        break
      case 'object':
        initial[key] = {}
        break
    }
  }

  return initial as Partial<TValues>
}

// --- Core ---

/**
 * Universal composable for building forms with vee-validate and yup.
 * Hides boilerplate variables and provides pending/error states.
 */
export function useFormBuilder<TValues extends Record<string, any> = Record<string, any>>(
  options: FormBuilderOptions<TValues>,
): FormBuilderReturn<TValues> {
  const pending = ref(false)
  const isError = ref(false)

  const initialValues = options.autoGenerateInitialValues !== false
    ? resolveInitialValues<TValues>(options.validationSchema, options.initialValues)
    : (options.initialValues as Partial<TValues> | undefined)

  const form = useForm<TValues>({
    ...options,
    validationSchema: options.validationSchema,
    initialValues: initialValues as any,
    keepValuesOnUnmount: options.keepValuesOnUnmount ?? false,
  })

  const submit = form.handleSubmit(
    async (values) => {
      if (!options.onSubmit) {
        return
      }

      try {
        isError.value = false
        pending.value = true

        await options.onSubmit(values as TValues)
      } catch (error) {
        isError.value = true

        if (options.onError) {
          options.onError(error, values as TValues)
        } else {
          console.error('[useFormBuilder] Form submission error:', error)
        }

        throw error // Rethrow to allow handling in the component if needed
      } finally {
        pending.value = false
      }
    },
    (ctx) => {
      if (options.onValidationError) {
        options.onValidationError(ctx.errors)
      }
    },
  )

  return {
    ...form,
    pending,
    isError,
    submit,
  }
}

// --- Factory ---

/**
 * Factory for creating complex, reusable forms with props and additional logic.
 * Useful for forms that need to encapsulate computed properties, watchers, or complex submit logic.
 *
 * @example
 * export const useMyForm = defineFormBuilder<Props, FormValues, ReturnType>((props, build) => {
 *   const form = build({ validationSchema, onSubmit: ... });
 *   const myComputed = computed(() => ...);
 *   return { ...form, myComputed };
 * });
 */
export function defineFormBuilder<TProps, TValues extends Record<string, any>, TResult>(
  setup: (
    props: TProps,
    build: (options: FormBuilderOptions<TValues>) => FormBuilderReturn<TValues>,
  ) => TResult,
) {
  return (props: TProps): TResult => {
    return setup(props, useFormBuilder)
  }
}

// --- Type Helpers ---

/**
 * Helper to infer form values type directly from a Yup schema.
 */
export type InferFormValues<TSchema extends AnyObjectSchema> = InferType<TSchema>
