/**
 * @module adapters/vee-validate/schema
 *
 * @remarks
 * Compiles the kit's engine-agnostic {@link FieldDescriptor}s into a `yup`
 * object schema. This is the only place `yup` is referenced — it lives behind
 * the `./validation` entry point, so the kit core never pulls it in.
 */
import * as yup from 'yup'
import type { AnyObjectSchema, AnySchema } from 'yup'
import type { FieldDescriptor } from '#kit/composables/validation/types'
import { isString, isUndefined } from '#kit/shared/utils/guards/guards'

/** Resolves the base yup schema for a field kind before rules are applied. */
function baseSchemaFor(field: FieldDescriptor): AnySchema {
  if (field.kind === 'number') {
    return yup.number()
  }

  if (field.kind === 'boolean') {
    return yup.boolean()
  }

  if (field.kind === 'enum') {
    const values = field.options ?? []

    return values.length > 0 ? yup.mixed().oneOf([...values]) : yup.mixed()
  }

  return yup.string()
}

/** Applies a {@link FieldRules} descriptor onto a base schema, defensively. */
function applyRules(schema: AnySchema, field: FieldDescriptor): AnySchema {
  const rules = field.rules

  if (!rules) {
    return schema
  }

  let next = schema

  if (rules.required) {
    const message = isString(rules.required) ? rules.required : undefined
    next = next.required(message)
  }

  const isStringField = field.kind === 'string'
  const isNumberField = field.kind === 'number'

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

/** Builds a yup object schema from engine-agnostic field descriptors. */
export function buildYupSchema(fields: FieldDescriptor[]): AnyObjectSchema {
  const shape: Record<string, AnySchema> = {}

  for (const field of fields) {
    shape[field.name] = applyRules(baseSchemaFor(field), field)
  }

  return yup.object(shape) as AnyObjectSchema
}
