import { h } from 'vue'
import type { FunctionalComponent } from 'vue'

/**
 * Puts a list row inside the `li` its `ul` requires, or renders the row alone.
 * A functional wrapper rather than two copies of the row's template.
 */
export const ListRow: FunctionalComponent<{ wrap: boolean }> = (props, { slots }) => {
  const row = slots.default?.()
  return props.wrap ? h('li', { class: 'ui-list__row' }, row) : row?.[0]
}

ListRow.props = { wrap: { type: Boolean, required: true } }
