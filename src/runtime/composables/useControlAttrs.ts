import { useAttrs } from 'vue'

/**
 * Splits fallthrough attributes for a component whose root wraps a native
 * control: `class` and `style` stay on the root, everything else — `aria-*`,
 * `name`, `inputmode`, `data-*`, listeners — goes to the control, the way a
 * plain `<input>` would take them. Pair with `defineOptions({ inheritAttrs: false })`.
 *
 * Functions, not computeds: `useAttrs()` is not reactive, but it is current on
 * every render, so the template calls them.
 *
 * @example
 * <div v-bind="rootAttrs()"><input v-bind="controlAttrs()"></div>
 */
export function useControlAttrs() {
  const attrs = useAttrs()

  const rootAttrs = () => ({ class: attrs.class, style: attrs.style })

  const controlAttrs = () => {
    const { class: _class, style: _style, ...rest } = attrs
    return rest
  }

  return { rootAttrs, controlAttrs }
}
