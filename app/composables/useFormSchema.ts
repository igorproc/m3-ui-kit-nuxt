/**
 * @module useFormSchema
 *
 * @remarks
 * Config-driven form generation. Consumers describe fields declaratively (a
 * {@link FormSchemaConfig}) using a small {@link FieldRules} descriptor rather
 * than raw yup. `useFormSchema` maps the descriptor to a yup object schema,
 * derives type-appropriate initial values, and wires everything through the
 * existing {@link useFormBuilder}. The returned `fields` are the normalized
 * config that `<MFormRenderer>` iterates to render leaves.
 *
 * @example
 * ```ts
 * const { schema, form, fields } = useFormSchema(
 *   [{ type: 'text', name: 'email', rules: { required: true, email: true } }],
 *   { onSubmit: save },
 * )
 * ```
 */
import * as yup from 'yup'
import type { AnyObjectSchema, AnySchema } from 'yup'
import { useFormBuilder, type FormBuilderReturn } from '~/composables/useFormBuilder'
import { isString, isUndefined } from '~~/shared/utils/guards'

export interface FieldRules {
  /** Mark the field as required. A string is used as the custom message. */
  required?: boolean | string
  /** Minimum length (strings) or minimum value (numbers). */
  min?: number
  /** Maximum length (strings) or maximum value (numbers). */
  max?: number
  /** Validate as an email address (string fields only). */
  email?: boolean
  /** Regex source matched against the value (string fields only). */
  pattern?: string
}

export type FormFieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'switch' | 'radio' | 'search'

export interface FormFieldConfig {
  type: FormFieldType
  /** vee-validate path / schema key. */
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
  /** Submit handler forwarded to {@link useFormBuilder}. */
  onSubmit?: (values: TValues) => Promise<void> | void
}

export interface UseFormSchemaReturn<TValues extends Record<string, unknown>> {
  /** The generated yup object schema. */
  schema: AnyObjectSchema
  /** The underlying form context from {@link useFormBuilder}. */
  form: FormBuilderReturn<TValues>
  /** The normalized field config, ready to render. */
  fields: FormFieldConfig[]
}

const STRING_TYPES: FormFieldType[] = ['text', 'textarea', 'search']
const BOOLEAN_TYPES: FormFieldType[] = ['checkbox', 'switch']

/** Resolves the base yup schema for a field type before rules are applied. */
function baseSchemaFor(field: FormFieldConfig): AnySchema {
  if (field.type === 'number') {
    return yup.number()
  }

  if (BOOLEAN_TYPES.includes(field.type)) {
    return yup.boolean()
  }

  if (field.type === 'radio') {
    const values = (field.options ?? []).map(option => option.value)

    return values.length > 0 ? yup.mixed().oneOf(values) : yup.mixed()
  }

  return yup.string()
}

/** Applies a {@link FieldRules} descriptor onto a base schema, defensively. */
function applyRules(schema: AnySchema, field: FormFieldConfig): AnySchema {
  const rules = field.rules

  if (!rules) {
    return schema
  }

  let next = schema

  if (rules.required) {
    const message = isString(rules.required) ? rules.required : undefined
    next = next.required(message)
  }

  const isStringField = STRING_TYPES.includes(field.type)
  const isNumberField = field.type === 'number'

  if (!isUndefined(rules.min) && (isStringField || isNumberField)) {
    next = (next as yup.StringSchema | yup.NumberSchema).min(rules.min)
  }

  if (!isUndefined(rules.max) && (isStringField || isNumberField)) {
    next = (next as yup.StringSchema | yup.NumberSchema).max(rules.max)
  }

  if (isStringField) {
    const stringSchema = next as yup.StringSchema

    next = rules.email ? stringSchema.email() : stringSchema

    if (!isUndefined(rules.pattern)) {
      next = (next as yup.StringSchema).matches(new RegExp(rules.pattern))
    }
  }

  return next
}

/** Type-appropriate empty value when a field declares no `default`. */
function emptyValueFor(field: FormFieldConfig): unknown {
  if (field.type === 'number') {
    return null
  }

  if (BOOLEAN_TYPES.includes(field.type)) {
    return false
  }

  if (field.type === 'radio') {
    return undefined
  }

  return ''
}

/**
 * Builds a yup schema + form from a declarative field config.
 */
export function useFormSchema<TValues extends Record<string, unknown> = Record<string, unknown>>(
  config: FormSchemaConfig,
  options: UseFormSchemaOptions<TValues> = {},
): UseFormSchemaReturn<TValues> {
  const fields = [...config]

  const shape: Record<string, AnySchema> = {}
  const initialValues: Record<string, unknown> = {}

  for (const field of fields) {
    shape[field.name] = applyRules(baseSchemaFor(field), field)
    initialValues[field.name] = isUndefined(field.default) ? emptyValueFor(field) : field.default
  }

  const schema = yup.object(shape) as AnyObjectSchema

  const form = useFormBuilder<TValues>({
    validationSchema: schema,
    initialValues: initialValues as Partial<TValues>,
    onSubmit: options.onSubmit,
  })

  return {
    schema,
    form,
    fields,
  }
}
