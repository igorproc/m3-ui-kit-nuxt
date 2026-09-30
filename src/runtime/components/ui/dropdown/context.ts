/**
 * @module dropdown/context
 *
 * @remarks
 * The panel's view of the dropdown. `<MDropdown>` provides it; anything
 * rendering rows consumes it — the kit's own default panel, and, more to the
 * point, a consumer's virtual or infinite list, which can sit at any depth and
 * so cannot be reached by slot scope alone.
 *
 * Rows are handed out in data order, and that order is also the keyboard order:
 * the registry appends a late registration to its end, which is exactly the
 * disagreement between DOM and navigation that keeps biting filtered lists.
 *
 * Namespace: `m3:dropdown`.
 */
import { createContext } from '#kit/shared/utils/context/createContext'
import type { DropdownContext } from '#kit/composables/dropdown/types'

export const [useDropdownContext, provideDropdownContext] = createContext<DropdownContext>('m3:dropdown')
