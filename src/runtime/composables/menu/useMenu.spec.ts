import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { placementOrigin, useMenu } from './useMenu'
import type { UseMenuOptions } from './useMenu'

function run(options: Partial<UseMenuOptions> = {}) {
  const scope = effectScope()
  const menu = scope.run(() => useMenu(ref(false), {
    placement: () => 'bottom-start',
    matchWidth: () => false,
    ...options,
  }))!
  return { menu, scope }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useMenu', () => {
  it('uses the anchor width in the native CSS anchor path', () => {
    vi.spyOn(CSS, 'supports').mockReturnValue(true)
    const { menu, scope } = run({ matchWidth: () => true })

    expect(menu.menuStyle.value.width).toBe('anchor-size(width)')
    scope.stop()
  })

  // `vi.spyOn(CSS, 'supports')` does not reach the module's `CSS` under the
  // nuxt environment (happy-dom answers `true` to everything); stub the global.
  it('lets the native anchor path flip at the viewport edges', () => {
    vi.stubGlobal('CSS', { supports: () => true })
    const { menu, scope } = run({ placement: () => 'bottom-end' })

    expect(menu.menuStyle.value['position-area']).toBe('block-end span-inline-start')
    expect(menu.menuStyle.value['position-try-fallbacks']).toBe('flip-block, flip-inline, flip-block flip-inline')
    scope.stop()
  })

  it.each([
    ['bottom-start', 'block-end span-inline-end'],
    ['bottom-end', 'block-end span-inline-start'],
    ['bottom', 'block-end'],
    ['top-start', 'block-start span-inline-end'],
    ['end-start', 'inline-end span-block-end'],
  ] as const)('places %s at the logical area %s', (placement, area) => {
    vi.stubGlobal('CSS', { supports: () => true })
    const { menu, scope } = run({ placement: () => placement })

    expect(menu.menuStyle.value['position-area']).toBe(area)
    scope.stop()
  })

  it('falls back to JS placement when anchoring cannot flip', () => {
    vi.stubGlobal('CSS', {
      supports: (declaration: string) => !declaration.startsWith('position-try-fallbacks'),
    })
    const { menu, scope } = run()

    expect(menu.isAnchorSupported.value).toBe(false)
    expect(menu.menuStyle.value['position-anchor']).toBeUndefined()
    expect(menu.menuStyle.value.top).toBeDefined()
    scope.stop()
  })

  it('writes the growth corner into the transform-origin bridge', () => {
    const { menu, scope } = run({ placement: () => 'bottom-end' })

    expect(menu.menuStyle.value['--ui-menu-origin']).toBe('top right')
    scope.stop()
  })
})

describe('placementOrigin', () => {
  it.each([
    ['bottom-start', 'ltr', 'top left'],
    ['bottom-start', 'rtl', 'top right'],
    ['bottom-end', 'ltr', 'top right'],
    ['bottom-end', 'rtl', 'top left'],
    ['bottom', 'ltr', 'top center'],
    ['top-start', 'ltr', 'bottom left'],
    ['end-start', 'ltr', 'top left'],
    ['end-start', 'rtl', 'top right'],
    ['start-end', 'ltr', 'bottom right'],
    ['start', 'rtl', 'center left'],
  ] as const)('grows a %s menu (%s) out of its %s corner', (placement, direction, origin) => {
    expect(placementOrigin(placement, direction)).toBe(origin)
  })
})
