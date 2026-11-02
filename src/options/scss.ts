type PreludeResult = string | { content: string, map?: unknown }
type PreludeFunction = (source: string, filename: string) => PreludeResult | Promise<PreludeResult>

interface ScssPreprocessorOptions {
  additionalData?: unknown
}

/**
 * Prepends the kit's abstract prelude (functions, mixins, system vars) to every
 * SCSS entry, so `g()`, the mixins and `$material-kit-*` are in scope, while
 * keeping any prelude the app already declared: a string stays after the kit's,
 * and a function is wrapped, its result put after the kit's prelude.
 *
 * Mutates `scss` (Vite's `css.preprocessorOptions.scss`).
 */
export function prependScssPrelude(scss: ScssPreprocessorOptions, preludePath: string) {
  const prelude = `@use "${preludePath.replace(/\\/g, '/')}" as *;\n`
  const previous = scss.additionalData

  if (typeof previous === 'function') {
    const own = previous as PreludeFunction
    scss.additionalData = async (source: string, filename: string): Promise<PreludeResult> => {
      const result = await own(source, filename)
      return typeof result === 'string' ? `${prelude}${result}` : { ...result, content: `${prelude}${result.content}` }
    }
    return
  }

  scss.additionalData = `${prelude}${typeof previous === 'string' ? previous : ''}`
}
