/**
 * What a form submits for a selection, one entry per chosen value as a
 * `<select multiple>` does: a scalar value as it is, a whole item (no
 * `item-value`) by its `id`.
 */
export function toFormValues(values: readonly unknown[]): string[] {
  return values.map((value) => {
    if (typeof value === 'object' && value !== null) {
      const id = (value as { id?: unknown }).id
      return id === undefined || id === null ? '' : String(id)
    }
    return value === undefined || value === null ? '' : String(value)
  })
}
