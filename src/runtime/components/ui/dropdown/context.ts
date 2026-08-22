/**
 * @module dropdown/context
 *
 * @remarks
 * Per-instance context pair for the compound `<MDropdown>` API. The orchestrator
 * (`index.vue`) owns the registry-backed selection plus the popover open state
 * and provides a {@link DropdownContext}; the leaves (`trigger`, `panel`,
 * `option`, `selected-chips`) consume it. Namespace: `m3:dropdown`.
 */
import { createContext } from '#kit/shared/utils/context/createContext'
import type { DropdownContext } from './types'

export const [useDropdownContext, provideDropdownContext] = createContext<DropdownContext>('m3:dropdown')
