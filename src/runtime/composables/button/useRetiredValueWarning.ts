import { watchEffect } from 'vue'

/**
 * Dev-only warning for a prop value the button family has retired. The value
 * keeps rendering for one release; the warning names what replaces it, so a
 * consumer migrates before the value is removed.
 *
 * @param component Tag shown in the warning, e.g. `'m-button-icon'`.
 * @param prop Name of the prop that carries the retired value.
 * @param read Reads the current value of that prop.
 * @param replacements Retired value → the replacement to suggest.
 */
export function useRetiredValueWarning(
  component: string,
  prop: string,
  read: () => unknown,
  replacements: Record<string, string>,
) {
  if (!import.meta.dev) return

  watchEffect(() => {
    const value = read()
    if (typeof value !== 'string' || !Object.hasOwn(replacements, value)) return

    console.warn(`[${component}] \`${prop}="${value}"\` is retired: use ${replacements[value]}.`)
  })
}

/**
 * Dev-only warning for a prop the button family has retired as a whole: any
 * value it receives still works for one release, and the warning names the
 * prop that replaces it.
 *
 * @param component Tag shown in the warning, e.g. `'m-button-split'`.
 * @param prop The retired prop.
 * @param read Reads the retired prop; `undefined` means it is not in use.
 * @param replacement What to use instead.
 */
export function useRetiredPropWarning(component: string, prop: string, read: () => unknown, replacement: string) {
  if (!import.meta.dev) return

  watchEffect(() => {
    if (read() === undefined) return

    console.warn(`[${component}] \`${prop}\` is retired: use ${replacement}.`)
  })
}
