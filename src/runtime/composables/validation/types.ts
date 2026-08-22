/**
 * @module validation/types
 *
 * @remarks
 * The dependency-free contract that decouples the kit from any concrete
 * validation library. A {@link ValidationAdapter} is the single seam a consumer
 * implements (or picks a prebuilt one for) to power both layers of the kit's
 * validation story:
 *
 * - the field **autopilot** — the `path` prop on inputs, wired through
 *   {@link ValidationAdapter.bindField};
 * - **declarative forms** — `<MFormRenderer>` / `useFormSchema`, wired through
 *   {@link ValidationAdapter.createForm}.
 *
 * Nothing here imports `vee-validate`, `yup`, or any other engine — the kit core
 * depends only on these shapes, and adapters live behind the `./validation`
 * entry point so their engines are pay-for-what-you-use.
 */
import type { Ref } from 'vue'

/**
 * Field validation meta, mirroring the subset of `vee-validate`'s `FieldMeta`
 * the kit actually reads. Owned by the kit so components never type against a
 * concrete engine.
 */
export interface FieldMeta<T = unknown> {
  required: boolean
  touched: boolean
  dirty: boolean
  valid: boolean
  validated: boolean
  pending: boolean
  initialValue?: T
}

/** A single field's live binding to the active validation context. */
export interface FieldBinding<T = unknown> {
  /** Two-way field value the kit keeps in sync with the component model. */
  value: Ref<T>
  /** Current error message (undefined when valid). */
  errorMessage: Readonly<Ref<string | undefined>>
  /** Reactive meta driving `aria-invalid` and error classes. */
  meta: FieldMeta<T>
}

/** Options forwarded to {@link ValidationAdapter.bindField}. */
export interface BindFieldOptions {
  /** Re-validate on every value update. @default true */
  validateOnValueUpdate?: boolean
}

/**
 * A declarative validation rule set. Engine-agnostic: each adapter compiles
 * these into its own schema (yup object, zod schema, hand-rolled checks…).
 */
export interface FieldRules {
  /** Mark the field required. A string is used as the custom message. */
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

/** The semantic value kind of a field, used by adapters to pick a base schema. */
export type FieldKind = 'string' | 'number' | 'boolean' | 'enum'

/**
 * Engine-agnostic description of one form field, handed to
 * {@link ValidationAdapter.createForm}.
 */
export interface FieldDescriptor {
  /** Field path / schema key. */
  name: string
  /** Semantic value kind used to choose the base validator. */
  kind: FieldKind
  /** Declarative rules to compile onto the base validator. */
  rules?: FieldRules
  /** Allowed values for `enum` fields. */
  options?: readonly (string | number)[]
}

/** Config handed to {@link ValidationAdapter.createForm}. */
export interface CreateFormConfig<TValues extends Record<string, unknown> = Record<string, unknown>> {
  /** The form's fields, already normalized to engine-agnostic descriptors. */
  fields: FieldDescriptor[]
  /** Initial values keyed by field name. */
  initialValues?: Partial<TValues>
  /** Submit handler, invoked with validated values. */
  onSubmit?: (values: TValues) => Promise<void> | void
  /** Called when `onSubmit` throws. */
  onError?: (error: unknown, values: TValues) => void
  /** Called when validation fails before submit. */
  onValidationError?: (errors: Record<string, string | undefined>) => void
}

/** The live form handle returned by {@link ValidationAdapter.createForm}. */
export interface FormBinding<TValues extends Record<string, unknown> = Record<string, unknown>> {
  /** Submit handler for `@submit.prevent` — validates then calls `onSubmit`. */
  submit: (event?: Event) => Promise<void> | void
  /** `true` while `onSubmit` is in-flight. */
  pending: Ref<boolean>
  /** `true` when the last submission threw. */
  isError: Ref<boolean>
  /** Reactive current form values. */
  values: Readonly<Ref<TValues>>
  /** Reset values and validation state to initial. */
  reset: () => void
}

/**
 * The contract a validation engine implements to plug into the kit. A single
 * adapter owns both seams: `bindField` (the `path` autopilot on inputs) and
 * `createForm` (declarative forms). Both run during a component's `setup`, so an
 * adapter may freely `provide`/`inject` its own private form context to bridge
 * the two.
 */
export interface ValidationAdapter {
  /**
   * Bind a single field by `path` to the active form context. Called from an
   * input component's `setup`; the returned `value` ref is kept in two-way sync
   * with the component model by the kit.
   */
  bindField: <T>(path: string, options?: BindFieldOptions) => FieldBinding<T>
  /**
   * Create a form from engine-agnostic field descriptors. Called from a form
   * component's `setup`; implementations must establish whatever context
   * {@link ValidationAdapter.bindField} reads for descendant fields.
   */
  createForm: <TValues extends Record<string, unknown>>(
    config: CreateFormConfig<TValues>,
  ) => FormBinding<TValues>
}
