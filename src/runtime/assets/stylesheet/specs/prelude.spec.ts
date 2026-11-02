import { describe, expect, it } from 'vitest'
import { compileKitScss } from './compile'

// The module prepends this prelude to every SCSS entry of the app, so whatever it emits
// is repeated in every compiled sheet.
describe('the abstract prelude', () => {
  // B1.6c: seven `/* */` section comments were copied into every sheet.
  it('emits no CSS of its own, not even comments', () => {
    expect(compileKitScss('@use "additional" as *;').trim()).toBe('')
  })

  // B1.6a: `$material-kit-*` (breakpoints, typefaces) is in scope wherever the prelude is.
  it('forwards the generated `$material-kit-*` config', () => {
    const css = compileKitScss('@use "sass:map";\n@use "additional" as *;\n.probe { --breakpoints: #{map.keys($material-kit-breakpoints)}; }')

    expect(css).toContain('--breakpoints: mobile, tablet, desktop')
  })

  // B1.6d: `bp-tablet` read the top of the tablet band (1199) and `bp-desktop` the top of
  // the desktop one (1920); `useBreakpoint` and the layout start each band at its `-xs` key.
  it.each([
    ['bp-tablet', '768px'],
    ['bp-desktop', '1200px'],
  ])('%s starts at the band\'s first width, %s', (mixin, width) => {
    const css = compileKitScss(`@use "additional" as *;\n@include ${mixin} { .probe { color: red; } }`)

    expect(css).toContain(`(min-width: ${width})`)
  })
})
