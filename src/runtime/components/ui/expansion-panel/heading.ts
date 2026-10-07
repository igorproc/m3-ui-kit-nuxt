import { h } from 'vue'
import type { FunctionalComponent } from 'vue'

/**
 * Wraps its slot in the element `tag` names, or renders the slot bare when
 * there is none — a panel without `headingLevel` keeps its header button
 * unwrapped, as it always was. Attributes apply only to the wrapper.
 */
export const OptionalHeading: FunctionalComponent<{ tag?: string }> = (props, { attrs, slots }) =>
  (props.tag ? h(props.tag, attrs, slots.default?.()) : slots.default?.())

OptionalHeading.props = ['tag']
OptionalHeading.inheritAttrs = false
