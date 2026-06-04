/**
 * @module useRadioGroup
 *
 * @remarks
 * Optional per-instance context pair for `<MRadioGroup>`. `<MRadio>` injects it
 * with a `null` default so the radio keeps working standalone (the form-renderer
 * relies on the standalone path). When a group ancestor is present, the radio
 * registers in the group's `createSingle` instance and reads its shared `name`.
 * Namespace: `m3:radio-group`.
 */
import type { ComputedRef } from 'vue'
import { createContext } from '~~/shared/utils/createContext'
import type { SingleContext } from '~/composables/registry/createSingle'

export type RadioValue = string | number

export interface RadioGroupContext {
  /** Shared `name` for every radio input in the group. */
  name: ComputedRef<string>
  /** Whether the whole group is disabled. */
  disabled: ComputedRef<boolean>
  /** Resolved value of the checked radio. */
  selectedValue: ComputedRef<RadioValue | undefined>
  /** Register a radio ticket in the single-selection instance. */
  register: SingleContext['register']
  /** Unregister a radio ticket by id. */
  unregister: SingleContext['unregister']
  /** Select a ticket by id. */
  select: SingleContext['select']
}

export const [useRadioGroupContext, provideRadioGroupContext]
  = createContext<RadioGroupContext | null>('m3:radio-group', null)
