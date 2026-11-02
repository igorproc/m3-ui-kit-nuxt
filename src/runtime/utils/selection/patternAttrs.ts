/**
 * The ARIA pattern a `MSelectionGroup` hands its consumer (W27-Б):
 * - `toggle` — buttons with `aria-pressed` in a `group`;
 * - `radio` — `radio`s in a `radiogroup`;
 * - `checkbox` — `checkbox`es in a `group`;
 * - `option` — `option`s in a `listbox`.
 * Without a pattern the group hands out nothing, as before.
 */
export type MSelectionPattern = 'toggle' | 'radio' | 'checkbox' | 'option'

export interface PatternItemState {
  isSelected: boolean
  isDisabled: boolean
  isSelectionBlocked: boolean
}

export type PatternAttrs = Record<string, string | boolean | undefined>

const GROUP_ROLE: Record<MSelectionPattern, string> = {
  toggle: 'group',
  radio: 'radiogroup',
  checkbox: 'group',
  option: 'listbox',
}

/** Attributes for the element that wraps the items. */
export function groupPatternAttrs(pattern: MSelectionPattern | undefined, multiple: boolean, disabled = false): PatternAttrs {
  if (!pattern) return {}

  return {
    'role': GROUP_ROLE[pattern],
    'aria-multiselectable': pattern === 'option' && multiple ? 'true' : undefined,
    'aria-disabled': disabled ? 'true' : undefined,
  }
}

/**
 * Attributes for one item. A disabled item and one blocked by `max` both read
 * as unavailable (`aria-disabled`) and stay discoverable.
 */
export function itemPatternAttrs(pattern: MSelectionPattern | undefined, state: PatternItemState): PatternAttrs {
  if (!pattern) return {}

  const unavailable = state.isDisabled || state.isSelectionBlocked ? 'true' : undefined
  const selected = state.isSelected ? 'true' : 'false'

  if (pattern === 'toggle') return { 'aria-pressed': selected, 'aria-disabled': unavailable }
  if (pattern === 'option') return { 'role': 'option', 'aria-selected': selected, 'aria-disabled': unavailable }

  return { 'role': pattern, 'aria-checked': selected, 'aria-disabled': unavailable }
}
