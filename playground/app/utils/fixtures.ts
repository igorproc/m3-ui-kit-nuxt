import type { Component } from 'vue'

/**
 * Every fixture under `playground/fixtures/<component>/<case>.vue`, keyed as
 * `<component>/<case>`, loaded on demand. Lazy on purpose: one fixture (or a
 * component it renders) that fails to compile must break only its own pages,
 * not the whole playground that every e2e run shares. The fixture page awaits
 * the loader in setup, so the fixture is still part of the first render and of
 * hydration.
 */
const modules = import.meta.glob<{ default: Component }>('../../fixtures/*/*.vue')

export const fixtures: Record<string, () => Promise<{ default: Component }>> = Object.fromEntries(
  Object.entries(modules).map(([path, loader]) => [path.replace(/^.*fixtures\/(.+)\.vue$/, '$1'), loader]),
)

export const fixtureKeys = Object.keys(fixtures).sort()
