import { describe, expect, it } from 'vitest'
import { prependScssPrelude } from './scss'

type Scss = { additionalData?: unknown }

const PRELUDE = '@use "/kit/additional.scss" as *;\n'

describe('SCSS prelude injection', () => {
  it('sets the prelude when the app declares none', () => {
    const scss: Scss = {}

    prependScssPrelude(scss, '/kit/additional.scss')

    expect(scss.additionalData).toBe(PRELUDE)
  })

  it('keeps a string prelude the app already declared, after the kit\'s', () => {
    const scss: Scss = { additionalData: '$brand: teal;\n' }

    prependScssPrelude(scss, '/kit/additional.scss')

    expect(scss.additionalData).toBe(`${PRELUDE}$brand: teal;\n`)
  })

  // B1.6b: a function `additionalData` was replaced by the bare prelude, dropping the app's.
  it('wraps a function prelude the app declared, keeping what it returns', async () => {
    const scss: Scss = { additionalData: async (source: string, file: string) => `/* ${file} */\n${source}` }

    prependScssPrelude(scss, '/kit/additional.scss')
    const wrapped = scss.additionalData as (source: string, file: string) => Promise<string>

    expect(await wrapped('.a { b: c }', 'card.vue')).toBe(`${PRELUDE}/* card.vue */\n.a { b: c }`)
  })

  it('normalizes Windows separators in the prelude path', () => {
    const scss: Scss = {}

    prependScssPrelude(scss, 'C:\\kit\\additional.scss')

    expect(scss.additionalData).toBe('@use "C:/kit/additional.scss" as *;\n')
  })
})
