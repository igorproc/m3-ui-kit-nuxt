import { watchEffect } from 'vue'

/**
 * Warns in dev, once per missing phrase, when a component shows a part the
 * app has not named: the kit ships no English copy, and a part without its
 * words is a part a reader cannot use.
 *
 * Must be called in `setup`.
 *
 * @param component Tag shown in the warning, e.g. `'m-date-picker'`.
 * @param phrases Each prop (kebab-case) the parts on screen need, mapped to
 *   whether it is there. Read reactively: a part that appears later is checked then.
 */
export function useMissingPhrasesWarning(component: string, phrases: () => Record<string, unknown>) {
  if (!import.meta.dev) return

  const warned = new Set<string>()
  watchEffect(() => {
    for (const [prop, present] of Object.entries(phrases())) {
      if (present || warned.has(prop)) continue
      warned.add(prop)
      console.warn(`[${component}] a part on screen has no words: pass \`${prop}\` — the kit ships no copy of its own.`)
    }
  })
}
