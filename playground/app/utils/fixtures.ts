import type { Component } from 'vue'

/**
 * Every fixture under `playground/fixtures/<component>/<case>.vue`, keyed as
 * `<component>/<case>`. Eager on purpose: a lazy fixture hydrates after the app
 * mounts, so a test could press keys before its listeners exist.
 */
const modules = import.meta.glob<{ default: Component }>('../../fixtures/*/*.vue', { eager: true })

export const fixtures: Record<string, Component> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [path.replace(/^.*fixtures\/(.+)\.vue$/, '$1'), module.default]),
)

export const fixtureKeys = Object.keys(fixtures).sort()
