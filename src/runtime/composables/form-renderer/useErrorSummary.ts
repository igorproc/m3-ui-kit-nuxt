import { nextTick, shallowRef } from 'vue'
import type { ComponentPublicInstance, ShallowRef } from 'vue'
import type { FormFieldConfig } from '#kit/composables/useFormSchema'

export interface FormSummaryEntry {
  name: string
  label: string
  message: string
  href: string
}

type FieldRef = (target: Element | ComponentPublicInstance | null) => void

export interface UseErrorSummaryReturn {
  /** The failing fields of the last submit, in config order; empty when it passed. */
  entries: Readonly<ShallowRef<FormSummaryEntry[]>>
  /** A function ref for the field `name`: binds its root element. */
  fieldRef: (name: string) => FieldRef
  /** Lists the messages and, once the summary is drawn, calls `focusSummary`. */
  show: (errors: Record<string, string | undefined>) => void
  clear: () => void
  /** Focuses the control of the field `name`. */
  focusField: (name: string) => void
}

const CONTROL = 'input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]'

const rootOf = (target: Element | ComponentPublicInstance | null): Element | null => {
  const node = target && '$el' in target ? target.$el as Element | CharacterData | null : target
  if (!node) return null
  return node.nodeType === 1 ? node as Element : node.nextElementSibling
}

export function useErrorSummary(fields: readonly FormFieldConfig[], focusSummary: () => void): UseErrorSummaryReturn {
  const roots = new Map<string, Element>()
  const refs = new Map<string, FieldRef>()
  const entries = shallowRef<FormSummaryEntry[]>([])

  const controlOf = (name: string) => roots.get(name)?.querySelector<HTMLElement>(CONTROL) ?? null

  function fieldRef(name: string) {
    let bound = refs.get(name)
    if (!bound) {
      bound = (target) => {
        const root = rootOf(target)
        if (root) roots.set(name, root)
        else roots.delete(name)
      }
      refs.set(name, bound)
    }
    return bound
  }

  function show(errors: Record<string, string | undefined>) {
    entries.value = fields
      .filter(field => errors[field.name])
      .map(field => ({
        name: field.name,
        label: field.label ?? field.name,
        message: errors[field.name]!,
        href: `#${controlOf(field.name)?.id ?? ''}`,
      }))
    if (entries.value.length) nextTick(focusSummary)
  }

  return {
    entries,
    fieldRef,
    show,
    clear: () => {
      entries.value = []
    },
    focusField: name => controlOf(name)?.focus(),
  }
}
