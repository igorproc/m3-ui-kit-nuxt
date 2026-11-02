/**
 * @module number-input/unit
 *
 * @remarks
 * The unit choices of a number input, read once for the zone that shows them
 * and for the spinbutton that says them with its value.
 */

/** One unit choice; a bare string is its own value and label. */
export type NumberInputUnitEntry = string | { value: string, label?: string }

export interface NumberInputUnitOption {
  value: string
  label: string
}

export function normalizeUnits(units: readonly NumberInputUnitEntry[] | undefined): NumberInputUnitOption[] {
  return (units ?? []).map(unit => (typeof unit === 'string'
    ? { value: unit, label: unit }
    : { value: unit.value, label: unit.label ?? unit.value }))
}

/**
 * What the unit zone shows: the label of the chosen unit, the unit itself when
 * it is not a choice of the list, or the first choice while none is made.
 */
export function shownUnit(units: readonly NumberInputUnitEntry[] | undefined, unit: string | null | undefined): string | undefined {
  const options = normalizeUnits(units)

  return options.find(option => option.value === unit)?.label ?? unit ?? options[0]?.label
}
