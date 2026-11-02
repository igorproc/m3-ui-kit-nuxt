import { describe, expect, it } from 'vitest'
import { compileKitScss } from './compile'

/** Compiled CSS with quotes dropped and whitespace collapsed, for plain substring checks. */
function compile(source: string) {
  return compileKitScss(`@use "additional" as *;\n${source}`).replace(/"/g, '').replace(/\s+/g, ' ')
}

// Q1-Б: a palette written with the mixin covers `system` itself — the light block is
// shared, the dark one repeated under `prefers-color-scheme: dark` — so its first paint
// follows the reader without script.
describe('theme-definition', () => {
  const css = compile('@include theme-definition("light", "brand") { --tone: light; }\n@include theme-definition("dark", "brand") { --tone: dark; }')

  it('gives system the light block', () => {
    expect(css).toContain('[data-definition=light][data-palette=brand], [data-definition=system][data-palette=brand] { --tone: light; }')
  })

  it('keeps the dark block for dark, and repeats it for system under prefers-color-scheme: dark', () => {
    expect(css).toContain('[data-definition=dark][data-palette=brand] { --tone: dark; }')
    expect(css).toContain('@media (prefers-color-scheme: dark) { [data-definition=system][data-palette=brand] { --tone: dark; } }')
  })

  it('carries a contrast level onto the system selectors too', () => {
    const contrast = compile('@include theme-definition("light", "brand", "high") { --tone: light; }\n@include theme-definition("dark", "brand", "high") { --tone: dark; }')

    expect(contrast).toContain('[data-definition=light][data-palette=brand][data-contrast=high], [data-definition=system][data-palette=brand][data-contrast=high] { --tone: light; }')
    expect(contrast).toContain('@media (prefers-color-scheme: dark) { [data-definition=system][data-palette=brand][data-contrast=high] { --tone: dark; } }')
  })
})
