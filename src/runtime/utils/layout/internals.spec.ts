import { describe, expect, it } from 'vitest'

describe('layout internals', () => {
  // B1.7a: everything under `composables/**` is auto-imported into the app. The
  // carving engine, the CSS builder, the zone registry, the scroll lock and the
  // zone state are internals of `useLayout`, not API.
  it('stay out of the auto-imported composables', () => {
    const layoutComposables = Object.keys(import.meta.glob('../../composables/**/*.ts'))
      .filter(path => /layout/i.test(path) && !path.endsWith('.spec.ts'))
      .map(path => path.split('/').at(-1))

    expect(layoutComposables).toEqual(['useLayout.ts'])
  })

  it('live together under utils/layout', () => {
    const internals = Object.keys(import.meta.glob('./*.ts'))
      .filter(path => !path.endsWith('.spec.ts'))
      .map(path => path.split('/').at(-1))
      .sort()

    expect(internals).toEqual(['carve.ts', 'css.ts', 'registry.ts', 'scroll.ts', 'zone.ts'])
  })
})
