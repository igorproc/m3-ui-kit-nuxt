import type { Component } from 'vue'

/**
 * Every fixture under `playground/fixtures/<component>/<case>.vue`, keyed as
 * `<component>/<case>`. Loaded lazily so a fixture page only pulls its own case.
 */
const modules = import.meta.glob<{ default: Component }>('../../fixtures/*/*.vue')

export const fixtureLoaders: Record<string, () => Promise<{ default: Component }>> = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [path.replace(/^.*fixtures\/(.+)\.vue$/, '$1'), load]),
)

export const fixtureKeys = Object.keys(fixtureLoaders).sort()
