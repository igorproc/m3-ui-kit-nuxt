/**
 * What the open panel of the selection family shows besides its rows. Pure:
 * no Vue, no DOM.
 */
import type { MDropdownMessages } from '#kit/components/ui/dropdown/props'

/** `rows` — options are listed; the rest name the message shown instead. */
export type DropdownPanelState = 'rows' | 'loading' | 'empty' | 'no-results' | 'hint'

export interface PanelStateInput {
  rows: number
  loading: boolean
  /** The items before filtering; `rows` may be zero only because of a query. */
  items: number
  /** `false` while the query is shorter than the minimum (autocomplete). */
  queryReady: boolean
}

export function panelState({ rows, loading, items, queryReady }: PanelStateInput): DropdownPanelState {
  if (rows > 0) return 'rows'
  if (!queryReady) return 'hint'
  if (loading) return 'loading'
  return items > 0 ? 'no-results' : 'empty'
}

const STATE_MESSAGE = { 'empty': 'empty', 'no-results': 'noResults', 'hint': undefined } as const

/**
 * Whether a state has anything to show: rows, a progress bar, or a message
 * from its slot or from `messages`. An open panel with none of these is an
 * empty strip, so the panel does not open onto it.
 *
 * @param state What the panel would show.
 * @param hasSlot Whether the owner received the slot of that name.
 * @param messages The owner's phrases.
 */
export function panelHasContent(state: DropdownPanelState, hasSlot: (name: string) => boolean, messages?: MDropdownMessages): boolean {
  if (state === 'rows' || state === 'loading') return true
  const key = STATE_MESSAGE[state]
  return hasSlot(state) || Boolean(key && messages?.[key])
}
