import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'
import { usePopover } from './usePopover'
import type { UsePopoverOptions } from './usePopover'

function anchorAt(top: number, left: number, width = 100, height = 40) {
  const el = document.createElement('button')
  el.getBoundingClientRect = () => ({ top, left, width, height, bottom: top + height, right: left + width, x: left, y: top, toJSON: () => ({}) })
  document.body.appendChild(el)
  return el
}

function surfaceOf(style: Partial<CSSStyleDeclaration>) {
  const el = document.createElement('div')
  Object.assign(el.style, style)
  document.body.appendChild(el)
  return el
}

function run(options: UsePopoverOptions) {
  const scope = effectScope()
  const popover = scope.run(() => usePopover(ref(true), { strategy: 'fixed', ...options }))!
  return { popover, scope }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('usePopover', () => {
  describe('native path', () => {
    it.each([
      ['bottom-start', 'block-end span-inline-end', 'margin-block-start'],
      ['top', 'block-start', 'margin-block-end'],
      ['end-center', 'inline-end', 'margin-inline-start'],
      ['start-end', 'inline-start span-block-start', 'margin-inline-end'],
    ] as const)('places %s at %s, offset on %s', (placement, area, margin) => {
      const { popover, scope } = run({ strategy: 'anchor', placement, offset: 4 })

      expect(popover.popoverStyle.value['position-area']).toBe(area)
      expect(popover.popoverStyle.value[margin]).toBe('4px')
      scope.stop()
    })
  })

  describe('offset', () => {
    it('hands a CSS length to the native path as it is', () => {
      const { popover, scope } = run({ strategy: 'anchor', placement: 'top', offset: '4rem' })

      expect(popover.popoverStyle.value['margin-block-end']).toBe('4rem')
      scope.stop()
    })

    // The kit's rem scales with the window: the JS path reads the live size.
    it('turns a rem offset into pixels by the root font size in the JS path', () => {
      document.documentElement.style.fontSize = '2px'
      const trigger = anchorAt(500, 300)
      const surface = surfaceOf({ boxSizing: 'border-box', width: '100px', height: '50px' })
      const { popover, scope } = run({ trigger, surface, placement: 'top-start', offset: '4rem' })

      popover.reposition()

      expect(popover.popoverStyle.value.top).toBe(`${500 - 50 - 8}px`)
      document.documentElement.style.fontSize = ''
      scope.stop()
    })
  })

  describe('direction', () => {
    it('reads the trigger’s direction when it measures', () => {
      const trigger = anchorAt(100, 300)
      trigger.setAttribute('dir', 'rtl')
      trigger.style.direction = 'rtl'
      const { popover, scope } = run({ trigger, placement: 'bottom-start' })

      popover.reposition()

      expect(popover.direction.value).toBe('rtl')
      scope.stop()
    })

    it('gives the surface the trigger’s direction and mirrors the native area where the root runs the other way', () => {
      const trigger = anchorAt(100, 300)
      trigger.style.direction = 'rtl'
      const { popover, scope } = run({ trigger, strategy: 'anchor', placement: 'bottom-start' })

      popover.reposition()

      expect(popover.surfaceDir.value).toBe('rtl')
      expect(popover.popoverStyle.value['position-area']).toBe('block-end span-inline-start')
      scope.stop()
    })

    it('leaves the surface to inherit when the trigger runs with the root', () => {
      const trigger = anchorAt(100, 300)
      const { popover, scope } = run({ trigger, strategy: 'anchor', placement: 'bottom-start' })

      popover.reposition()

      expect(popover.surfaceDir.value).toBeUndefined()
      expect(popover.popoverStyle.value['position-area']).toBe('block-end span-inline-end')
      scope.stop()
    })

    it('mirrors a start placement in the JS path for an RTL trigger', () => {
      const trigger = anchorAt(100, 300, 100)
      trigger.style.direction = 'rtl'
      const surface = surfaceOf({ boxSizing: 'border-box', width: '200px', height: '50px' })
      const { popover, scope } = run({ trigger, surface, placement: 'bottom-start' })

      popover.reposition()

      expect(popover.popoverStyle.value.left).toBe(`${400 - 200}px`)
      scope.stop()
    })
  })

  describe('JS path measuring', () => {
    // At a fractional rem the drawn box is not a whole number of pixels; a
    // rounded `offsetHeight` would open a gap of up to half a pixel.
    it('measures the fractional layout size of the surface', () => {
      const trigger = anchorAt(500, 300)
      const surface = surfaceOf({ boxSizing: 'border-box', width: '200.25px', height: '136.547px' })
      const { popover, scope } = run({ trigger, surface, placement: 'top-start', offset: 8 })

      popover.reposition()

      expect(Number.parseFloat(popover.popoverStyle.value.top!)).toBeCloseTo(500 - 136.547 - 8, 3)
      scope.stop()
    })

    it('adds padding and border of a content-box surface', () => {
      const trigger = anchorAt(500, 300)
      const surface = surfaceOf({ boxSizing: 'content-box', width: '200px', height: '100.5px', paddingTop: '4.25px', paddingBottom: '4.25px', borderTopWidth: '1px', borderBottomWidth: '1px', borderStyle: 'solid' })
      const { popover, scope } = run({ trigger, surface, placement: 'top-start', offset: 0 })

      popover.reposition()

      expect(Number.parseFloat(popover.popoverStyle.value.top!)).toBeCloseTo(500 - (100.5 + 8.5 + 2), 3)
      scope.stop()
    })
  })

  // Ш1-д5: a surface in the top layer needs no z-index, and one outside it takes its stack's.
  describe('stacking', () => {
    it('writes no z-index of its own', () => {
      const { popover, scope } = run({ strategy: 'anchor', placement: 'bottom' })

      expect(popover.popoverStyle.value['z-index']).toBeUndefined()
      scope.stop()
    })

    it('writes the z-index it is given', () => {
      const { popover, scope } = run({ placement: 'bottom', zIndex: 2010 })

      expect(popover.popoverStyle.value['z-index']).toBe('2010')
      scope.stop()
    })
  })

  // Ш2-origin: the side the surface actually took after a flip.
  describe('placement taken', () => {
    it('follows the JS flip', () => {
      const trigger = anchorAt(760, 300)
      const surface = surfaceOf({ boxSizing: 'border-box', width: '200px', height: '150px' })
      const { popover, scope } = run({ trigger, surface, placement: 'bottom-start' })

      popover.reposition()

      expect(popover.placement.value).toBe('top-start')
      scope.stop()
    })

    it('reads the native flip off the laid-out boxes', () => {
      const trigger = anchorAt(760, 300)
      const surface = surfaceOf({})
      surface.getBoundingClientRect = () => ({ top: 610, left: 300, width: 200, height: 150, bottom: 760, right: 500, x: 300, y: 610, toJSON: () => ({}) })
      const { popover, scope } = run({ trigger, surface, strategy: 'anchor', placement: 'bottom-start' })

      expect(popover.placement.value).toBe('bottom-start')
      popover.reposition()

      expect(popover.placement.value).toBe('top-start')
      scope.stop()
    })
  })
})
