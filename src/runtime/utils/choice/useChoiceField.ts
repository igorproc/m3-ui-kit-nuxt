import { useAttrs, useId } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { FieldMeta } from '#kit/composables/validation/types'
import { useFieldValidation } from '#kit/utils/text-field/useFieldValidation'
import type { FieldValidationProps } from '#kit/utils/text-field/useFieldValidation'
import { useSupportLine } from '#kit/utils/text-field/supportLine'
import type { SupportLineSlots } from '#kit/utils/text-field/supportLine'

/** The props a checkbox, a switch or a radio hands over for its field role. */
export interface ChoiceFieldProps extends FieldValidationProps {
  /** The native `name`; falls back to `path`. */
  name?: string
  /** Reserves the support line: a required control can be told why it is invalid. */
  required?: boolean
}

export interface ChoiceInputAttrs {
  'id': string
  'name': string | undefined
  'aria-invalid': 'true' | undefined
  'aria-busy': 'true' | undefined
  'aria-describedby': string | undefined
}

export interface UseChoiceFieldReturn<T> {
  /** The error state shown to the user (prop, message or adapter error). */
  isError: ComputedRef<boolean>
  /** The support line's text: adapter error, then `errorMessage`, then `helperText`. */
  message: ComputedRef<string | undefined>
  meta: FieldMeta<T>
  /** Whether the support line is rendered at all (owner's rule 2026-10-19). */
  hasSupport: () => boolean
  /** The support line's id, the target of the control's `aria-describedby`. */
  supportId: () => string
  /** Spread onto the native control, after the consumer's fallthrough attrs. */
  inputAttrs: () => ChoiceInputAttrs
}

/**
 * The field role shared by `MCheckbox`, `MSwitch` and `MRadio`: validity and
 * the support line by the field family's rules (`useFieldValidation`,
 * `useSupportLine`), plus the native control's id, name and ARIA links.
 *
 * A consumer's `id` names the control instead of the generated one, and a
 * consumer's `aria-describedby` is kept in front of the support line's id.
 * Readers are functions: fallthrough attributes are current on every render
 * but not reactive, so the template calls them.
 *
 * Must be created in `setup`. Internal to the selection family.
 *
 * @param model The control's model, kept in two-way sync with the adapter field.
 * @param props The control's props; `path` binds the adapter unless `bindPath` is false.
 * @param slots The `helper` / `error` slots that can fill the support line.
 * @param bindPath A grouped radio leaves its value to the group: no field of its own.
 */
export function useChoiceField<T>(
  model: Ref<T>,
  props: ChoiceFieldProps,
  slots: SupportLineSlots,
  bindPath = true,
): UseChoiceFieldReturn<T> {
  const attrs = useAttrs()
  const generatedId = useId()

  const validationProps: FieldValidationProps = {
    get path() { return bindPath ? props.path : undefined },
    get error() { return props.error },
    get errorMessage() { return props.errorMessage },
    get helperText() { return props.helperText },
  }

  const { isError, message, meta } = useFieldValidation(model, validationProps)
  const hasSupport = useSupportLine({
    get path() { return validationProps.path },
    get helperText() { return props.helperText },
    get required() { return props.required },
  }, slots)

  const controlId = () => (attrs.id as string | undefined) || generatedId
  const supportId = () => `${controlId()}-support`

  const describedBy = () => [
    attrs['aria-describedby'] as string | undefined,
    hasSupport() && (message.value || slots.helper || (isError.value && slots.error)) ? supportId() : undefined,
  ].filter(Boolean).join(' ') || undefined

  const inputAttrs = (): ChoiceInputAttrs => ({
    'id': controlId(),
    'name': props.name ?? props.path,
    'aria-invalid': isError.value ? 'true' : undefined,
    'aria-busy': meta.pending ? 'true' : undefined,
    'aria-describedby': describedBy(),
  })

  return {
    isError,
    message,
    meta,
    hasSupport,
    supportId,
    inputAttrs,
  }
}
