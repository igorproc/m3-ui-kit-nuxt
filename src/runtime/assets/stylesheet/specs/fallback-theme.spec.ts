import { describe, expect, it } from 'vitest'
import { compileKitScss } from './compile'

const css = compileKitScss('@use "themes/base";')

const LIGHT = '[data-definition=light][data-palette=_m3-fallback]'
const SYSTEM = '[data-definition=system][data-palette=_m3-fallback]'
const DARK = '[data-definition=dark][data-palette=_m3-fallback]'

/** The declarations of the first rule whose selector list includes `selector`, whitespace collapsed. */
function block(source: string, selector: string) {
  const normalized = source.replace(/"/g, '')
  const start = normalized.indexOf(selector)
  if (start < 0) return ''
  return normalized.slice(normalized.indexOf('{', start), normalized.indexOf('}', start)).replace(/\s+/g, ' ')
}

const darkMedia = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))

describe('the static fallback palette', () => {
  // B2.4c: overlays read `scrim`, alerts and badges the semantic roles; the fallback had neither.
  it.each([[LIGHT, css], [DARK, css]])('%s defines scrim and every semantic role', (selector, source) => {
    const declarations = block(source, selector)

    for (const role of ['scrim', 'success', 'on-success', 'success-container', 'on-success-container', 'warning', 'on-warning-container', 'info', 'info-container']) {
      expect(declarations, role).toContain(`--md-sys-color-${role}:`)
    }
  })

  // Q1-Б: `system` resolves in the stylesheet, so the first paint follows the reader.
  it('gives system the light tokens, and the dark ones under prefers-color-scheme: dark', () => {
    expect(block(css, SYSTEM)).toBe(block(css, LIGHT))
    expect(block(darkMedia, SYSTEM)).toBe(block(css, DARK))
    expect(block(darkMedia, SYSTEM)).toContain('color-scheme: dark')
  })
})
