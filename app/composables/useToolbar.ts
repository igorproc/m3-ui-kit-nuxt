/**
 * @module useToolbar
 *
 * @remarks
 * Headless selection logic for `<MToolbar>`. M3 toolbars are action containers,
 * so selection is **opt-in**: the orchestrator only builds a selection instance
 * when a `v-model` is bound. Single mode uses `createSingle({ mandatory: false })`,
 * multiple mode uses `createGroup()`. The orchestrator provides the resulting
 * context (namespace `m3:toolbar`, `null` default — children render fine without
 * a model bound) so future slotted `<MToolbarItem>`s can register and reflect the
 * active value(s).
 */
import { computed, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import { createContext } from '~~/shared/utils/createContext'
import { createSingle } from '~/composables/registry/createSingle'
import { createGroup } from '~/composables/registry/createGroup'
import type { ID } from '~~/shared/types/registry'

/** Value a toolbar item carries in the selection registry. */
export type ToolbarValue = string | number

export interface ToolbarContext {
  /** Whether multi-select is active. */
  multiple: ComputedRef<boolean>
  /** Register a toolbar item ticket. */
  register: (ticket: { value: ToolbarValue, disabled?: MaybeRefOrGetter<boolean> }) => { id: ID, isSelected: Readonly<Ref<boolean>> }
  /** Unregister a ticket by id. */
  unregister: (id: ID) => void
  /** Select / toggle a ticket by id (respects single vs multiple). */
  toggle: (id: ID) => void
  /** Whether a value is currently selected. */
  isSelected: (value: ToolbarValue) => boolean
}

export const [useToolbarContext, provideToolbarContext] = createContext<ToolbarContext | null>('m3:toolbar', null)

/** A model that is `ToolbarValue` in single mode, `ToolbarValue[]` in multiple. */
export type ToolbarModel = ToolbarValue | ToolbarValue[] | null | undefined

export interface UseToolbarOptions {
  multiple: MaybeRefOrGetter<boolean>
}

/**
 * Builds a registry-backed selection bound to `model` and the matching context.
 * Single mode → `createSingle`, multiple mode → `createGroup`. The `multiple`
 * flavour is fixed at setup time (mirrors how the registry chain is chosen).
 */
export function useToolbar(model: Ref<ToolbarModel>, options: UseToolbarOptions): ToolbarContext {
  const multiple = computed(() => toValue(options.multiple))

  if (multiple.value) {
    const sel = createGroup<{ value: ToolbarValue }>()

    watch(
      [() => model.value, () => sel.size],
      ([v]) => {
        const next = Array.isArray(v) ? v : []
        sel.apply(next)
      },
      { immediate: true },
    )

    watch(() => Array.from(sel.selectedValues.value), (v) => {
      const current = Array.isArray(model.value) ? model.value : []
      if (v.length !== current.length || v.some((x, i) => x !== current[i])) {
        model.value = v
      }
    })

    return {
      multiple,
      register: ticket => sel.register(ticket),
      unregister: id => sel.unregister(id),
      toggle: id => sel.toggle(id),
      isSelected: value => Array.from(sel.selectedValues.value).includes(value),
    }
  }

  const sel = createSingle<{ value: ToolbarValue }>({ mandatory: false })

  watch(
    [() => model.value, () => sel.size],
    ([v]) => {
      if (v === null || v === undefined || Array.isArray(v)) {
        if (sel.selectedValue.value !== undefined) sel.apply([])
        return
      }
      if (sel.selectedValue.value !== v) sel.apply([v])
    },
    { immediate: true },
  )

  watch(sel.selectedValue, (v) => {
    if (v !== model.value) model.value = (v ?? null) as ToolbarModel
  })

  return {
    multiple,
    register: ticket => sel.register(ticket),
    unregister: id => sel.unregister(id),
    toggle: id => sel.toggle(id),
    isSelected: value => sel.selectedValue.value === value,
  }
}
