import { describe, expect, it } from 'vitest'
import { resolveTypography, typefaceToScss } from '../resolveTypography'
import { DEFAULT_FONTS, DEFAULT_TYPEFACE } from '../../../shared/constants/typography'

describe('resolveTypography', () => {
  it('falls back to Roboto when nothing is configured', () => {
    expect(resolveTypography()).toEqual({ typeface: DEFAULT_TYPEFACE, fonts: [...DEFAULT_FONTS] })
  })

  it('replaces the default fonts instead of adding to them', () => {
    const { fonts } = resolveTypography({ fonts: ['/fonts/inter.css'] })

    expect(fonts).toEqual(['/fonts/inter.css'])
  })

  it('loads nothing for `false` or an empty list', () => {
    expect(resolveTypography({ fonts: false }).fonts).toEqual([])
    expect(resolveTypography({ fonts: [] }).fonts).toEqual([])
  })

  it('drops duplicate stylesheets', () => {
    expect(resolveTypography({ fonts: ['/a.css', '/a.css'] }).fonts).toEqual(['/a.css'])
  })

  it('overrides only the typeface roles that are set', () => {
    const { typeface } = resolveTypography({ typeface: { brand: '\'Google Sans\', sans-serif', plain: '  ' } })

    expect(typeface).toEqual({ ...DEFAULT_TYPEFACE, brand: '\'Google Sans\', sans-serif' })
  })
})

describe('typefaceToScss', () => {
  it('emits every role as a quoted Sass string', () => {
    const scss = typefaceToScss({ brand: '\'Google Sans\', sans-serif', plain: 'Inter', mono: 'monospace' })

    expect(scss).toBe(
      '$material-kit-typeface: (\n'
      + '  brand: "\'Google Sans\', sans-serif",\n'
      + '  plain: "Inter",\n'
      + '  mono: "monospace",\n'
      + ');\n',
    )
  })
})
