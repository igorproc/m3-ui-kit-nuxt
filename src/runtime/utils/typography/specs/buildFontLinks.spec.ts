import { describe, expect, it } from 'vitest'
import { buildFontLinks } from '../buildFontLinks'

describe('buildFontLinks', () => {
  it('preconnects Google Fonts to both its CSS and its file host', () => {
    const href = 'https://fonts.googleapis.com/css2?family=Roboto&display=swap'

    expect(buildFontLinks([href])).toEqual([
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
      { rel: 'stylesheet', href },
    ])
  })

  it('preconnects a bucket origin in both fetch modes', () => {
    const href = 'https://assets.s3.example.com/fonts/inter.css'

    expect(buildFontLinks([href])).toEqual([
      { rel: 'preconnect', href: 'https://assets.s3.example.com' },
      { rel: 'preconnect', href: 'https://assets.s3.example.com', crossorigin: 'anonymous' },
      { rel: 'stylesheet', href },
    ])
  })

  it('completes a protocol-relative URL', () => {
    const [first] = buildFontLinks(['//cdn.example.com/fonts.css'])

    expect(first).toEqual({ rel: 'preconnect', href: 'https://cdn.example.com' })
  })

  it('needs no preconnect for files served from public/', () => {
    expect(buildFontLinks(['/fonts/inter.css', 'fonts/mono.css'])).toEqual([
      { rel: 'stylesheet', href: '/fonts/inter.css' },
      { rel: 'stylesheet', href: 'fonts/mono.css' },
    ])
  })

  it('preconnects a shared origin once', () => {
    const links = buildFontLinks([
      'https://fonts.googleapis.com/css2?family=Roboto',
      'https://fonts.googleapis.com/css2?family=Roboto+Mono',
    ])

    expect(links.filter(link => link.rel === 'preconnect')).toHaveLength(2)
  })

  it('returns nothing for no fonts', () => {
    expect(buildFontLinks([])).toEqual([])
  })
})
