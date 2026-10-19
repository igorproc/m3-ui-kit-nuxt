const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com'
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com'

// A type alias, not an interface: `useHead` expects link objects with an index signature
// (`data-*`), which TypeScript infers for aliases but never for interfaces.
export type FontLink = {
  rel: 'preconnect' | 'stylesheet'
  href: string
  crossorigin?: 'anonymous'
}

/**
 * `<link>`s for the font stylesheets, preceded by preconnects to every foreign origin
 * they live on. Paths on the app's own origin (`/fonts/…` from `public/`) need none.
 *
 * A stylesheet is fetched without CORS and the font files it references with it, and
 * the browser keeps a separate connection for each mode — so an S3/CDN origin that
 * serves both gets both preconnects. Google splits them across two hosts instead.
 */
export function buildFontLinks(fonts: string[]): FontLink[] {
  const preconnects = new Map<string, FontLink>()

  const preconnect = (href: string, crossorigin?: 'anonymous') => {
    preconnects.set(`${href} ${crossorigin ?? ''}`, { rel: 'preconnect', href, ...(crossorigin && { crossorigin }) })
  }

  for (const href of fonts) {
    const origin = foreignOrigin(href)
    if (!origin) continue

    preconnect(origin)
    preconnect(origin === GOOGLE_FONTS_CSS ? GOOGLE_FONTS_FILES : origin, 'anonymous')
  }

  const stylesheets = fonts.map((href): FontLink => ({ rel: 'stylesheet', href }))

  return [...preconnects.values(), ...stylesheets]
}

function foreignOrigin(href: string): string | null {
  if (!/^(?:https?:)?\/\//i.test(href)) return null

  // The base only completes a protocol-relative `//cdn…` URL.
  return new URL(href, 'https://localhost').origin
}
