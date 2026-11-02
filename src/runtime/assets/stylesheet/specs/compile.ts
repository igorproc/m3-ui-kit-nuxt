import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compileString } from 'sass'

/** The kit's stylesheet root, where `additional.scss` and `themes/` live. */
export const STYLESHEET_ROOT = resolve(process.cwd(), 'src/runtime/assets/stylesheet')

/** The module emits these from the consumer's options at build time; a test stubs them. */
const STUBS: Record<string, string> = {
  '~material-kit-config': '$material-kit-breakpoints: (mobile: 600px, tablet: 905px, desktop: 1240px);\n'
    + '$material-kit-typeface: (brand: "Roboto, sans-serif", plain: "Roboto, sans-serif", mono: "monospace");',
  '~material-kit-themes': '',
}

/** Compiles `source` as if it sat at the stylesheet root, with the generated aliases stubbed. */
export function compileKitScss(source: string): string {
  return compileString(source, {
    url: pathToFileURL(`${STYLESHEET_ROOT}/entry.scss`),
    loadPaths: [STYLESHEET_ROOT],
    importers: [{
      canonicalize: url => (url in STUBS ? new URL(`kit-stub:${url}`) : null),
      load: canonical => ({ contents: STUBS[canonical.pathname] ?? '', syntax: 'scss' }),
    }],
    silenceDeprecations: [],
  }).css
}
