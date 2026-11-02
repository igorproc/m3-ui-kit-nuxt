import { mergeProps, useAttrs } from 'vue'

/**
 * Splits fallthrough attributes for a component whose root wraps a native
 * control: `class` and `style` stay on the root, everything else — `aria-*`,
 * `name`, `inputmode`, `data-*`, listeners — goes to the control, the way a
 * plain `<input>` would take them. Pair with `defineOptions({ inheritAttrs: false })`.
 *
 * Functions, not computeds: `useAttrs()` is not reactive, but it is current on
 * every render, so the template calls them.
 *
 * `controlAttrs(own)` merges the component's own attribute bag on top: own
 * values win on a clash, but listeners are chained rather than replaced, so a
 * consumer's `@keydown` still fires next to the component's. An own key left
 * `undefined` says nothing, so it leaves the consumer's value in place.
 *
 * @example
 * <div v-bind="rootAttrs()"><input v-bind="controlAttrs(inputAttrs)"></div>
 */
export function useControlAttrs() {
  const attrs = useAttrs()

  const rootAttrs = () => ({ class: attrs.class, style: attrs.style })

  const controlAttrs = (own?: object) => {
    const { class: _class, style: _style, ...rest } = attrs
    if (!own) return rest

    const said = Object.fromEntries(Object.entries(own).filter(([, value]) => value !== undefined))
    return mergeProps(rest, said)
  }

  return { rootAttrs, controlAttrs }
}
