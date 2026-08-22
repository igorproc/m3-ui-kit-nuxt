/**
 * @module useFormSchema
 *
 * @remarks
 * Config-driven form generation. Consumers describe fields declaratively (a
 * {@link FormSchemaConfig}) using a small {@link FieldRules} descriptor. This
 * composable normalizes that config into engine-agnostic
 * {@link FieldDescriptor}s and hands them to the injected
 * {@link ValidationAdapter} via `createForm` — so it references no concrete
 * validation library (no `yup`). The returned `fields` are the normalized config
 * that `<MFormRenderer>` iterates to render leaves.
 *
 * Requires an adapter to be installed (see {@link provideValidationAdapter});
 * without one it throws, since a form cannot be built without a validation
 * engine.
 *
 * @example
 * ```ts
 * const { form, fields } = useFormSchema(
 *   [{ type: 'text', name: 'email', rules: { required: true, email: true } }],
 *   { onSubmit: save },
 * )
 * ```
 */
import { injectValidationAdapter } from '#kit/composables/validation/context'
import type {
  FieldDescriptor,
  FieldKind,
  FieldRules,
  FormBinding,
} from '#kit/composables/validation/types'
import { isUndefined } from '#kit/shared/utils/guards'

export type FormFieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'switch' | 'radio' | 'search'

export interface FormFieldConfig {
  type: FormFieldType
  /** Field path / schema key. */
  name: string
  label?: string
  placeholder?: string
  rules?: FieldRules
  /** Options for `radio` (and other choice-based) fields. */
  options?: { label: string, value: string | number }[]
  default?: unknown
  /** Passthrough props forwarded to the rendered input. */
  props?: Record<string, unknown>
}

export type FormSchemaConfig = FormFieldConfig[]

export interface UseFormSchemaOptions<TValues extends Record<string, unknown>> {
  /** Submit handler forwarded to the adapter. */
  onSubmit?: (values: TValues) => Promise<void> | void
}

export interface UseFormSchemaReturn<TValues extends Record<string, unknown>> {
  /** The adapter-backed form handle. */
  form: FormBinding<TValues>
  /** The normalized field config, ready to render. */
  fields: FormFieldConfig[]
}

const STRING_TYPES: FormFieldType[] = ['text', 'textarea', 'search']
const BOOLEAN_TYPES: FormFieldType[] = ['checkbox', 'switch']

/** Maps a UI field type to its engine-agnostic value kind. */
function kindFor(type: FormFieldType): FieldKind {
  if (type === 'number') {
    return 'number'
  }

  if (BOOLEAN_TYPES.includes(type)) {
    return 'boolean'
  }

  if (type === 'radio') {
    return 'enum'
  }

  return 'string'
}

/** Type-appropriate empty value when a field declares no `default`. */
function emptyValueFor(type: FormFieldType): unknown {
  if (type === 'number') {
    return null
  }

  if (BOOLEAN_TYPES.includes(type)) {
    return false
  }

  if (type === 'radio') {
    return undefined
  }

  return ''
}

/** Normalizes a UI field config into an engine-agnostic descriptor. */
function toDescriptor(field: FormFieldConfig): FieldDescriptor {
  const descriptor: FieldDescriptor = {
    name: field.name,
    kind: kindFor(field.type),
    rules: field.rules,
  }

  if (field.type === 'radio' && field.options) {
    descriptor.options = field.options.map(option => option.value)
  }

  return descriptor
}

/**
 * Builds an adapter-backed form from a declarative field config.
 */
export function useFormSchema<TValues extends Record<string, unknown> = Record<string, unknown>>(
  config: FormSchemaConfig,
  options: UseFormSchemaOptions<TValues> = {},
): UseFormSchemaReturn<TValues> {
  const adapter = injectValidationAdapter()

  if (!adapter) {
    throw new Error(
      '[primetime-kit] useFormSchema requires a validation adapter. '
      + 'Install one with provideValidationAdapter(), e.g. '
      + 'provideValidationAdapter(veeValidateAdapter()) from "@pr0s1k/primetime-kit/validation".',
    )
  }

  const fields = [...config]

  const descriptors: FieldDescriptor[] = []
  const initialValues: Record<string, unknown> = {}

  for (const field of fields) {
    descriptors.push(toDescriptor(field))
    initialValues[field.name] = isUndefined(field.default) ? emptyValueFor(field.type) : field.default
  }

  const form = adapter.createForm<TValues>({
    fields: descriptors,
    initialValues: initialValues as Partial<TValues>,
    onSubmit: options.onSubmit,
  })

  return {
    form,
    fields,
  }
}
